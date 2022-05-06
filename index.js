#!/usr/local/bin/node

// load the config loader module and set it up
const Configure = require('./configure.js');
const configJson = './config.json';
let config = Configure.readConfigSync(configJson);

// load user management
const Pronouns = require('./pronouns.js');
const pronounsJson = './pronouns.json';
let pronouns = Pronouns.readSync(pronounsJson);

// load discord.js and create the client
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.GUILD_MESSAGES | Intents.DIRECT_MESSAGES]});

const { SlashCommandBuilder } = require('@discordjs/builders');

client.login(config.token);

const reloadConfig = () => {
    console.log("updateing config!");

    // read the config, this is just a wrapper that handles errors
    Configure.readConfig(configJson, (value) => {
        // set new config
        config = value;

        updateSlashCommands();
    });

    Pronouns.read(pronounsJson, (value) => {
        pronouns = value;
    })
};

// update slash commands
const updateSlashCommands = () => {
    let emotes = Object.entries(config.emotes).sort();
    let commands = [];

    // split every emote into key + singular and plural version
    for (const [key, [singular, _]] of emotes) {
        let description = singular;
        if (description.length > 100) {
            description = description.substr(0, 99);
        }
        
        // Build Slash Command
        const data = new SlashCommandBuilder()
                    .setName(key)
                    .setDescription(description)
                    .addUserOption(option => 
                        option.setName("target")
                            .setDescription("The target of the emote, if any.")
                            .setRequired(false))
        commands[commands.length] = data;
    }

    commands[commands.length] = new SlashCommandBuilder()
                        .setName("pronouns")
                        .setDescription("Setup your pronouns for this bot.")
                        .addStringOption(option =>
                            option.setName('subject')
                                .setDescription("The subject pronoun. E.g. he/she/they")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("object")
                                .setDescription("The object pronoun. E.g. him/her/them")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("dependent_possessive")
                                .setDescription("The dependent possessive pronoun. E.g. his/her/their")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("independent_possessive")
                                .setDescription("The independent possessive pronoun. E.g. his/hers/theirs")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("reflexive")
                                .setDescription("The reflexive pronoun. E.g. himself/herself/themself")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("be")
                                .setDescription("The proper form of to be. E.g. is/are")
                                .setRequired(true))

    // send commands to the server
    client.application.commands.set(commands)
        .then(console.log)
        .catch(console.error);
};

// sets the bot's activity to a random entry from the defined list
const setRandomActivity = () => {
    // get all activities. extracted into a local variable to possibly later add some statistics to it
    Configure.usingConfig(() => {
        let statuses = config.activities;
        // pick one
        let choice = statuses[Math.floor(Math.random() * statuses.length)];
        // set it!
        console.log(`changing activity to ${choice.name}`)
        client.user.setActivity(choice.name, { type: choice.type });
    });
};

// replaces the pronouns
// @param id the authors id
// @param text the text to do the replacing in
const replacePronouns = (id, text) => {
    // will do the actual replacing of placeholders
    const doReplacing = prons => {
        text = text.replace(/@subject/g, prons.subject);
        text = text.replace(/@object/g, prons.object);

        text = text.replace(/@dependent_possessive/g, prons.dependent_possessive);
        text = text.replace(/@independent_possessive/g, prons.independent_possessive);

        text = text.replace(/@reflexive/g, prons.reflexive);
        text = text.replace(/@be/g, prons.be);
        
        return text;
    };
    
    // find the users pronouns
    for (const [key, userdata] of Object.entries(pronouns)) {
        // test the regex against the author's username
        if (key == id && userdata) {
            let pronouns = userdata;
            // insert pronouns
            return doReplacing(userdata);
        }
    }
    return doReplacing(pronouns.default);
};

const updatePronouns = (id, data) => {
    console.log(pronouns[id]);
    
    for (let { name, value } of data) {
        pronouns[id][name] = value;
    }

    console.log(pronouns[id]);
    Pronouns.write(pronouns, pronounsJson);

    return true;
}

const checkForConfigCommands = (interaction) => {
    if (interaction.commandName == "pronouns") {
        return updatePronouns(interaction.member.id, interaction.options.data);
    }
    return false;
}

// when the client is ready
client.on('ready', () => {
    // log client user tag and set presence
    console.log(`Logged in as ${client.user.tag}!`);

    // start watching the config
    Configure.watchConfig(configJson, reloadConfig);

    // update slash command list
    updateSlashCommands();

    // setup random activity
    setRandomActivity();

    // sets a timer to change the activity regularly
    setInterval(setRandomActivity, config.activityChangeInterval * 1000);
});

// handle slash commands
client.on('interactionCreate', async (interaction) => {
    // Make sure it's a command
    if (!interaction.isCommand()) {
        return;
    }

    if (checkForConfigCommands(interaction)) {
        interaction.reply("Success");
        return;
    }

    // get name and optinos
    let name = interaction.commandName;
    let options = interaction.options;

    for (let [key, [singular, plural]] of Object.entries(config.emotes)) {
        if (name == key) {
            // select answer depending on if the target is set
            let answer = options.data.length > 0 ? plural : singular;

            // insert author and target
            answer = answer.replace(/@author/g, interaction.member);
            if (options.data.length > 0) {
                answer = answer.replace(/@target/g, options.data[0].user);
            }
            
            // replace pronouns
            answer = replacePronouns(interaction.member.id, answer);

            interaction.reply(answer);
        }
    }
});
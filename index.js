#!/usr/local/bin/node

// load the config loader module and set it up
const Configure = require('./configure.js');
let config = Configure.readConfigSync();

// authorize users from config.
const Authorize = require('./authorise');
Authorize.authorizeUser(config.adminContact);
Authorize.authorizeUsers(config.authorizedUsers);

const AuthorizeDiscord = require('./authorize_discord');

const Discord = require('discord.js');
const client = new Discord.Client();

var adminContact = undefined;

var allSnowflakesInSpecialEmoteTargetsResolved = false;
var helpTextPages = [];


// login using the token defined in config.json
client.login(config.token);

const updateConfig = () => {
    console.log("updating config!");
    Authorize.deauthorizeAll();
    Configure.readConfig((value) => {
    config = value;
    Authorize.authorizeUser(config.adminContact);
    Authorize.authorizeUsers(config.authorizedUsers);
    tryLoadingAdminContact();
    tryResolvingSnowflakesInSpecialEmoteTargets();
    buildUpHelpText();
    console.log("finished updating config!");
    });
}
// watch the config and reload it on change. Then reresolve snowflakes and rebuild the help pages.
Configure.watchConfig(updateConfig);

const tryLoadingAdminContact = () => {
    if (config.adminContact) {
        /*client.users.fetch(config.adminContact).then((res) => {
            console.log(adminContact);
            adminContact = res;
        }).catch((err) => {
            console.error(err);
        });*/
        adminContact = client.users.cache.get(config.adminContact);

        Authorize.setAuthorizationMethod(AuthorizeDiscord.createAskAdminForConfirmation(adminContact));
        console.log("Admin command authorization method set")        
    }
}

const tryResolvingSnowflakesInSpecialEmoteTargets = () => {
    // update user entries in specialEmoteTargets
    let success = true;
    for (const [key, name] of Object.entries(config.specialEmoteTargets)) {
        if (/u\d+/g.test(name)) {
            let user = client.users.cache.get(name.substring(1));
            if (user) {
                config.specialEmoteTargets[key] = user;
            } else {
                success = false;
            }
        }
    }
    allSnowflakesInSpecialEmoteTargetsResolved = success;
}

const buildUpHelpText = () => {
    let emotes = Object.entries(config.emotes).sort();
    helpText = "";
    let page = 0;
    for (const [key, values] of emotes) {
        let newText = `/${key} => \n\t${values[0]}\n\t${values[1]}\n\n`;
        if (helpText.length + newText.length > config.helpPageLength) {
            helpTextPages[page] = helpText;
            page++;
            helpText = newText;
        } else {
            helpText += newText;
        }
    }
    helpTextPages[page] = helpText;
}

function setRandomActivity() {
    // get all activities. extracted into a local variable to possibly later add some statistics to it
    Configure.usingConfig(() => {
        let statuses = config.activities;
        // pick one
        let choice = statuses[Math.floor(Math.random() * statuses.length)];
        // set it!
        console.log(`changing activity to ${choice.name}`)
        client.user.setActivity(choice.name, { type: choice.type });
    });
}

const sendErrorWarning = (err) => {
    if (!adminContact) {
        Configure.usingConfig(tryLoadingAdminContact);
    }
    if (adminContact) {
        adminContact.send("Error:\n" + err);
    }
}

const printHelp = (msg) => {
    if (helpTextPages.length === 0) {
        buildUpHelpText();
    }
    const embed = new Discord.MessageEmbed()
        .setColor(0x99CC99)
        .setFooter(`Page 1 of ${helpTextPages.length}`)
        .setDescription(helpTextPages[0]);

    msg.channel.send(embed).then(emsg => {
        emsg.page = 0;
        emsg.react('⏪').then(r => {
            emsg.react('⏩');

            const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === msg.author.id;
            const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === msg.author.id;

            const backwards = emsg.createReactionCollector(backwardsFilter, { time: 60000 });
            const forwards = emsg.createReactionCollector(forwardsFilter, { time: 60000 });

            const updateMessageFactory = (direction, cancelCondition) => {
                return (r) => {
                    if (cancelCondition()) {
                        return;
                    }
                    emsg.page += direction;
                    embed.setDescription(helpTextPages[emsg.page]);
                    embed.setFooter(`Page ${emsg.page + 1} of ${helpTextPages.length}`);
                    emsg.edit(embed);
                    r.users.remove(msg.author.id);
                }
            };

            backwards.on('collect', updateMessageFactory(-1, () => emsg.page === 0));
            forwards.on('collect', updateMessageFactory(1, () => emsg.page === helpTextPages.length - 1));
        })
    });
    msg.delete({ timeout: 1000 });
    return false;
}


const adminCommands = {
    "addEmote": (parameter) => {
        config.emotes[parameter[0]] = [parameter[1], parameter[2]];
        console.log(parameter[0] + " added");
    },
    "saveConfig": (parameter) => {
        if (parameter.length > 0) {
            Configure.writeConfig(config, (dataIn) => {dataIn}, parameter[0]);
        }
        Configure.writeConfig(config, (dataIn) => {
            for (const [key, value] of Object.entries(dataIn.specialEmoteTargets)) {
                if (typeof(value) === 'object') {
                    dataIn.specialEmoteTargets[key] = `u${value.id}`;
                }
            }
            dataIn.specialEmoteTargets = users;
            return dataIn;
        });
    },
    "test": (parameter) => {
        console.log(`TEST COMMAND! Params: ${parameter}`);
    }
}

const executeAdminCommand = (index, parameter) => {
    if (adminCommands[index]) {
        adminCommands[index](parameter);
    } else {
        sendErrorWarning(`Admin command ${index} could not be found!`);
    }
}

const handleAdminCommands = (msg) => {
    if (msg.content.startsWith(config.adminCommandPrefix)) {
        if (!adminContact) {
            Configure.usingConfig(tryLoadingAdminContact);
        }

        let [command, ...parameter] = msg.content.substring(config.adminCommandPrefix.length) // filter out admin command prefix
            .split('"', 6) // split at quotaiton marks to filter out parameters
            .map(word => word.trim()) // remove trailing spaces
            .filter(word => word.length > 0); // filter out empty strings

        if (Authorize.hasPermission(msg.author.id)) {
            executeAdminCommand(command, parameter);
        } else {
            Authorize.requestAuthorization(msg.author, command, parameter)
                .then(() => { 
                    executeAdminCommand(command, parameter); 
                    msg.reply("Your request has been approved!"); 
                })
                .catch(() => msg.reply("Your request has been denied!"));
                
            msg.reply("You are not authorized to execute this command. The administrator has been asked to confirm your request.");
            // ask admin contact
        }
        
        msg.delete({timeout: 100});
        return false;
    }
    return true;
}

// handles emotes and returns if the message should be looked at further (= has not been deleted).
const handleEmotes = (msg) => {
    for (const [key, reactions] of Object.entries(config.emotes)) {
        if (msg.content.startsWith(config.commandPrefix + key)) {

            let target = "";
            // values of msg.mentions.users as array
            let users = msg.mentions.users.array();

            if (!allSnowflakesInSpecialEmoteTargetsResolved) {
                tryResolvingSnowflakesInSpecialEmoteTargets();
            }
            // add used specialEmoteTargets to the list of users
            for (const [key, name] of Object.entries(config.specialEmoteTargets)) {
                let keyRegex = new RegExp(key, 'i');
                if (keyRegex.test(msg.content)) {
                    users.push(name);
                }
            }

            // if @everyone was mentioned, use everyone as target
            if (msg.mentions.everyone) {
                target = "everyone"
            } else if (users.length > 0) { // otherwise build the list of mentioned users

                if (users.length > 1) {
                    // list all users except for the last and add an ", and " before the last
                    target = users.slice(0, users.length - 1).join(", ");
                    // finish up the last part of target
                    target = [target, users[users.length - 1]].join(", and ");
                } else {
                    target = users[0];
                }
            }
            // select answer depending on if target is set (= was somebody mentioned?)
            let answer = target === "" ? reactions[0] : reactions[1];
            console.log(`target: ${target}`)
            // send emote text
            msg.channel.send(answer.replace(/@author/g, msg.author).replace(/@target/g, target)).then(sent => { }).catch(console.error);


            // if the bot has the permission to do so, delete the message triggering the emote
            if (msg.deletable) {
                // message deleted, so no further processing of the message is possible
                msg.delete({ timeout: 1000 });
                return false;
            } else {
                msg.react("💔");
            }
            return true;
        }
    }
    sendErrorWarning(`Unrecognized emote request: ${msg.content}`);
    return true;
}

// adds all emojis in reactions to msg
function addReactions(msg, reactions) {
    // iterate over reactions
    for (let i = 0; i < reactions.length; i++) {
        let emoji = reactions[i];

        // if the text starts with 'c', it's supposed to use a custom emoji
        if (emoji.charAt(0) === 'c') {
            try {
                // resolve the number after the c
                emoji = msg.client.emojis.resolveIdentifier(reactions[i].substring(1));
            } catch (e) {
                // otherwise use the broken heart emoji to show something is wrong
                console.error(e);
                emoji = "💔";
            }
        }
        // add the emoji
        msg.react(emoji);
    }
}

// handles the wordMap and returns if the message should be looked at further
const handleWordMap = (msg) => {
    // iterate over the wordMap
    for (const [key, reactions] of Object.entries(config.wordMap)) {
        // create a regex from the key
        let keyRegex = new RegExp(key, 'i');

        // test the regex against the message
        if (keyRegex.test(msg.content)) {
            // add reaction if the regex matches
            addReactions(msg, reactions);
        }
    }
    return true;
}

// handles the userMap and returns if the message should be looked at further
const handleUserMap = (msg) => {
    // iterate over the usernameMap
    for (const [key, reactions] of Object.entries(config.usernameMap)) {
        // create a regex from the key
        let keyRegex = new RegExp(key, 'i');

        // test the regex against the author's username
        if (keyRegex.test(msg.author.username)) {
            // add reaction if the regex matches
            addReactions(msg, reactions);
        }
    }
    return true;
}

// occasionally randomly reacts to a message sent by a user (configures in config.json)
const handleRandomRections = (msg) => {
    // get reactions for user
    let reactions = config.reactOnOccasion[msg.author.id];
    // if no possible reactions have been defined, stop
    if (!reactions) {
        return true;
    }
    // go through reactions
    for (let i = 0; i < reactions.length; i++) {
        // roll the dice!
        let chance = Math.random();
        // if random number < probability, send all defined messages
        if (chance < reactions[i].probability) {
            for (let j = 0; j < reactions[i].msg.length; j++) {
                msg.channel.send(reactions[i].msg[j]);
            }
        }
    }
    return true;
}

// when the client is ready
client.on('ready', () => {
    // log client user tag and set presence
    console.log(`Logged in as ${client.user.tag}!`);

    setRandomActivity();

    // sets a timer to change the activity regularly
    setInterval(setRandomActivity, config.activityChangeInterval * 1000);
});

// when a message is received
client.on('message', msg => {
    Configure.usingConfig(() => {
        for (let i = 0; i < msg.embeds.length; i++) {
            if (config.messageTitleIgnore.includes(msg.embeds[i].title)) {
                return;
            }
        }
        /*if (config.messageTitleIgnore.includes(msg.embeds.MessageEmebd.title)) {
            return;
        }*/

        // add the 🐟 emoji
        msg.react('🐟');

        if (msg.content.startsWith('/help')) {
            if (!printHelp(msg)) {
                return;
            }
        }

        // process admin commands
        if (!handleAdminCommands(msg) || msg.deleted) {
            return;
        }

        // first handle emotes and check if the message processing should continue
        if (msg.content.startsWith(config.commandPrefix)) {
            if (!handleEmotes(msg)) {
                return;
            }
        }

        // handle wordMap and check if the message processing should continue
        if (!handleWordMap(msg) || msg.deleted) {
            return;
        }

        // handle userMap and check if the message processing should continue
        if (!handleUserMap(msg) || msg.deleted) {
            return;
        }

        // on occasion randomly react to something somebody says, according to the settings in config.json
        if (!handleRandomRections(msg) || msg.deleted) {
            return;
        }
    });
});

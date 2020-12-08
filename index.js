#!/usr/local/bin/node

// load the config loader module and set it up
const Configure = require('./configure.js');
let config = Configure.readConfigSync();

// authorize users from config.
const Authorize = require('./authorise');
Authorize.authorizeUser(config.adminContact);
Authorize.authorizeUsers(config.authorizedUsers);

// contains our authorization method (ask the admin for confirmation)
const AuthorizeDiscord = require('./authorise_discord');

// load discord.js and create the client
const Discord = require('discord.js');
const client = new Discord.Client();

// include sinnyFormatter
const sinnyFormatter = require('./sinnyFormatter');

// undefined variables, set on demand as they use the client's cache
var adminContact = undefined;
// will contain resolved specialEmoteTargets from config
var specialEmoteTargets = undefined;

var allSnowflakesInSpecialEmoteTargetsResolved = false;
var helpTextPages = [];


// login using the token defined in config.json
client.login(config.token);

// method for reloading the config
const updateConfig = () => {
    console.log("updating config!");
    // remove all authorized users, to get rid of people who have been removed
    // from the list in the config. This means that people who have been
    // authorized separately have to be authorized again!
    Authorize.deauthorizeAll();

    // read the config, this is just a wrapper that handles errors
    Configure.readConfig((value) => {
        // set new config
        config = value;

        // resolve users again
        tryLoadingAdminContact();
        tryResolvingSnowflakesInSpecialEmoteTargets();

        // rebuild the help text
        buildUpHelpText();

        // finally authorize admin and authorized users
        Authorize.authorizeUser(config.adminContact);
        Authorize.authorizeUsers(config.authorizedUsers);
        console.log("finished updating config!");
    });
}
// watch the config and reload it on change. Then reresolve snowflakes and rebuild the help pages.
Configure.watchConfig(updateConfig);

// tries to resolve the adminContact from the client's cache
const tryLoadingAdminContact = () => {
    if (config.adminContact) {
        adminContact = client.users.cache.get(config.adminContact);

        // regenerate authorization method with newly assigned adminContact
        Authorize.setAuthorizationMethod(AuthorizeDiscord.createAskAdminForConfirmation(adminContact));
        console.log("Admin command authorization method set")
    }
}

// tries to resolve all snowflakes (IDs) in configs specialEmoteTargets
const tryResolvingSnowflakesInSpecialEmoteTargets = () => {
    // contains success state
    let success = true;
    // reset specialEmoteTargets
    specialEmoteTargets = {};
    // iterate over all entries in config
    for (const [key, name] of Object.entries(config.specialEmoteTargets)) {
        // if it starts with a 'u' it's a user, resolve the snowflake before adding it
        if (/u\d+/g.test(name)) {
            let user = client.users.cache.get(name.substring(1));
            if (user) { // resolving it worked \o/
                specialEmoteTargets[key] = user;
            } else { // resolving didn't work /o\
                success = false;
            }
        } else { // non-user target, just copy the entry
            specialEmoteTargets[key] = name;
        }
    }
    // set status of successful resolving
    allSnowflakesInSpecialEmoteTargetsResolved = success;
}

// generates the help text pages for /help
const buildUpHelpText = () => {
    // get a list of all emotes and sort it alphabetically
    let emotes = Object.entries(config.emotes).sort();
    // define and empty container string
    helpText = "";
    // counter for indexing the next page to write to
    let page = 0;
    // iterate over emotes
    for (const [key, values] of emotes) {
        // build text in the following format: '
        /* 
        /emotename => 
            no target string
            target string
        */
        let newText = `/${key} => \n\t${values[0]}\n\t${values[1]}\n\n`;
        // if the currently existing help text would exceed the maximum length
        // for a help page after adding the new entry, save the text to the 
        // current page and start the next page with the new entry
        if (helpText.length + newText.length > config.helpPageLength) {
            helpTextPages[page] = helpText;
            page++;
            helpText = newText;
        } else { // otherwise it can be appended to the current text
            helpText += newText;
        }
    }
    helpTextPages[page] = helpText; // save the remaining text to the last page
}

// sets the bot's activity to a random entry from the defined list
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

// sends an error warning to the admin user
const sendErrorWarning = (err) => {
    // if adminContact has not been resolved yet, try to resolve it
    if (!adminContact) {
        Configure.usingConfig(tryLoadingAdminContact);
    }
    if (adminContact) { // if it's resolved now, send the message
        adminContact.send("Error:\n" + err);
    }
}

// sends a warning to the admin user
const sendWarning = (err) => {
    // if adminContact has not been resolved yet, try to resolve it
    if (!adminContact) {
        Configure.usingConfig(tryLoadingAdminContact);
    }
    if (adminContact) { // if it's resolved now, send the message
        adminContact.send("Warning:\n" + err);
    }
}

// prints the /help output as a pagable message
const printHelp = (msg) => {
    // if the helpTextPages have not yet been built, do that now
    if (helpTextPages.length === 0) {
        buildUpHelpText();
    }
    // create the embedded message
    const embed = new Discord.MessageEmbed() 
        .setColor(0x99CC99) 
        .setFooter(`Page 1 of ${helpTextPages.length}`) // footer will contain the 'Page x of y' text
        .setDescription(helpTextPages[0]); // description contains the current page, start with the first page

    msg.channel.send(embed).then(emsg => { // send the embedded message
        emsg.page = 0; // save the current page to the message object
        emsg.react('⏪').then(r => { // add the backward reaction so the user can easily click it
            emsg.react('⏩'); // same for forward

            // filter functions to check which emoji has been clicked and if it was clicked by the user who
            // originally requested the help pages
            const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === msg.author.id;
            const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === msg.author.id;

            // turn filters into reaction collectors, which will stay active for 60s
            const backwards = emsg.createReactionCollector(backwardsFilter, { time: 60000 });
            const forwards = emsg.createReactionCollector(forwardsFilter, { time: 60000 });

            // function to generate the paging functions
            const updateMessageFactory = (direction, cancelCondition) => {
                return (r) => {
                    // cancel condition is bounds of the array
                    if (cancelCondition()) {
                        return;
                    }
                    // turn the page over in the requested direction
                    emsg.page += direction;
                    // set description to new page
                    embed.setDescription(helpTextPages[emsg.page]);
                    // update page in footer
                    embed.setFooter(`Page ${emsg.page + 1} of ${helpTextPages.length}`);
                    // update the embedded message
                    emsg.edit(embed);
                    // remove users reaction
                    r.users.remove(msg.author.id);
                }
            };
            // wire things up
            backwards.on('collect', updateMessageFactory(-1, () => emsg.page === 0));
            forwards.on('collect', updateMessageFactory(1, () => emsg.page === helpTextPages.length - 1));
        });

    });
    // delete the /help request message after the minute it stays active
    msg.delete({ timeout: 60000 });
    // original message is queued for deletion and further processing is not necessary
    return false;
}

// array of admin command functions
const adminCommands = {
    // adds an emote to the list of emotes in config
    "addemote": (parameter, reply) => {
        if (parameter.length < 3) {
            reply("addemote requires 2 arguments, the name of the emote, the text without a target and the text with a target! (use @author and @target for the author and target respectively)");
            return;
        }
        config.emotes[parameter[0]] = [parameter[1], parameter[2]];
        console.log(parameter[0] + " added");
    },
    // adds an entry to the wordMap
    "addwordreaction": (parameter, reply) => {
        if (parameter.length < 2) {
            reply("addwordreaction requires 2 arguments, a word to react to and an emoji to react with!");
            return;
        }
        if (!config.wordMap[parameter[0]]) {
            config.wordMap[parameter[0]] = [];
        }
        config.wordMap[parameter[0]].push(parameter[1]);
        console.log(parameter[0] + " added");
    },
    // adds an entry to the usernameMap
    "addusernamereaction": (parameter, reply) => {
        if (parameter.length < 2) {
            reply("addusernamereaction requires 2 arguments, a name to react to and an emoji to react with!");
            return;
        }

        if (!config.usernameMap[parameter[0]]) {
            config.usernameMap[parameter[0]] = [];
        }
        config.usernameMap[parameter[0]].push(parameter[1]);

        console.log(parameter[0] + " added");
    },
    // authorizes a user to execute admin commands without confirmation
    "authorize": (parameter, reply) => {
        // first parameter is the user
        Authorize.authorizeUser(parameter[0]);
        // the second parameter can be a time limit in seconds after which the user
        // automatically loses authorization again
        if (parameter[1]) {
            // send a warning to the admin that a user has been authorized
            sendWarning(`User ${parameter[0]} has been authorized for ${parameter[1]} seconds.`);
            // inform the user of the authorization
            client.users.cache.get(parameter[0]).send(`You've been authorized for ${parameter[1]} seconds.`);
            // set timer for deauthorization
            setTimeout(() => {
                // call the deauthorize command for the user
                adminCommands["deauthorize"](parameter);
            }, parseInt(parameter[1]) * 1000);
        } else {
            // send a warning to the admin that a user has been authorized
            sendWarning(`User ${parameter[0]} has been authorized permanently.`);
            // inform the user of the authorization
            client.users.cache.get(parameter[0]).send(`You've been authorized permanently.`);
        }
    },
    // change the wording of an emote
    "changeemote": (parameter, reply) => {
        if (parameter.length < 3) {
            reply("addemote requires 3 arguments, the name of the emote, the text without a target and the text with a target! (use @author and @target for the author and target respectively)");
            return;
        }
        if (parameter[1] === "") {
            parameter[1] = config.emotes[parameter[0]][0];
        }
        if (parameter[2] === "") {
            parameter[2] = config.emotes[parameter[0]][1];
        }
        config.emotes[parameter[0]] = [parameter[1], parameter[2]];
        reply(parameter[0] + " changed");
    },
    // revokes user privileges for the passed user
    "deauthorize": (parameter, reply) => {
        // deauthorize
        Authorize.deauthorizeUser(parameter[0]);
        // inform the user
        client.users.cache.get(parameter[0]).send(`Your privileges have been revoked.`);
    },
    // replaces the a string with another string in both instances of an emote
    "fixemote": (parameter, reply) => {
        if (parameter.length < 3) {
            reply("fixemote requires 3 arguments, the name of the emote, the text to search for and its replacement. Passed parameters: " + parameter);
            return;
        }
        let oldEmote = config.emotes[parameter[0]];
        config.emotes[parameter[0]] = [
            oldEmote[0].replace(parameter[1], parameter[2]), 
            oldEmote[1].replace(parameter[1], parameter[2])
        ];
        reply(`${parameter[0]} changed:\n${config.emotes[parameter[0]][0]}\n${config.emotes[parameter[0]][1]}`);
    },
    // writes the current configuration to the config.json
    "saveconfig": (parameter, reply) => {

        if (parameter.length > 0) { // first parameter can be a path to write to
            // write as is to a specific file
            Configure.writeConfig(config, parameter[0]);
        } else { // otherwise just write to config.json
            Configure.writeConfig(config);
        }
    },
    "static": (parameter, reply) => {
        sinnyFormatter.getFormattedString(config.raidStaticSource, "static", parameter, (formattedString) => reply(formattedString));
    }, 
    "raider": (parameter, reply) => {
        sinnyFormatter.getFormattedString(config.raidStaticSource, "raider", parameter, (formattedString) => reply(formattedString));
    },
    // test command, just prints to console
    "test": (parameter, reply) => {
        console.log(`TEST COMMAND! Params: ${parameter}`);
        reply("OK").then(sent => { }).catch(console.error);;
    }
}

// calls the adminCommand associated with the value of index with the passed parameters
const executeAdminCommand = (index, parameter, reply) => {
    // case insensitive
    index = index.toLowerCase();
    // if value exists
    if (adminCommands[index]) {
        // call function
        adminCommands[index](parameter, reply);
    } else { // else send error that the admin command could not be found
        sendErrorWarning(`Admin command ${index} could not be found!`);
    }
}

// handles the calling of admin commands, including authorization for non authorized users
const handleAdminCommands = (msg) => {
    // if it starts with the prefix, it's an adminCommand
    if (msg.content.startsWith(config.adminCommandPrefix)) {
        // if the adminContact hasn't been loaded yet
        if (!adminContact) {
            // try to load it
            Configure.usingConfig(tryLoadingAdminContact);
        }

        // break up the message into command and parameters
        let [command, ...parameter] = msg.content.substring(config.adminCommandPrefix.length) // filter out admin command prefix
            .split('"') // split at quotaiton marks to filter out parameters
            .map(word => word.trim()) // remove trailing spaces
            .filter(word => word.length > 0); // filter out empty strings

        // if the user is authorized, execute the command
        if (Authorize.hasPermission(msg.author.id)) {
            executeAdminCommand(command, parameter, (txt) => msg.channel.send(txt));
        } else { 
            // otherwise use the set requestAuthorization method to 
            // ask the admin to authorize the command
            Authorize.requestAuthorization(msg.author, command, parameter)
                // admin approves
                .then(() => {
                    executeAdminCommand(command, parameter,  (txt) => msg.channel.send(txt));
                    msg.author.send("Your request has been approved!");
                })
                // admin denies it or doesn't respond in time
                .catch((e) => {
                    msg.author.send("Your request has been denied!");
                    console.log(e);
                });
            
            // inform the user that they are not authorized and that the admin has been asked 
            // to confirm the request
            msg.author.send("You are not authorized to execute this command. The administrator has been asked to confirm your request.");
        }

        // delete triggering message
        msg.delete({ timeout: 100 });
        // message processed and queued for deletion, don't continue handling it
        return false;
    }
    // continue handling
    return true;
}

// handles emotes and returns if the message should be looked at further (= has not been deleted).
const handleEmotes = (msg) => {
    // for every emote
    for (let [key, reactions] of Object.entries(config.emotes)) {
        // if it starts with the commandPrefix, it's an emote
        if (msg.content.startsWith(config.commandPrefix + key)) {

            let target = "";
            // values of msg.mentions as array
            let targetArray = msg.mentions.users.array().concat(msg.mentions.roles.array());

            if (!allSnowflakesInSpecialEmoteTargetsResolved) {
                tryResolvingSnowflakesInSpecialEmoteTargets();
            }
            // add used specialEmoteTargets to the list of users
            for (const [key, name] of Object.entries(specialEmoteTargets)) {
                let keyRegex = new RegExp(key, 'i');
                if (keyRegex.test(msg.content)) {
                    targetArray.push(name);
                }
            }

            // if @everyone was mentioned, use everyone as target
            if (msg.mentions.everyone) {
                target = "everyone"
            } else if (targetArray.length > 0) { // otherwise build the list of mentioned users

                if (targetArray.length > 1) {
                    // list all users except for the last and add an ", and " before the last
                    target = targetArray.slice(0, targetArray.length - 1).join(", ");
                    // finish up the last part of target
                    target = [target, targetArray[targetArray.length - 1]].join(", and ");
                } else {
                    target = targetArray[0];
                }
            }

            // resolve if-else if necessary
            if (reactions.if) {
                let success = false;
                for (const [ifauthor, iftext] of Object.entries(reactions.if.author)) {
                    // if author is listed under if.author
                    if (ifauthor === msg.author.id) {
                        reactions[1] = iftext;
                        success = true;
                        break;
                    }
                }
                // go to default
                if (!success) {
                    reactions = reactions.else;
                }
            }
            // select answer depending on if target is set (= was somebody mentioned?)
            let answer = target === "" ? reactions[0] : reactions[1];

            // send emote text
            msg.channel.send(answer.replace(/@author/g, msg.author).replace(/@target/g, target)).then(sent => { }).catch(console.error);

            // if the bot has the permission to do so, delete the message triggering the emote
            if (msg.deletable) {
                msg.delete({ timeout: 1000 });
                // message deleted, so no further processing of the message is possible
                return false;
            } else {
                msg.react("💔");
            }
            // continue processing
            return true;
        }
    }
    // notify admin that the requetsed emote doesn't exist
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

    // continue processing
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
        // for every embedded message in the message
        for (let i = 0; i < msg.embeds.length; i++) {
            // if it contains a title that is included in the list
            // of titles to ignore, cancel processing
            if (config.messageTitleIgnore.includes(msg.embeds[i].title)) {
                return;
            }
        }

        // add the 🐟 emoji
        msg.react('🐟');

        // handle /help
        if (msg.content.startsWith(config.commandPrefix + 'help')) {
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

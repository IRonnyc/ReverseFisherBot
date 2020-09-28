#!/usr/local/bin/node

// load the config file, and discord.js
const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

// login using the token defined in config.json
client.login(config.token);

var contactOnError = undefined;

var allSnowflakesInSpecialEmoteTargetsResolved = false;

const tryLoadingContactOnError = () => {
    if (config.contactOnError) {
        /*client.users.fetch(config.contactOnError).then((res) => {
            console.log(contactOnError);
            contactOnError = res;
        }).catch((err) => {
            console.error(err);
        });*/
        contactOnError = client.users.cache.get(config.contactOnError);
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
    console.log(config.specialEmoteTargets);
}

function setRandomActivity() {
    // get all activities. extracted into a local variable to possibly later add some statistics to it
    let statuses = config.activities;
    // pick one
    let choice = statuses[Math.floor(Math.random() * statuses.length)];
    // set it!
    console.log(`changing activity to ${choice.name}`)
    client.user.setActivity(choice.name, { type: choice.type });
}

// when the client is ready
client.on('ready', () => {
    // log client user tag and set presence
    console.log(`Logged in as ${client.user.tag}!`);

    setRandomActivity();

    // sets a timer to change the activity regularly
    setInterval(setRandomActivity, config.activityChangeInterval * 1000);
});

const sendErrorWarning = (err) => {
    if (!contactOnError) {
        tryLoadingContactOnError();
    }
    if (contactOnError) {
        contactOnError.send(err);
    }
}

// handles emotes and returns if the message should be looked at further (= has not been deleted).
const handleEmotes = (msg) => {
    for (const [key, reactions] of Object.entries(config.emotes)) {
        if (msg.content.startsWith('/' + key)) {

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

            // send emote text
            msg.channel.send(answer.replace(/\@author/g, msg.author).replace(/\@target/g, target)).then(sent => {}).catch(console.error);

            
            // if the bot has the permission to do so, delete the message triggering the emote
            if (msg.deletable) {
                // message deleted, so no further processing of the message is possible
                msg.delete({timeout: 1000});
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

// when a message is received
client.on('message', msg => {
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

    // first handle emotes and check if the message processing should continue
    if (msg.content.startsWith('/')) {
        if (!handleEmotes(msg)) {
            return;
        }
    }

    // handle wordMap and check if the message processing should continue
    if(!handleWordMap(msg)) {
        return;
    }

    // handle userMap and check if the message processing should continue
    if (!handleUserMap(msg)) {
        return;
    }
});
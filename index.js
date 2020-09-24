#!/usr/local/bin/node

// load the config file, and discord.js
const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

function setRandomActivity() {
    // get all activities. extracted into a local variable to possibly later add some statistics to it
    let statuses = config.activities;
    // pick one
    let choice = statuses[Math.floor(Math.random() * statuses.length)];
    // set it!
    console.log(`changing activity to ${choice.name}`)
    client.user.setActivity(choice.name, {type: choice.type});
}

// when the client is ready
client.on('ready', () => {
    // log client user tag and set presence
    console.log(`Logged in as ${client.user.tag}!`);

    setRandomActivity();

    // sets a timer to change the activity regularly
    setInterval(setRandomActivity, config.activityChangeInterval * 1000);
});

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
                emoji = "💔";
            }
        }
        // add the emoji
        msg.react(emoji);
    }
}

// when a message is received
client.on('message', msg => {
    // add the 🐟 emoji
    msg.react('🐟');

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
});

// login using the token defined in config.json
client.login(config.token);
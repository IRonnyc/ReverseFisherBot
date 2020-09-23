#!/usr/local/bin/node

const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        game: config.game
    })
});

function addReactions(msg, reactions) {
    for (let i = 0; i < reactions.length; i++) {
        let emoji = reactions[i];
        if (emoji.charAt(0) === 'c') {
            try {
                emoji = msg.client.emojis.resolveIdentifier(reactions[i].substring(1));
            } catch (e) {
                emoji = "💔";
            }
        }
        msg.react(emoji);
    }
}

client.on('message', msg => {
    msg.react('🐟');

    for (const [key, reactions] of Object.entries(config.messageContainsMap)) {
        let keyRegex = new RegExp(key, 'i');
        if (keyRegex.test(msg)) {
            addReactions(msg, reactions);
        }
    }

    for (const [key, reactions] of Object.entries(config.userNameMap)) {
        if (key === msg.author.username) {

            addReactions(msg, reactions);
        }
    }

});


client.login(config.token);
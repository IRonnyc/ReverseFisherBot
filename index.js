const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function addReactions(msg, reactions) {
    for (let i = 0; i < reactions.length; i++) {
        msg.react(reactions[i]);
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
});


client.login(config.token);
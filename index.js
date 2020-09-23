const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const messageContainsMap = {
    "bir(d|b)": ['🐦'],
    "dragon": ['🐉'],
    "ast(rologian){0,1}": ['💫'],
    "dr(a)*g(oon){0,1}": ['☠'],
    "heal": ['❤'],
    "tank": ['🤩'],
    "tonk": ['😍'],
    "d(a)*m(a)*g(e)*": ['🤯'],
    "d(e)*ps": ['🤯'],
    "sn(a|e)k(e)*": ['🐍'],
    "cow": ['🐮'],
    "m(u|o)+h{0,1}(\\W|\\b)": ['🐮'],
    "fishes": ['🐠', '🐡', '🍥'],
    ":o": ['😮'],
    "D:": ['😦'],
    "<3": ['♥'],
    ":v": ['🤪'],
    "\\o/": ['🎉'],
    "y(a|e)+s": ['✔'],
    "n(o)+(\\W|\\b)": ['❌'],
    "nose": ['👃'],
}

function addReactions(msg, reactions) {
    for (let i = 0; i < reactions.length; i++) {
        msg.react(reactions[i]);
    }
}

client.on('message', msg => {
    msg.react('🐟');
    
    for (const [key, reactions] of Object.entries(messageContainsMap)) {
        let keyRegex = new RegExp(key, 'i');
        if (keyRegex.test(msg)) {
            addReactions(msg, reactions);
        }
    }
});


client.login(config.token);
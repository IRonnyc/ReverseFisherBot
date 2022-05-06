// DEPRECATED

const Discord = require('discord.js');

// function to create the authorization function, that returns the function for the promise
// curries in the adminContact so it can be called with just the author, the command, and the parameters
const createAskAdminForConfirmation = (adminContact) => {
    // returned function receives 3 params from authorise
    // curries in the author, command, and parameter
    return (author, command, parameter) => {
        // wrapping it in a promise passes it two functions, resolve and reject
        // resolve will accept the request, reject will reject it
        return (resolve, reject) => {
            
            // wrap the message to the adminContact in a MessageEmbed
            const embed = new Discord.MessageEmbed()
                .setColor(0x99CC99)
                .setFooter("Confirmation required!") // a little context what to do in the footer
                .setDescription(`${author} has requested to execute the ${command} command with the following parameters:\n${parameter}`); // set message text

            // send the message
            adminContact.send(embed).then(emsg => {
                // add both possible reactions, so the user can just click the one they want
                emsg.react('✅').then(r => {
                    emsg.react('❌');

                    // create the filters to check for the emoji and make sure the reacting user is in fact the admin
                    const confirmFilter = (reaction, user) => reaction.emoji.name === '✅' && user.id === adminContact.id;
                    const denieFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === adminContact.id;

                    // turn them into ReactionCollectors that stay active for 5 minutes
                    const confirm = emsg.createReactionCollector(confirmFilter, { time: 300000 });
                    const denie = emsg.createReactionCollector(denieFilter, { time: 300000 });

                    // wire them up to either resolve or reject
                    confirm.on('collect', (r) => resolve("Authorized!"));
                    denie.on('collect', (r) => reject("Rejected!"));
                })
            })
        }
    }
}

module.exports = {
    createAskAdminForConfirmation
}
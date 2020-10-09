const Discord = require('discord.js');

const createAskAdminForConfirmation = (adminContact) => {
    return (author, command, parameter) => {
        return (resolve, reject) => {
            console.log("Promise started! Contacted user: " + adminContact + "(typeof: " + typeof(adminContact) + ")");
            console.log(`Request parameters are:\n-author: ${author}\n-command: ${command}\n-parameter: ${parameter}`);

            const embed = new Discord.MessageEmbed()
                .setColor(0x99CC99)
                .setFooter("Confirmation required!")
                .setDescription(`${author} has requested to execute the ${command} command with the following parameters:\n${parameter}`);

            adminContact.send(embed).then(emsg => {
                emsg.page = 0;
                emsg.react('✅').then(r => {
                    emsg.react('❌');

                    const confirmFilter = (reaction, user) => reaction.emoji.name === '✅' && user.id === adminContact.id;
                    const denieFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === adminContact.id;

                    const confirm = emsg.createReactionCollector(confirmFilter, { time: 300000 });
                    const denie = emsg.createReactionCollector(denieFilter, { time: 300000 });

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
import Discord from "discord.io";
import * as logger from "winston";

import auth from "../auth.json";


// Configure logger settings

logger.remove(logger.transports.Console);
logger.createLogger({
    level: 'debug',
}).add(new logger.transports.Console());


// Initialize Discord Bot

var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;

            // Just add any case commands if you want to..

            // !ding
            case 'ding':
                bot.sendMessage({
                    to: channelID,
                    message: 'Dong!'
                });
                bot.sendMessage({
                    to: userID,
                    message: 'You ding!'
                });
                break;
         }
     }
});

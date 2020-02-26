import Discord from "discord.io";
import * as logger from "winston";

import auth from "./auth.json";

import MessageRouter from "./MessageRouter";
import Bot from "./Bot";


// Configure logger settings

logger.remove(logger.transports.Console);
logger.createLogger({
    level: 'debug',
}).add(new logger.transports.Console());


// Initialize Discord Bot

var discordClient = new Discord.Client({
   token: process.env.DISCORD_TOKEN || auth.token,
   autorun: true
});

var bot = new Bot(discordClient);

var messageRouter = new MessageRouter(bot);
discordClient.on("message", messageRouter.route);

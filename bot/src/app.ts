import Discord from "discord.io";
import * as logger from "winston";

import auth from "../auth.json";

import MessageRouter from "./MessageRouter";
import Bot from "./Bot.js";


// Configure logger settings

logger.remove(logger.transports.Console);
logger.createLogger({
    level: 'debug',
}).add(new logger.transports.Console());


// Initialize Discord Bot

var discordClient = new Discord.Client({
   token: auth.token,
   autorun: true
});

var bot = new Bot(discordClient);

discordClient.on("ready", evt => {
    logger.info("Connected");
    logger.info("Logged in as: ");
    logger.info(discordClient.username + " - (" + discordClient.id + ")");
});

var messageRouter = new MessageRouter(bot);
discordClient.on("message", messageRouter.route);

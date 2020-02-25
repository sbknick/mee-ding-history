import Discord from "discord.io";
import * as logger from "winston";

import auth from "../auth.json";

import MessageRouter from "./messageRouter";


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

bot.on("ready", evt => {
    logger.info("Connected");
    logger.info("Logged in as: ");
    logger.info(bot.username + " - (" + bot.id + ")");
});

var messageRouter = new MessageRouter(bot);
bot.on("message", messageRouter.route);

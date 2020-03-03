import Discord from "discord.js";
import * as logger from "winston";

import auth from "./auth.json";

import { MessageRouter } from "./MessageRouter";
import { Bot } from "./Bot";
import { Convert } from "./Convert";


// Configure logger settings

logger.remove(logger.transports.Console);
logger.createLogger({
    level: 'debug',
}).add(new logger.transports.Console());


// Initialize Discord Bot

var discordClient = new Discord.Client();

var bot = new Bot(discordClient);

var messageRouter = new MessageRouter(bot);
discordClient.on("message", Convert.ToMyMessage().then(messageRouter.route));

discordClient.login(process.env.DISCORD_TOKEN || auth.token);
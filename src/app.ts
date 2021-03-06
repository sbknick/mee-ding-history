import Discord from "discord.js";

import { Bot } from "./Bot";
import { Convert } from "./Convert";
import { MessageRouter } from "./Routers/MessageRouter";
import { logger } from "./Logger";


// Configure logger settings

logger.configure();

// Initialize Discord Bot

var discordClient = new Discord.Client();

var bot = new Bot(discordClient);

var messageRouter = new MessageRouter(bot);
discordClient.on("message", Convert.ToMyMessage().then(messageRouter.route));

discordClient.login(process.env.DISCORD_TOKEN);
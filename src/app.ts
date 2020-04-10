import Discord from "discord.js";

import { Bot } from "./Bot";
import { Convert } from "./Convert";
import { MessageRouter } from "./Routers/MessageRouter";
import { logger } from "./Logger";
import { DB } from "./Repositories/DB";



// Configure logger settings

logger.configure();

(async () => {
    await DB.createSchema();
})();

// // Initialize Discord Bot

// var discordClient = new Discord.Client();

// var bot = new Bot(discordClient);

// var messageRouter = new MessageRouter(bot);
// discordClient.on("message", Convert.ToMyMessage().then(messageRouter.route));

// discordClient.login(process.env.DISCORD_TOKEN);
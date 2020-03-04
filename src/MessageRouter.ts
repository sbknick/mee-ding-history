import logger from "winston";

import { Bot } from "./Bot";
import { MemoryHandler } from "./MessageHandlers/MemoryHandler";
import { Message } from "./Models/Message";


interface Router { route: (message: Message) => void };

export class MessageRouter implements Router {
    private memoryHandler: MemoryHandler;

    public constructor (
        private bot: Bot
    ) {
        this.memoryHandler = new MemoryHandler(bot);
    }

    public route = async (msg: Message) =>
        this.bot.getMsgContext(msg)(async ctx => {
            if (msg.source.author.bot) {
                if (msg.userID == this.bot.mee6UserID()) {
                    this.memoryHandler.commit(msg);
                }
                return;
            }

            try {
                // Our bot needs to know if it will execute a command
                // It will listen for messages that will start with `!`
                if (msg.message.substring(0, 1) == '!') {
                    var args = msg.message.slice(1).trim().split(/ +/g);
                    var cmd = args[0];
                
                    args = args.splice(1);
                    switch (cmd) {
                        // !ping
                    case "ping":
                        ctx.reply("Pong!");
                        break;

                    case "repeat":
                        this.memoryHandler.repeat(msg);
                        break;

                        // !ding
                    case "ding":
                        if (args.length == 0 || args[0] == "help")
                            return ctx.helpHandler.help();

                        if (!msg.source.guild) {
                            return msg.source.reply("Sorry, I don't do that in DMs. :shrug:");
                        }

                        switch (args[0]) {
                            case "me":
                                {
                                    let level = "1";
                                    let searchResult = await ctx.deepSearch("GG", level).me();

                                    return ctx.reply(`at level ${level} you said:\n> ${searchResult.content}`);
                                }

                            case "user":
                                {
                                    if (!ctx.mentionUserID) {
                                        return ctx.helpHandler.error(ctx.cmd)
                                    }

                                    logger.info("Received mention request:\n" + msg.message);
                                    msg.source.channel.startTyping();

                                    let level = "2";
                                    let searchResult = await ctx.deepSearch("GG", level).mention();
                                    
                                    if (searchResult) {
                                        ctx.reply(`at level ${level} <@${ctx.mentionUserID}> said:\n> ${searchResult.content}`);
                                    }
                                    else {
                                        ctx.sorry();
                                    }

                                    return msg.source.channel.stopTyping();
                                }

                            default:
                                return ctx.helpHandler.unknownInput(msg);
                        }
                    }
                }
            }
            finally {
                this.memoryHandler.remember(msg);
            }
        });
}
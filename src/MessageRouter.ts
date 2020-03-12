import { Bot } from "./Bot";
import { DingRouter } from "./DingRouter";
import { logger } from "./Logger";
import { Message } from "./Models/Message";
import { Common } from "./Common";


interface Router { route: (message: Message) => void };

export class MessageRouter implements Router {
    private dingRouter: DingRouter;

    public constructor(
        private bot: Bot
    ) {
        this.dingRouter = new DingRouter(bot);
    }

    public route = async (msg: Message) =>
        this.bot.createMsgContext(msg)(async ctx => {
            if (msg.source.author.bot) {
                if (msg.userID == this.bot.mee6UserID()) {
                    ctx.memoryHandler().commit(msg);
                }
                return;
            }

            try {
                // Our bot needs to know if it will execute a command
                // It will listen for messages that will start with `!`
                if (msg.message.substring(0, 1) == '!') {
                    let args = msg.message.slice(1).trim().split(/ +/g);
                    const cmd = args[0];
                    args = args.slice(1);

                    switch (cmd) {
                        // !ding
                        case "ding":
                            if (args.length == 0 || args[0] == "help")
                                return ctx.helpHandler().help();

                            if (!msg.source.guild) {
                                if (Common.isDeveloper(msg.userID) && args[0] === "report") {
                                    return ctx.reportHandler().report();
                                }

                                return msg.source.reply("Sorry, I don't do that in DMs. :shrug:");
                            }

                            await this.dingRouter.route(msg, args);
                    }
                }
            }
            catch (error) {
                logger.error("Message Handling Failed: ", error);
            }
            finally {
                ctx.memoryHandler().remember(msg);
            }
        });
}
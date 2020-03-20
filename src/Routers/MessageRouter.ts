import { Bot, BotContext } from "../Bot";
import { DingRouter } from "./DingRouter";
import { logger } from "../Logger";
import { Message } from "../Models/Message";
import { Common } from "../Common";


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

                    if (!msg.source.guild) {
                        await this.routeDM(ctx, cmd, msg, args);
                    }
                    else {
                        await this.routeGuildMessage(ctx, cmd, msg, args);
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
        
    private async routeDM(ctx: BotContext, cmd: string, msg: Message, args: string[]) {
        switch (cmd) {
            case "report":
            case "sitrep":
                if (Common.isDeveloper(msg.userID)) {
                    await ctx.reportHandler().report();
                    if (args.length > 0 && (args.includes("-c") || args.includes("--clear"))) {
                        await ctx.reportHandler().clear(args);
                    }
                    return;
                }
            
            case "clear":
                if (Common.isDeveloper(msg.userID)) {
                    return await ctx.reportHandler().clear(args);
                }

            case "found":
                if (Common.isDeveloper(msg.userID)) {
                    return await ctx.reportHandler().found();
                }
            
            default:
                return await msg.source.reply("Sorry, I don't do that in DMs. :shrug:");
        }
    }

    private async routeGuildMessage(ctx: BotContext, cmd: string, msg: Message,  args: string[]) {
        switch (cmd) {
            // !ding
            case "ding":
                if (args.length == 0 || args[0] == "help")
                    return ctx.helpHandler().help();

                return await this.dingRouter.route(msg, args);

            case "report":
            case "sitrep":
                if (Common.isDeveloper(msg.userID)) {
                    await ctx.reportHandler().report();
                    if (args.length > 0 && (args.includes("-c") || args.includes("--clear"))) {
                        await ctx.reportHandler().clear(args);
                    }
                    return;
                }
            
            case "clear":
                if (Common.isDeveloper(msg.userID)) {
                    return await ctx.reportHandler().clear(args);
                }
        }
    }
}
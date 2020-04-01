import { Bot, BotContext } from "../Bot";
import { Message } from "../Models/Message";
import { Common } from "../Common";


export class DingRouter {
    public constructor(
        private bot: Bot,
    ) {}

    public route = (msg: Message, args: string[]) =>
        this.bot.getMsgContext(msg)(async ctx => {
            const subCmd = args[0];
            args = args.slice(1);

            switch (subCmd) {
                case "me":
                    return ctx.dingHandler.me(msg, args);

                case "user":
                    return ctx.dingHandler.user(msg, args);

                case "term":
                    if (msg.source.member.permissions.has("MANAGE_GUILD", true) || Common.isDeveloper(msg.userID))
                        return this.routeTerm(ctx, msg, args);
                    return ctx.helpHandler.unauthorized();

                case "cancel":
                    if (Common.isDeveloper(msg.userID)) {
                        return ctx.dingHandler.cancelJobs();
                    }

                default:
                    return ctx.helpHandler.unknownInput(msg);
            }
        });

    private routeTerm(ctx: BotContext, msg: Message, args: string[]) {
        if (args.length == 0) {
            const term = ctx.termHandler.getTerm();
            ctx.send.reply(`My current search term is "${term}"`);
        }
        else {
            ctx.termHandler.setTerm(args[0]);
            ctx.send.reply(`Okay, my new search term is "${args[0]}"`);
        }
    }
}
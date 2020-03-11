import Discord from "discord.js";

import { Bot, BotContext } from "./Bot";
import { Message } from "./Models/Message";
import { TermHandler } from "./MessageHandlers";


export class DingRouter {
    constructor(
        private bot: Bot
    ) {}

    route(msg: Message, args: string[]) {
        const drCtx = new DingRouterContext(this.bot.getMsgContext(msg), msg);

        const subCmd = args[0];
        args = args.slice(1);

        switch (subCmd) {
            case "me":
                return drCtx.execMe(args);

            case "user":
                return drCtx.execUser(args.slice(1));

            case "term":
                if (!msg.source.member.permissions.has("MANAGE_GUILD", true))
                    return this.bot.getMsgContext(msg).helpHandler.unauthorized();
                return drCtx.execTerm(args);

            default:
                return drCtx.execDefault();
        }
    }
}

class DingRouterContext {
    constructor(
        private ctx: BotContext,
        private msg: Message
    ) {}

    execTerm(args: string[]) {
        if (args.length == 0) {
            const term = new TermHandler(this.ctx).getTerm();
            this.ctx.send.reply(`My current search term is "${term}"`);
        }
        else {
            new TermHandler(this.ctx).setTerm(args[0]);
            this.ctx.send.reply(`Okay, my new search term is "${args[0]}"`);
        }
    }

    execMe(args: string[]) {
        return this.exec(this.msg.source.member, args);
    }

    execUser(args: string[]) {
        if (this.msg.source.mentions.members.size == 0) {
            return this.execDefault();
        }
        return this.exec(this.msg.source.mentions.members.first(), args);
    }

    execDefault() {
        this.ctx.helpHandler.unknownInput(this.msg);
    }

    private async exec(member: Discord.GuildMember, args: string[]) {
        const level = await this.getLevel(member, args);

        if (level === undefined) {
            return this.ctx.helpHandler.levelError();
        }

        let searchResult = await this.ctx.fetch.deepSearch(level).doSearch(member.user.id);

        if (searchResult) {
            this.ctx.send.replyEmbed(searchResult, level);
        }
        else {
            this.ctx.send.replySorry();
        }
    }

    private async getLevel(member: Discord.GuildMember, args: string[]) {
        if (args.length == 0) {
            return await this.ctx.fetch.getUserLevel(member).doSearch();
        }

        if (!Number.isNaN(Number(args[0]))) {
            return args[0];
        }
    }
}
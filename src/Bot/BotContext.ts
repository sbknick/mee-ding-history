import Discord from "discord.js";

import { Message } from "../Models/Message";
import { HelpHandler } from "../MessageHandlers/HelpHandler";

import { Bot, DeepSearch } from ".";


interface ActionType {
    (ctx: BotContext): Promise<any>;
}

export class BotContext {
    readonly userID: Discord.Snowflake;
    readonly mentionUserID: Discord.Snowflake;
    readonly mee6UserID: Discord.Snowflake;
    readonly cmd: string;

    constructor(
        private msg: Message,
        private bot: Bot
    ) {
        this.userID = msg.userID;
        this.mee6UserID = bot.mee6UserID();
        this.cmd = msg.message;

        if (msg.source.mentions.users.size > 0) {
            this.mentionUserID = msg.source.mentions.users.first().id;
        }
    }

    readonly executor = async (action: ActionType) => await action(this);

    readonly helpHandler: HelpHandler = new HelpHandler(this);

    readonly reply = (value: string) => this.bot.reply(this.msg, value);
    readonly dm = (value: string) => this.bot.dm(this.msg, value);
    readonly sorry = () => this.bot.reply(this.msg, ` sorry, I can't find that. :(`);

    readonly deepSearch = (...searchTerms: string[]) =>
        new DeepSearch(this, this.msg.source.guild, searchTerms);
}
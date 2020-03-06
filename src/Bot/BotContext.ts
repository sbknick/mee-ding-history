import Discord from "discord.js";

import { HelpHandler } from "../MessageHandlers/HelpHandler";
import { MemoryHandler } from "../MessageHandlers/MemoryHandler";
import { Message } from "../Models/Message";

import { Bot, DeepSearch } from ".";
import { MemberLevelSearch } from "./MemberLevelSearch";


interface ActionType {
    (ctx: BotContext): Promise<any>;
}

export class BotContext {
    readonly mee6UserID: Discord.Snowflake;
    readonly member: Discord.GuildMember;

    constructor(
        bot: Bot,
        private msg: Message
    ) {
        this.mee6UserID = bot.mee6UserID();
        this.member = msg.source.member;
    }

    readonly executor = async (action: ActionType) => await action(this);

    readonly helpHandler: HelpHandler = new HelpHandler(this);
    readonly memoryHandler: MemoryHandler = new MemoryHandler(this);

    readonly send = {
        reply: (response: string) => this.msg.source.reply(response),
        dm: (response: string) => this.msg.source.author.send(response),
        cleanReply: (response: string) => this.msg.source.reply(response).then((m: Discord.Message) => m.delete(5 * 60 * 1000)),

        replySorry: () => this.send.reply(` sorry, I can't find that. :(`),

        replyEmbed: (msg: Discord.Message, level: string) => {
            let embed = new Discord.RichEmbed()
                .setColor(0x42b983)
                .setAuthor(msg.guild.member(msg.author).nickname)
                .setTitle(`Level ${level}`)
                .setDescription(msg.content)
                .addField('\u200b', `[Jump to...](${msg.url})`)
                .setTimestamp(msg.createdTimestamp)
                .setFooter(`Brought to you by Blair`);

            this.respondWithoutQuote(embed);
        },
    }

    readonly fetch = {
        deepSearch: (searchTerm: string, level: string) =>
            new DeepSearch(this, this.msg.source.guild, searchTerm, level),

        getUserLevel: (searchTerm: string, member: Discord.GuildMember) =>
            new MemberLevelSearch(this, member, searchTerm),
    }
    
    private readonly respondWithoutQuote = (embed: Discord.RichEmbed) => this.msg.source.channel.send({ embed });
}
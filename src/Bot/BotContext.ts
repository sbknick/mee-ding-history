import Discord from "discord.js";

import { HelpHandler } from "../MessageHandlers/HelpHandler";
import { MemoryHandler } from "../MessageHandlers/MemoryHandler";
import { Message } from "../Models/Message";

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
        bot: Bot,
        private msg: Message
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
    readonly memoryHandler: MemoryHandler = new MemoryHandler(this);

    readonly send = {
        reply: (response: string) => this.msg.source.reply(response),
        dm: (response: string) => this.msg.source.member.send(response),
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
        }
    }

    readonly fetch = {
        deepSearch: (searchTerm: string, level: string) =>
            new DeepSearch(this, this.msg.source.guild, searchTerm, level),

        getUserLevel: (user: Discord.GuildMember) => {
            return "1";
        }
    }
    
    private readonly respondWithoutQuote = (embed: Discord.RichEmbed) => this.msg.source.channel.send({ embed });
}
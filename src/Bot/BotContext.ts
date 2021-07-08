import Discord, { TextChannel } from "discord.js";

import { HelpHandler, MemoryHandler, ReportHandler, TermHandler, LevelHandler, DingHandler } from "../MessageHandlers";
import { Message } from "../Models/Message";

import { Bot, DeepSearch, MemberLevelSearch } from ".";
import { Ding } from "../Models/Ding";
import { OnComplete } from "./OnComplete";


interface ActionType {
    (ctx: BotContext): Promise<any>;
}

export class BotContext extends OnComplete {
    public readonly mee6UserID: Discord.Snowflake;
    public readonly member: Discord.GuildMember;

    private _dingHandler: DingHandler;
    private _helpHandler: HelpHandler;
    private _levelHandler: LevelHandler;
    private _memoryHandler: MemoryHandler;
    private _reportHandler: ReportHandler;
    private _termHandler: TermHandler;

    public get dingHandler() { return this._dingHandler || (this._dingHandler = new DingHandler(this)); }
    public get helpHandler() { return this._helpHandler || (this._helpHandler = new HelpHandler(this)); }
    public get levelHandler() { return this._levelHandler || (this._levelHandler = new LevelHandler()); }
    public get memoryHandler() { return this._memoryHandler || (this._memoryHandler = new MemoryHandler(this)); }
    public get reportHandler() { return this._reportHandler || (this._reportHandler = new ReportHandler(this, this.bot.client)); }
    public get termHandler() { return this._termHandler || (this._termHandler = new TermHandler(this)); }

    public constructor(
        private bot: Bot,
        private msg: Message
    ) {
        super();
        this.mee6UserID = bot.mee6UserID;
        this.member = msg.source.member;
    }

    public executor = async (action: ActionType) => {
        const result = await action(this);
        this.completed(result);
    }

    public readonly send = {
        reply: (response: string) => this.msg.source.reply(response),
        dm: (response: string) => this.msg.source.author.send(response),
        cleanReply: (response: string) => this.msg.source.reply(response).then((m: Discord.Message) => m.delete({timeout: 5 * 60 * 1000})),

        replySorry: () => this.send.reply(" sorry, I can't find that. :sob:"),

        replyDingMessageEmbed: async (ding: Ding) => {
            const msg = ding.message || await this.fetch.message(ding);

            if (msg) {
                const embed = new Discord.MessageEmbed()
                    .setColor(0x42b983)
                    .setAuthor(msg.guild.member(msg.author).displayName, msg.author.displayAvatarURL())
                    .setTitle(`Level ${ding.level}`)
                    .setDescription(msg.content)
                    .addField('\u200b', `[Jump to...](${msg.url})`)
                    .setTimestamp(msg.createdTimestamp)
                    .setFooter("Brought to you by Blair");

                if (msg.attachments.size > 0) {
                    embed.setImage(msg.attachments.first().url);
                }

                this.respondWithoutQuote(embed);
            }
            else {
                this.send.replySorry();
            }
        },

        replyEmbed: (embed: Discord.MessageEmbed) => this.msg.source.reply(embed),

        batchReply: async (content: (string | Discord.MessageEmbed)[]) => {
            for (const x of content) {
                await this.msg.source.reply(x);
            }
        },
    }

    public readonly fetch = {
        deepSearch: (level: string) =>
            new DeepSearch(this, this.msg.source, this.termHandler.getTerm(), level),

        getUserLevel: (member: Discord.GuildMember) =>
            new MemberLevelSearch(this, this.msg.source, member, this.termHandler.getTerm()),
        
        message: (ding: Ding) => {
            return (this.msg.source.guild.channels.cache.get(ding.channelID) as TextChannel)
                .messages.fetch(ding.messageID);
        },
    }
    
    private respondWithoutQuote = (embed: Discord.MessageEmbed) => this.msg.source.channel.send({ embed });
}
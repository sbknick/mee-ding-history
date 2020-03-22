import Discord from "discord.js";

import { BotContext, DeepSearch, MemberLevelSearch } from "../Bot";
import { Message } from "../Models/Message";
import { Ding } from "../Models/Ding";
import { DingRepository } from "../Repositories/DingRepository";


export class DingHandler {
    constructor(
        private ctx: BotContext
    ) {}

    me(msg: Message, args: string[]) {
        return this.exec(msg.source.member, args);
    }

    user(msg: Message, args: string[]) {
        if (msg.source.mentions.members.size === 0) {
            return this.ctx.helpHandler().unknownInput(msg);
        }
        return this.exec(msg.source.mentions.members.first(), args);
    }

    private async exec(member: Discord.GuildMember, args: string[]): Promise<void> {
        const level = await this.getLevel(member, args);

        if (level === undefined) {
            return this.ctx.helpHandler().levelError();
        }

        const ding = await this.getDing(member, level);

        if (ding) {
            this.ctx.send.replyDingMessageEmbed2(ding);
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

    private async getDing(member: Discord.GuildMember, level: string): Promise<Ding> {
        let ding = DingRepository.get(member.guild.id, member.id, level);

        if (ding) return ding;

        this.ctx.send.reply(" so I, uhh.. don't remember... I'll go try to find it.");

        let searchResult = await this.ctx.fetch.deepSearch(level).doSearch(member.id);

        if (searchResult) {
            return {
                userID: searchResult.author.id,
                guildID: searchResult.guild.id,
                channelID: searchResult.channel.id,
                messageID: searchResult.id,
                level,
                message: searchResult
            };
        }
    }
}
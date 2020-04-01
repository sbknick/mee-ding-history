import Discord from "discord.js";

import { BotContext } from "../Bot";
import { Message } from "../Models/Message";
import { Ding } from "../Models/Ding";
import { DingRepository } from "../Repositories/DingRepository";


interface Job {
    cancellationToken: { cancelled: boolean };
}

export class DingHandler {
    private static runningJobs: Job[] = [];

    public constructor(
        private ctx: BotContext
    ) {}

    public me(msg: Message, args: string[]) {
        return this.exec(msg.source.member, args);
    }

    public user(msg: Message, args: string[]) {
        if (msg.source.mentions.members.size === 0) {
            return this.ctx.helpHandler.unknownInput(msg);
        }
        args = args.filter(a => !a.startsWith("<@!"));
        return this.exec(msg.source.mentions.members.first(), args);
    }

    public cancelJobs() {
        for (const job of DingHandler.runningJobs) {
            job.cancellationToken.cancelled = true;
        }
        DingHandler.runningJobs = [];
    }

    private async exec(member: Discord.GuildMember, args: string[]): Promise<void> {
        const level = await this.getLevel(member, args);

        if (level === undefined) {
            return this.ctx.helpHandler.levelError();
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
        if (args.length === 0) {
            const level = await this.ctx.levelHandler.get(member);
            if (level) return level.level;
            return await this.memberLevelSearch(member);
        }

        if (!Number.isNaN(Number(args[0]))) {
            return args[0];
        }
    }

    private async getDing(member: Discord.GuildMember, level: string): Promise<Ding> {
        const ding = await DingRepository.get(member.guild.id, member.id, level);

        if (ding) return ding;

        this.ctx.send.reply(" so I, uhh.. don't remember... I'll go try to find it.");

        const searchResult = await this.deepSearch(member.id, level);

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

    private deepSearch(userID: Discord.Snowflake, level: string) {
        const deepSearch = this.ctx.fetch.deepSearch(level);

        const searchJob: Job = {
            cancellationToken: { cancelled: false },
        };

        DingHandler.runningJobs.push(searchJob);
        deepSearch.onComplete(() => {
            DingHandler.runningJobs.splice(DingHandler.runningJobs.indexOf(searchJob), 1);
        })

        return deepSearch.doSearch(userID, searchJob.cancellationToken);
    }

    private memberLevelSearch(member: Discord.GuildMember): Promise<string> {
        const memberLevelSearch = this.ctx.fetch.getUserLevel(member);

        const levelJob: Job = {
            cancellationToken: { cancelled: false },
        };

        DingHandler.runningJobs.push(levelJob);
        memberLevelSearch.onComplete(this.removeJob(levelJob));

        return memberLevelSearch.doSearch(levelJob.cancellationToken);
    }

    private removeJob = (job: Job) => () => DingHandler.runningJobs.splice(DingHandler.runningJobs.indexOf(job), 1);
}
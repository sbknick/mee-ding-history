import Discord, { TextChannel } from "discord.js";

import { BotContext } from "../Bot";
import { MonitoringService } from "../Services/MonitoringService";
import { DingRepository } from "../Repositories/DingRepository";
import { Ding } from "../Models/Ding";
import { LevelRepository } from "../Repositories/LevelRepository";
import { Level } from "../Models/Level";


declare type Item = Discord.Guild | Discord.GuildMember | Discord.Channel | Discord.Message;

type Reportable = Ding | Level;

export class ReportHandler {
    constructor(
        private ctx: BotContext,
        private client: Discord.Client
    ) {}

    async report() {
        const report = MonitoringService.generateReport();
        await this.ctx.send.batchReply(report);
    }

    async clear(args: string[]) {
        MonitoringService.clear(args);
        await this.ctx.send.reply("Cleared.");
    }

    async found(args: string[]) {
        if (args.includes("dings") && !args.includes("levels")) {
            return await this.foundDings(args);
        }
        else if (args.includes("levels") && !args.includes("dings")) {
            return await this.foundLevels(args);
        }
        else {
            // return await this.foundCombined(args);
        }
    }

    private foundDings = (args: string[]) => this.doFound(DingRepository, this.dingSortFunc, args);
    private foundLevels = (args: string[]) => this.doFound(LevelRepository, this.levelSortFunc, args);

    private async doFound<T extends Reportable>(
        repo: { getStoredDebugDump: () => Promise<T[]> },
        sortFunc: (a: T, b: T) => number,
        args: string[]) {
        const found = await repo.getStoredDebugDump();
        found.sort(sortFunc);
        
        if (!args.includes("noresolve")) {
            await this.do_resolve(found);
        }

        for await (const page of this.smartPage(found)) {
            await this.ctx.send.reply(page);
        }
    }

    private async *smartPage<T>(items: T[]) {
        const strigified = items.map(x => JSON.stringify(x));
        let cursor = 0;

        while (cursor < strigified.length) {
            let page = "";
            do {
                page += JSON.stringify(strigified[cursor++]) + "\n";
            }
            while (cursor < strigified.length && page.length + strigified[cursor].length + 1 < 2000)
            yield page;
        }
    }

    private async do_resolve(items: Reportable[]) {
        if (!items) return;
        const cachedItems = new Map<Discord.Snowflake, Item>();
        const resolve: (ding: Reportable) => (type: "guild" | "member" | "channel" | "message") => Promise<Item> =
            item => async type => {
                const snowflake = type === "guild" ? item.guildID :
                                  type === "member" ? item.userID :
                                  type === "channel" ? (item as Ding).channelID :
                                  type === "message" ? (item as Ding).messageID :
                                  undefined;
                return cachedItems.has(snowflake) ? cachedItems.get(snowflake) :
                    cachedItems.set(snowflake, await (async () => {
                        switch (type) {
                            case "guild":
                                return this.client.guilds.get(snowflake);
                            
                            case "member":
                                {
                                    let guild = <Discord.Guild>cachedItems.get(item.guildID);
                                    return guild.members.get(snowflake);
                                }

                            case "channel":
                                {
                                    let guild = <Discord.Guild>cachedItems.get(item.guildID);
                                    return <TextChannel>guild.channels.get(snowflake);
                                }

                            case "message": 
                                let channel = <TextChannel>cachedItems.get((item as Ding).channelID);
                                return await channel.fetchMessage(snowflake);
                        }
                   })()).get(snowflake);
            };

        if (this.isDingArray(items)) {
            for (const ding of items) {
                const guild = await resolve(ding)("guild") as Discord.Guild;
                const member = await resolve(ding)("member") as Discord.GuildMember;
                const channel = await resolve(ding)("channel") as Discord.TextChannel;
                const message = await resolve(ding)("message") as Discord.Message;

                ding.guildID = guild.name;
                ding.userID = member.displayName;
                ding.channelID = channel.name;
                ding.messageID = message ? message.cleanContent : "<!> Message Not Found <!>";
            }
        }
        else if (this.isLevelArray(items)) {
            for (const level of items) {
                const guild = await resolve(level)("guild") as Discord.Guild;
                const member = await resolve(level)("member") as Discord.GuildMember;

                level.guildID = guild.name;
                level.userID = member.displayName;
            }
        }
    }

    private isDingArray(items: Reportable[]): items is Ding[] {
        return (items[0] as Ding).messageID !== undefined;
    }

    private isLevelArray(items: Reportable[]): items is Level[] {
        return (items[0] as Ding).messageID === undefined;
    }

    private dingSortFunc: (a: Ding, b: Ding) => number = (a, b) => {
        let diff: number;
        if ((diff = this.compare(a.guildID, b.guildID)) !== 0) return diff;
        if ((diff = this.compare(a.userID, b.userID)) !== 0) return diff;
        return this.compare(a.level, b.level);
    }

    private levelSortFunc: (a: Level, b: Level) => number = (a, b) => {
        let diff: number;
        if ((diff = this.compare(a.guildID, b.guildID)) !== 0) return diff;
        if ((diff = this.compare(a.userID,  b.userID)) !== 0) return diff;
        return this.compare(a.level, b.level);
    }

    private compare = (a: string, b: string) => Number.parseInt(a) - Number.parseInt(b);
}
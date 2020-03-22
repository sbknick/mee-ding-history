import Discord, { TextChannel } from "discord.js";

import { BotContext } from "../Bot";
import { MonitoringService } from "../Services/MonitoringService";
import { DingRepository } from "../Repositories/DingRepository";
import { Ding } from "../Models/Ding";


declare type Item = Discord.Guild | Discord.GuildMember | Discord.Channel | Discord.Message;

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
        const found = await DingRepository.thething();

        found.sort(this.sortFunc);

        if (args.includes("resolve")) {
            this.do_resolve(found);
        }

        const output = found.map(d => JSON.stringify(d)).join("\n");
        
        if (output.length < 2000)
            await this.ctx.send.dm(output);
        else {
            let cursor = 0;
            while (cursor < output.length) {
                const page = output.slice(cursor, cursor + 2000);
                await this.ctx.send.dm(page);
                cursor += page.length;
            }
        }
    }

    private do_resolve(dings: Ding[]) {
        const cachedItems = new Map<Discord.Snowflake, Item>();
        const resolve: (ding: Ding) => (type: "guild" | "member" | "channel" | "message") => Item =
            ding => type => {
                const snowflake = type === "guild" ? ding.guildID :
                                  type === "member" ? ding.userID :
                                  type === "channel" ? ding.channelID :
                                  type === "message" ? ding.messageID :
                                  undefined;
                return cachedItems.has(snowflake) ? cachedItems.get(snowflake) :
                    cachedItems.set(snowflake, (() => {
                        switch (type) {
                            case "guild":
                                return this.client.guilds.find(g => g.id === snowflake);
                            
                            case "member":
                                {
                                    let guild = <Discord.Guild>cachedItems.get(ding.guildID);
                                    return guild.members.get(snowflake);
                                }

                            case "channel":
                                {
                                    let guild = <Discord.Guild>cachedItems.get(ding.guildID);
                                    return <TextChannel>guild.channels.get(snowflake);
                                }

                            case "message": 
                                let channel = <TextChannel>cachedItems.get(ding.channelID);
                                return channel.messages.get(snowflake);
                        }
                   })()).get(snowflake);
            };


        for (const ding of dings) {
            const guild = resolve(ding)("guild") as Discord.Guild;
            const member = resolve(ding)("member") as Discord.GuildMember;
            const channel = resolve(ding)("channel") as Discord.TextChannel;
            const message = resolve(ding)("message") as Discord.Message;

            ding.guildID = guild.name;
            ding.userID = member.displayName;
            ding.channelID = channel.name;
            ding.messageID = message ? message.cleanContent : "<!> Message Not Found <!>";
        }
    }

    private sortFunc: (a: Ding, b: Ding) => number = (a, b) => {
        const gida = Number.parseInt(a.guildID),
              gidb = Number.parseInt(b.guildID),
              gidDiff = gida - gidb;
        if (gidDiff !== 0) return gidDiff;

        const uida = Number.parseInt(a.userID),
              uidb = Number.parseInt(b.userID),
              uidDiff = uida - uidb;
        if (uidDiff !== 0) return uidDiff;

        const lvla = Number.parseInt(a.level),
              lvlb = Number.parseInt(b.level);
        return lvla - lvlb;
    }
}
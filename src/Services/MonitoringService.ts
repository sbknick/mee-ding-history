import Discord from "discord.js";
import { BotContext } from "../Bot";


interface Service {
    requestingUserID?: Discord.Snowflake;
    command?: string;
    progress?: () => Number;
    timestamp?: Number;
}

type TimestampedService = Service & { timestamp: Number };

export class MonitoringService {
    // Key: GuildID
    readonly runningServices = new Map<Discord.Snowflake, TimestampedService[]>();

    constructor(
        private ctx: BotContext
    ) {}

    registerService(service: Service) {
        let serviceList = this.runningServices.get(this.ctx.member.guild.id);
    }
}
import Discord from "discord.js";


interface Service {
    requestingUserID?: Discord.Snowflake;
    messageID?: Discord.Snowflake;
    command?: string;
    progress?: () => Number;
}

type TimestampedService = Service & {
    timestamp: Number,
};

type SuccessfulService = TimestampedService & {
    endTimestamp: Number,
}

type ErroredService = SuccessfulService & {
    error: string,
};

class MonitoringServicex {
    // Key: GuildID
    private readonly runningServices = new Map<Discord.Snowflake, TimestampedService[]>();
    private readonly successfulServices = new Map<Discord.Snowflake, SuccessfulService[]>();
    private readonly erroredServices = new Map<Discord.Snowflake, ErroredService[]>();

    registerService(service: Service, guildID: Discord.Snowflake) {
        const serviceList = this.getServices(guildID);
        serviceList.push({ ...service, timestamp: Date.now() });
    }

    serviceFinished(service: Service, guildID: Discord.Snowflake, error?: string) {
        const serviceList = this.getServices(guildID);
        const registeredServiceIdx = serviceList.findIndex(s => s.messageID === service.messageID);

        if (registeredServiceIdx === -1) return;

        const svcs = serviceList.splice(registeredServiceIdx, 1);

        const finishedService = {
            ...svcs[0],
            endTimestamp: Date.now(),
        };

        if (error) {
            const errors = this.getErroredServices(guildID);
            errors.push({ ...finishedService, error });
        }
        else {
            const successes = this.getSuccessfulServices(guildID);
            successes.push(finishedService);
        }
    }

    private getServices(guildID: Discord.Snowflake) {
        return this.getListFrom(this.runningServices, guildID);
    }

    private getSuccessfulServices(guildID: Discord.Snowflake): SuccessfulService[] {
        return this.getListFrom(this.successfulServices, guildID) as SuccessfulService[];
    }

    private getErroredServices(guildID: Discord.Snowflake): ErroredService[] {
        return this.getListFrom(this.erroredServices, guildID) as ErroredService[];
    }

    private getListFrom(map: Map<Discord.Snowflake, TimestampedService[]>, guildID: Discord.Snowflake) {
        let serviceList = map.get(guildID);

        if (!serviceList) {
            map.set(guildID, serviceList = []);
        }

        return serviceList;
    }
}

export const MonitoringService = new MonitoringServicex();
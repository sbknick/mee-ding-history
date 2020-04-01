import Discord, { Message, ColorResolvable } from "discord.js";
import moment from "moment";


/// This is a bit haxy, but it works to add .format() to moment.Duration...
function format(duration: moment.Duration, format: string) {
    return moment.utc(duration.asMilliseconds()).format(format);
}

interface ServiceModel {
    username: string;
    guildID: Discord.Snowflake;
    messageID: Discord.Snowflake;
    command: string;
    name: string;
    progress: () => string;
}

class Service {
    constructor(
        private serviceModel: ServiceModel,
        private finishedDelegate: (serviceModel: ServiceModel, error?: string) => void,
    ) {}

    finished(error?: string) {
        this.finishedDelegate(this.serviceModel, error);
    }
}

type TimestampedService = ServiceModel & { timestamp: moment.Moment };
type SuccessfulService = TimestampedService & { endTimestamp: moment.Moment };
type ErroredService = SuccessfulService & { error: string };

class MonitoringServicex {
    // Key: GuildID
    private readonly runningServices = new Map<Discord.Snowflake, TimestampedService[]>();
    private readonly successfulServices = new Map<Discord.Snowflake, SuccessfulService[]>();
    private readonly erroredServices = new Map<Discord.Snowflake, ErroredService[]>();

    createService(msg: Message, name: string, progressDelegate: () => string): Service {
        let serviceModel: ServiceModel;
        
        if (msg) {
            serviceModel = {
                name,
                command: msg.cleanContent,
                messageID: msg.id,
                guildID: (msg.guild ? msg.guild.id : undefined),
                username: msg.member.displayName,
                progress: progressDelegate,
            };
        }
        else {
            serviceModel = {
                name,
                progress: progressDelegate,
            } as ServiceModel;
        }

        this.registerService(serviceModel);

        return new Service(serviceModel, this.serviceFinished);
    }

    generateReport(): (string | Discord.RichEmbed)[] {
        const embeds: (string | Discord.RichEmbed)[] = [];
        
        let services = this.toFlatArray(this.runningServices);
        if (services.length > 0) {
            embeds.push("**Running Services:**", ...this.formatEmbeds(services, "BLUE"));
        }

        services = this.toFlatArray(this.successfulServices);
        if (this.successfulServices.size > 0) {
            embeds.push("**Successful Services:**", ...this.formatEmbeds(services, "GREEN"));
        }

        services = this.toFlatArray(this.erroredServices);
        if (this.erroredServices.size > 0) {
            embeds.push("**Errored Services:**", ...this.formatEmbeds(services, "RED"));
        }

        return embeds.concat("Report's Done.");
    }

    clear(args: string[]) {
        // if (args[2] === "all")
        // if (args[2] === )

        this.runningServices.clear();
        this.successfulServices.clear();
        this.erroredServices.clear();
    }

    private serviceFinished = (service: ServiceModel, error?: string) => {
        const serviceList = this.getRunningServices(service.guildID);
        const registeredServiceIdx = serviceList.findIndex(s => s.messageID === service.messageID);

        if (registeredServiceIdx === -1) return;

        const svcs = serviceList.splice(registeredServiceIdx, 1);

        const finishedService = {
            ...svcs[0],
            endTimestamp: moment(),
        };

        if (error) {
            const errors = this.getErroredServices(service.guildID);
            errors.push({ ...finishedService, error });
        }
        else {
            const successes = this.getSuccessfulServices(service.guildID);
            successes.push(finishedService);
        }
    }

    private registerService(service: ServiceModel) {
        const serviceList = this.getRunningServices(service.guildID);
        serviceList.push({ ...service, timestamp: moment() });
    }

    private formatEmbeds(services: [string, TimestampedService][], color: ColorResolvable): Discord.RichEmbed[] {
        return services
            .map(kvp => ({
                service: kvp[1],
                elapsedTime: this.getElapsedTime(kvp[1].timestamp, (<SuccessfulService>kvp[1]).endTimestamp || moment()) 
            }))
            .map(({ service, elapsedTime }) => ({
                service,
                embed: new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(service.name)
                    .addField("Cmd", service.command, true)
                    .addField("User", service.username, true)
                    .addBlankField(true)
                    .addField("Progress", service.progress(), true)
                    .addField("Time Elapsed", elapsedTime, true)
            }))
            .map(({ service, embed }) =>
                (<any>service).error
                    ? embed.addField("Error", (<any>service).error)
                    : embed);
    }

    private getElapsedTime(m1: moment.Moment, m2: moment.Moment): string {
        const end = m1 > m2 ? m1 : m2;
        const start = m1 > m2 ? m2 : m1;
        const duration = moment.duration(end.diff(start));

        let fmat = "ss.SSS";
        if (duration.asSeconds() > 60) {
            fmat = "mm:" + fmat;
        }
        if (duration.asMinutes() > 60) {
            fmat = "hh:" + fmat;
        }
        return format(duration, fmat);
    }

    private toFlatArray<K, V>(map: Map<K, V[]>): [K, V][] {
        const out: [K, V][] = [];

        for (const [k, vs] of map)
            for (const v of vs)
                out.push([k, v]);

        return out;
    }

    private getRunningServices = (guildID: Discord.Snowflake) => this.getListFrom(this.runningServices, guildID);
    private getSuccessfulServices = (guildID: Discord.Snowflake) => this.getListFrom(this.successfulServices, guildID) as SuccessfulService[];
    private getErroredServices = (guildID: Discord.Snowflake) => this.getListFrom(this.erroredServices, guildID) as ErroredService[];

    private getListFrom(map: Map<Discord.Snowflake, TimestampedService[]>, guildID: Discord.Snowflake) {
        let serviceList = map.get(guildID);

        if (!serviceList) {
            map.set(guildID, serviceList = []);
        }

        return serviceList;
    }
}

export const MonitoringService = new MonitoringServicex();
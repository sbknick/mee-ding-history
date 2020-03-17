import Discord, { Message } from "discord.js";
import moment from "moment";


/// This is a bit haxy, but it works to add .format() to moment.Duration...
function format(duration: moment.Duration, format: string) {
    return moment.utc(duration.asMilliseconds()).format(format);
}

interface ServiceModel {
    requestingUserID: Discord.Snowflake;
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

    constructor() {
        // const serviceList = this.getServices("guildID");

        // serviceList.push({
        //     command: "!ding me 1",
        //     messageID: "1",
        //     requestingUserID: "11",
        //     timestamp: moment().add(-20, "seconds"),
        //     progress: () => "AN AMOUNT"
        // }, {
        //     command: "!ding user <@1232131231>",
        //     messageID: "2",
        //     requestingUserID: "11",
        //     timestamp: moment().add(-15, "minutes"),
        //     progress: () => "7."
        // });

        // const successServiceList = this.getSuccessfulServices("guildID");

        // successServiceList.push({
        //     command: "shrug",
        //     messageID: "3",
        //     requestingUserID: "nah",
        //     timestamp: moment().add(-2, "hours"),
        //     endTimestamp: moment().add(-1, "hours").add(-10, "minutes"),
        //     progress: () => ">.>"
        // });
        
        // const errorServiceList = this.getErroredServices("guildID");

        // errorServiceList.push({
        //     command: "!ding me 1",
        //     messageID: "1",
        //     requestingUserID: "11",
        //     timestamp: moment().add(-20, "seconds"),
        //     endTimestamp: moment(),
        //     error: "is an error",
        //     progress: () => "AN AMOUNT"
        // }, {
        //     command: "!ding user <@1232131231>",
        //     messageID: "2",
        //     requestingUserID: "11",
        //     timestamp: moment().add(-15, "minutes"),
        //     endTimestamp: moment(),
        //     error: "also a err",
        //     progress: () => "7."
        // });

    }

    createService(msg: Message, name: string, progressDelegate: () => string): Service {
        const serviceModel: ServiceModel = {
            name,
            command: msg.cleanContent,
            messageID: msg.id,
            guildID: (msg.guild ? msg.guild.id : undefined),
            requestingUserID: msg.author.id,
            progress: progressDelegate,
        };

        this.registerService(serviceModel);

        return new Service(serviceModel, this.serviceFinished);
    }

    generateReport() {
        const running = () => {
            const servs = this.toFlatArray(this.runningServices);

            return [
                "Running requests:",
                ...(servs.length > 0 ? servs.map(this.format) : [ "None" ])
            ];
        }

        const successful = () => {
            const servs = this.toFlatArray(this.successfulServices);

            return [
                "",
                "Successful requests:",
                ...(servs.length > 0 ? servs.map(this.format) : [ "None" ])
            ];
        }

        const errors = () => {
            const errs = this.toFlatArray(this.erroredServices);

            if (errors.length === 0) return [];

            return [
                "",
                "Errored requests:",
                ...errs.map(this.format)
            ];
        };
        
        return [
            ...running(),
            ...successful(),
            ...errors(),
        ].join("\n");
    }

    clear(args: string[]) {
        // if (args[2] === "all")
        // if (args[2] === )

        this.runningServices.clear();
        this.successfulServices.clear();
        this.erroredServices.clear();
    }

    private serviceFinished = (service: ServiceModel, error?: string) => {
        const serviceList = this.getServices(service.guildID);
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
        const serviceList = this.getServices(service.guildID);
        serviceList.push({ ...service, timestamp: moment() });
    }

    private format = (kvp: [string, (TimestampedService | SuccessfulService | ErroredService)]) => {
        const service = kvp[1];
        const elapsedTime = this.getElapsedTime(service.timestamp, (<SuccessfulService>service).endTimestamp || moment());
        return `    User ${service.requestingUserID} -- ${service.command} -- ${service.name} -- ${service.progress()} -- Elapsed: ${elapsedTime}` +
        ((<any>service).error ? ` -- Error: ${(<any>service).error}` : "");
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

    private getServices = (guildID: Discord.Snowflake) => this.getListFrom(this.runningServices, guildID);
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
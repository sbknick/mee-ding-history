import Discord from "discord.js";
import Redis from "ioredis";

import { Ding } from "../Models/Ding";
import { logger } from "../Logger";


class DingRepositoryx {
    private readonly redis: Redis.Redis;
    private readonly stored: string[] = [];

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);

        this.redis.connect(() => logger.info("Redis connected."));

        if (process.env.MONITOR_REDIS)
            this.setupRedisMonitoring();
    }

    async add(ding: Ding) {
        const key = this.getKeyFor(ding);
        await this.redis.pipeline()
            .hmset(key, ding)
            // .expire(key, Common.memoryThreshold)
            .exec();
        this.stored.push(key);
    }

    async get(guildID: Discord.Snowflake, userID: Discord.Snowflake, level: string) {
        const key = this.getKey(guildID, userID, level);
        const dingRecord = await this.redis.hgetall(key);
        return this.toDing(dingRecord);
    }

    async thething() {
        const output: Ding[] = [];
        for (const key of this.stored) {
            const dingRecord = await this.redis.hgetall(key);
            output.push(this.toDing(dingRecord));
        }

        return output;
    }

    private setupRedisMonitoring() {
        const redisMonitoringConnection = new Redis(process.env.REDIS_URL);

        const isCmdICareAbout = (cmd: string) => {
            switch (cmd.toLowerCase()) {
                case "auth":
                case "info":
                case "ping":
                    return false;

                default:
                    return true;
            }
        }
        
        redisMonitoringConnection.monitor((err, monitor) => {
            if (err) {
                logger.error(err);
            }
            
            monitor.on("monitor", (...args) => {
                const [cmd] = args[1];
                if (isCmdICareAbout(cmd)) {
                    logger.info(cmd);
                    logger.info(args);
                }
            });
        });
    }

    private getKeyFor = (ding: Ding) => this.getKey(ding.guildID, ding.userID, ding.level);

    private getKey = (guildID: Discord.Snowflake, userID: Discord.Snowflake, level: string) => `${guildID}:${userID}:${level}`;

    private toDing: (record: Record<string, string>) => Ding = record => ({
            userID: record["userID"],
            guildID: record["guildID"],
            level: record["level"],
            messageID: record["messageID"],
            channelID: record["channelID"],
        });
}

export const DingRepository = new DingRepositoryx();
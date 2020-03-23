import Discord from "discord.js";
import Redis from "ioredis";

import { logger } from "../Logger";
import { Ding } from "../Models/Ding";
import { Level } from "../Models/Level";
import { Common } from "../Common";


interface CacheAccess<TModel> {
    add: (model: TModel) => Promise<void>;
    get: (...args) => Promise<TModel>;
}

class Redisx {
    private readonly redis: Redis.Redis = new Redis(process.env.REDIS_URL);
    private readonly storedDings: string[] = [];
    private readonly storedLevels: string[] = [];

    constructor() {
        this.redis.connect(() => logger.info("Redis connected."));
        
        if (process.env.MONITOR_REDIS)
            this.setupRedisMonitoring();
    }

    readonly ding: CacheAccess<Ding> = {
        add: async (ding: Ding) => {
            const key = this.getKeyForDing(ding);
            await this.redis.pipeline()
                .hmset(key, ding)
                // .expire(key, Common.memoryThreshold)
                .exec();
            this.storedDings.push(key);
        },

        get: async (guildID: Discord.Snowflake, userID: Discord.Snowflake, level: string) => {
            const key = this.getKey(guildID, userID, level);
            const record = await this.redis.hgetall(key);
            
            if (record.hasOwnProperty("userID"))
                return this.toDing(record);
        },
    }

    readonly level: CacheAccess<Level> = {
        add: async (level: Level) => {
            const key = this.getKey(level.guildID, level.userID, "L");
            await this.redis.pipeline()
                .set(key, level.level)
                // .expire(key, Common.memoryThreshold)
                .exec();
            this.storedLevels.push(key);
        },

        get: async (guildID: Discord.Snowflake, userID: Discord.Snowflake) => {
            const key = this.getKey(guildID, userID, "L");
            return {
                guildID,
                userID,
                level: await this.redis.get(key),
            };
        },
    };

    async getStoredDebugDump(type: "dings" | "levels") {
        switch (type) {
            case "dings":
                {
                    const output: Ding[] = [];
                    for (const key of this.storedDings) {
                        const dingRecord = await this.redis.hgetall(key);
                        output.push(this.toDing(dingRecord));
                    }

                    return output;
                }

            case "levels":
                {
                    const output: Level[] = []
                    for (const key of this.storedLevels) {
                        const levelRecord = await this.redis.get(key);
                        output.push(this.toLevel(key, levelRecord));
                    }
                }
        }
    }

    private getKeyForDing = (ding: Ding) => this.getKey(ding.guildID, ding.userID, ding.level);
    
    private getKey = (guildID: Discord.Snowflake, userID: Discord.Snowflake, level: string) => `${guildID}:${userID}:${level}`;

    private toDing: (record: Record<string, string>) => Ding = record => ({
        userID: record["userID"],
        guildID: record["guildID"],
        level: record["level"],
        messageID: record["messageID"],
        channelID: record["channelID"],
    });
    
    private toLevel(key: string, levelRecord: string): Level {
        const keyBits = key.split(":");
        return {
            userID: keyBits[1],
            guildID: keyBits[0],
            level: levelRecord,
        };
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
}

export const Cache = new Redisx();
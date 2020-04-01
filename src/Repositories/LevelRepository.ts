import Discord from "discord.js";

import { Cache } from "./Cache";
import { Level } from "../Models/Level";



class LevelRepositoryx {
    async add(level: Level) {
        await Cache.level.add(level);
    }

    async get(guildID: Discord.Snowflake, userID: Discord.Snowflake) {
        return Cache.level.get(guildID, userID);
    }

    async getStoredDebugDump() {
        return Cache.getStoredLevels_DebugDump();
    }
}

export const LevelRepository = new LevelRepositoryx();

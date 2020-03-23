import Discord from "discord.js";

import { Ding } from "../Models/Ding";
import { Cache } from "./Cache";



class DingRepositoryx {
    async add(ding: Ding) {
        await Cache.addDing(ding);
    }

    get(guildID: Discord.Snowflake, userID: Discord.Snowflake, level: string) {
        return Cache.getDing(guildID, userID, level);
    }

    async getStoredDebugDump() {
        return Cache.getStoredDebugDump("dings");
    }
}

export const DingRepository = new DingRepositoryx();
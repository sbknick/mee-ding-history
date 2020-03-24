import Discord from "discord.js";

import { Ding } from "../Models/Ding";
import { Cache } from "./Cache";



class DingRepositoryx {
    async add(ding: Ding) {
        await Cache.ding.add(ding);
    }

    get(guildID: Discord.Snowflake, userID: Discord.Snowflake, level: string) {
        return Cache.ding.get(guildID, userID, level);
    }

    async getStoredDebugDump() {
        return Cache.getStoredDings_DebugDump();
    }
}

export const DingRepository = new DingRepositoryx();
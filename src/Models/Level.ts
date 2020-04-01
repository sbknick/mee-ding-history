import Discord from "discord.js";


export interface Level {
    userID: Discord.Snowflake,
    guildID: Discord.Snowflake,
    level: string,
}
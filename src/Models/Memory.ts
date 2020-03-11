import Discord from "discord.js";


export interface Memory {
    userID: Discord.Snowflake,
    channelID: Discord.Snowflake,
    messageID: Discord.Snowflake
}
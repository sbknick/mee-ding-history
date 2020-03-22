import Discord from "discord.js";


export interface Ding {
    userID: Discord.Snowflake;
    guildID: Discord.Snowflake;
    level: string;

    messageID: Discord.Snowflake;
    channelID: Discord.Snowflake;

    message?: Discord.Message;
}
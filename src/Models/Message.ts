import Discord from "discord.js";


export interface Message {
    userID: Discord.Snowflake,
    channelID: Discord.Snowflake,
    messageID: Discord.Snowflake,
    message: string,
    source: Discord.Message
}

export interface MessageHandler {
    (msg: Message): Promise<void>;
}
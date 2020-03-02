import Discord from "discord.js";


export interface Message {
    userID: string,
    channelID: string,
    messageID: string,
    message: string,
    source: Discord.Message
}

export interface MessageHandler {
    (msg: Message): void;
}
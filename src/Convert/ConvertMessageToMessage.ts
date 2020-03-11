import Discord from "discord.js";
import { Message, MessageHandler } from "../Models/Message";


type DiscordMessageHandler = (msg: Discord.Message) => void;

export function ToMyMessage() { return new Converter(); }

class Converter {
    then: (action: MessageHandler) => DiscordMessageHandler =
        action => discordMessage => action(ConvertMessageToMessage(discordMessage));
}

function ConvertMessageToMessage(msg: Discord.Message): Message {
    return {
        userID: msg.author.id,
        channelID: msg.channel.id,
        messageID: msg.id,
        message: msg.content,
        source: msg,
    };
}
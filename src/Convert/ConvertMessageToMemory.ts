import { Memory } from "../Models/Memory";
import { Message } from "../Models/Message";


export function ToMemory(msg: Message): Memory { return ConvertMessageToMemory(msg); }

function ConvertMessageToMemory(msg: Message): Memory {
    return {
        userID: msg.userID,
        channelID: msg.channelID,
        messageID: msg.messageID,
    };
}
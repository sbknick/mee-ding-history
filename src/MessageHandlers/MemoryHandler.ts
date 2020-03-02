import IHandler from "./IHandler";
import { Bot } from "../Bot";
import { Convert } from "../Convert";
import { Memory } from "../Models/Memory";
import { MessageHandler } from "../Models/Message";


class MemoryHandler implements IHandler {
    // key: userID
    private lastMessageMap: Map<string, Memory> = new Map<string, Memory>();

    public constructor (
        private bot: Bot
    ) {}

    public handle: MessageHandler = msg => {
        this.lastMessageMap.set(msg.userID, Convert.ToMemory(msg));
    }

    public repeat: MessageHandler = msg => {
        const m = this.lastMessageMap.get(msg.userID);
        const result = this.bot.retrieveMessage(m);
        this.bot.reply(msg, `\n> ${result}`);
    }
}

export default MemoryHandler

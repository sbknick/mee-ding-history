import { BotContext } from "../Bot";
import { Convert } from "../Convert";
import { Memory } from "../Models/Memory";
import { MessageHandler } from "../Models/Message";


export class MemoryHandler {
    // key: userID
    private lastMessageMap: Map<string, Memory> = new Map<string, Memory>();

    public constructor (
        private ctx: BotContext
    ) {}

    public remember: MessageHandler = msg => {
        this.lastMessageMap.set(msg.userID, Convert.ToMemory(msg));
    }

    // public repeat: MessageHandler = msg => {
    //     const m = this.lastMessageMap.get(msg.userID);
    //     const result = this.ctx.retrieveMessage(m);
    //     this.ctx.reply(`\n> ${result}`);
    // }

    public commit: MessageHandler = msg => {
        const user = msg.source.mentions.users.first();
        //TODO
    }
}
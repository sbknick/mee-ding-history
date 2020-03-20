import Discord from "discord.js";

import { logger } from "../Logger";
import { Message } from "../Models/Message";
import { Memory } from "../Models/Memory";

import { BotContext, FullScan } from ".";


export class Bot {
    private mee6: Discord.User;
    private ctx: BotContext;

    constructor(
        public client: Discord.Client
    ) {
        this.client.on("ready", async () => {
            this.client.user.setUsername("Ding-Bot");

            // I really hope MEE6 uses the same userID across Guilds...
            this.mee6 = await this.client.fetchUser("159985870458322944");

            if (!this.mee6) {
                logger.error("Unable to find MEE6! :sob:");
            }

            logger.info("Ready! " + this.client.user.username + " - (" + this.client.user.id + ")");

            const fullScanTask = new FullScan(this.client, this.mee6);
            fullScanTask.doScan(); // await
        });
    }

    public createMsgContext = (msg: Message) => {
        this.ctx = new BotContext(this, msg);
        return this.ctx.executor;
    }

    public getMsgContext = (msg: Message) => this.ctx;

    public userID = () => this.client.user.id;
    public mee6UserID = () => this.mee6.id;

    public retrieveMessage: (memory: Memory) => string = memory => {
        const ch = <Discord.TextChannel>this.client.channels.get(memory.channelID);
        const msg = ch.messages.get(memory.messageID);

        return msg.content;
    }
}
import Discord from "discord.js";

import { logger } from "../Logger";
import { Message } from "../Models/Message";

import { BotContext, FullScan } from ".";


export class Bot {
    private mee6: Discord.User;
    private ctxMap = new Map<Message, BotContext>();

    public get userID() { return this.client.user.id; }
    public get mee6UserID() { return this.mee6.id; }

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
        const ctx = new BotContext(this, msg);
        ctx.onComplete(() => this.ctxMap.delete(msg));
        this.ctxMap.set(msg, ctx);
        return ctx.executor;
    }

    public getMsgContext = (msg: Message) => this.ctxMap.get(msg).executor;
}
import Discord from "discord.js";
import logger from "winston";

import { Message } from "../Models/Message";
import { Memory } from "../Models/Memory";

import { BotContext } from ".";


export class Bot {
    private mee6: Discord.User;

    constructor(
        private client: Discord.Client
    ) {
        this.client.on("ready", async () => {
            this.client.user.setUsername("Ding-Bot");

            // I really hope MEE6 uses the same userID across Guilds...
            this.mee6 = await this.client.fetchUser("159985870458322944");

            if (!this.mee6) {
                logger.error("Unable to find MEE6! :sob:");
            }

            logger.info("Ready! " + this.client.user.username + " - (" + this.client.user.id + ")");
        });
    }

    public getMsgContext = (msg: Message) => {
        return new BotContext(msg, this).executor;
    }

    public userID = () => this.client.user.id;
    public mee6UserID = () => this.mee6.id;

    public reply = (msg: Message, response: string) => msg.source.reply(response);
    public dm = (msg: Message, response: string) => msg.source.author.send(response);

    public retrieveMessage: (memory: Memory) => string = memory => {
        const ch = <Discord.TextChannel>this.client.channels.get(memory.channelID);
        const msg = ch.messages.get(memory.messageID);

        return msg.content;
    }
}
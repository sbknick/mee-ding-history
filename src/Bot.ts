import Discord from "discord.js";
import logger from "winston";

import { Message } from "./Models/Message";
import { Memory } from "./Models/Memory";


export class Bot {
    constructor(
        private client: Discord.Client
    ) {
        this.client.on("ready", () => {
            logger.info("Connected");
            logger.info("Logged in as: ");
            logger.info(this.client.user.username + " - (" + this.client.user.id + ")");
        });
    }

    public reply = (msg: Message, response: string) => {
        msg.source.reply(response);
    }

    public dm = (msg: Message, response: string) => {
        msg.source.author.send(response);
    }

    public retrieveMessage: (memory: Memory) => string = memory => {
        const ch = <Discord.TextChannel>this.client.channels.get(memory.channelID);
        const msg = ch.messages.get(memory.messageID);

        return msg.content;
    }

    public userID = () => this.client.user.id;
}
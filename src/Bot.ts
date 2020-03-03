import Discord, { TextChannel } from "discord.js";
import logger from "winston";

import { Message } from "./Models/Message";
import { Memory } from "./Models/Memory";


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

            logger.info("Ready");
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

    public deepSearch = async (msg: Message, ...searchTerms: string[]) => {
        const channels = msg.source.guild.channels.filter(ch => ch.type == "text");

        let cancel = false;
        let foundMessage: Discord.Message;

        for (let channel of channels.map(ch => <TextChannel>ch)) {
            if (cancel) break;

            let before: string;
            
            while (!cancel) {

                let messages = await channel.fetchMessages({
                    limit: 100,
                    before,
                });

                const filter = (m: Discord.Message) =>
                    m.author.id == this.mee6.id && searchTerms.every(term => m.content.indexOf(term) != -1);

                for (let message of messages.filter(filter).map(m => m)) {
                    if (cancel) break;

                    if (message.mentions.users.size > 0) {
                        let drilldownMessages = await message.channel.fetchMessages({
                            limit: 1,
                            before: message.id
                        });

                        if (drilldownMessages.first().author.id == msg.source.mentions.users.first().id) {
                            foundMessage = drilldownMessages.first();
                            cancel = true;
                        }
                    }
                }

                if (!cancel) {
                    let oldestMessage = messages.reduce((acc: Discord.Message, val) => {
                        if (!acc) return val;
                        if (val.createdTimestamp < acc.createdTimestamp) return val;
                        return acc;
                    });
                    before = oldestMessage && oldestMessage.id;
                }
            }
        }

        if (foundMessage) {
            msg.source.reply("\n> " + foundMessage.content);
        }
    }

    public userID = () => this.client.user.id;
    public mee6userID = () => this.mee6.id;
}
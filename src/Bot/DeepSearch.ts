import Discord, { TextChannel } from "discord.js";
import logger from "winston";

import { BotContext } from ".";


export class DeepSearch {
    private userID: Discord.Snowflake;

    constructor(
        private ctx: BotContext,
        private guild: Discord.Guild,
        private searchTerms: string[]
    ) {}

    me(): Promise<Discord.Message> {
        logger.info(`Request: Deep Search: Me`);
        this.userID = this.ctx.userID;
        return this.doSearch();
    }

    mention(): Promise<Discord.Message> {
        logger.info(`Request: Deep Search: Mention`);
        this.userID = this.ctx.mentionUserID;
        return this.doSearch();
    }

    private async doSearch(): Promise<Discord.Message> {
        logger.info(`Starting user-requested deepSearch for userID: ${this.userID}`);
        const channels = this.guild.channels.filter(ch => ch.type == "text");
        
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
                    m.author.id == this.ctx.mee6UserID && this.searchTerms.every(term => m.content.indexOf(term) != -1);

                for (let message of messages.filter(filter).map(m => m)) {
                    if (cancel) break;

                    if (message.mentions.users.size > 0) {
                        let drilldownMessages = await message.channel.fetchMessages({
                            limit: 1,
                            before: message.id
                        });

                        let tm = drilldownMessages.first();
                        if (tm.author.id == this.userID) {
                            foundMessage = tm;
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
            return foundMessage;
        }
    }
}
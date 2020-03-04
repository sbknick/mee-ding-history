import Discord, { TextChannel } from "discord.js";
import logger from "winston";

import { BotContext } from ".";


export class DeepSearch {
    private static readonly pageSize = 100;

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

        let cancelled = false;
        let foundMessage: Discord.Message;

        const channels = this.getGuildTextChannels();

        for (const channel of channels) {
            if (cancelled) break;
            let before: string = undefined;

            while (!cancelled) {
                const messages = await this.fetchMatchingMessages(channel, before);
                if (messages.length == 0) break;

                for (const message of messages) {
                    const prev = await this.fetchPreviousMessage(message);

                    if (prev.author.id != this.userID) {
                        throw new Error("previous message is not the expected author!");
                    }

                    foundMessage = prev;
                    cancelled = true;
                    break;
                }

                before = this.oldest(messages).id;
            }
        }

        return foundMessage;
    }

    private getGuildTextChannels() {
        const channels = this.guild.channels.filter(ch => ch.type == "text");
        return channels.map(ch => <TextChannel>ch);
    }

    private async fetchMatchingMessages(channel: Discord.TextChannel, before: string) {
        let messages = await channel.fetchMessages({
            limit: DeepSearch.pageSize,
            before,
        });

        return messages.filter(this.messageFilter).map(m => m);
    }
    
    private messageFilter = (msg: Discord.Message) =>
        msg.author.id == this.ctx.mee6UserID && this.searchTerms.every(term => msg.cleanContent.indexOf(term) != -1);

    private async fetchPreviousMessage(msg: Discord.Message) {
        let drilldownMessages = await msg.channel.fetchMessages({
            limit: 1,
            before: msg.id
        });

        return drilldownMessages.first();
    }

    private oldest(msgs: Discord.Message[]) {
        return msgs.reduce((acc, val) => {
            if (!acc) return val;
            if (val.createdTimestamp < acc.createdTimestamp) return val;
            return acc;
        });
    }
}
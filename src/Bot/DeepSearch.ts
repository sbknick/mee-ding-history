import Discord, { TextChannel } from "discord.js";

import { logger } from "../Logger";

import { BotContext } from ".";


export class DeepSearch {
    private static readonly pageSize = 100;
    private static readonly numberRegex = /([\d])+/;

    constructor(
        private ctx: BotContext,
        private guild: Discord.Guild,
        private searchTerm: string,
        private level: string
    ) {}

    async doSearch(userID: string): Promise<Discord.Message> {
        logger.info(`Starting user-requested deepSearch for userID: ${userID}`);

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

                    if (prev.author.id != userID) {
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
        msg.author.id == this.ctx.mee6UserID &&
        msg.cleanContent.indexOf(this.searchTerm) != -1 &&
        DeepSearch.numberRegex.exec(msg.cleanContent)[0] == this.level;

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
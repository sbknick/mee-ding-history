import Discord, { TextChannel } from "discord.js";

import { BotContext } from ".";
import { Common } from "../Common";
import { logger } from "../Logger";
import { MonitoringService } from "../Services/MonitoringService";
import { OnComplete } from "./OnComplete";


//                        [ matchedMessages, shouldSearchMore, oldestMessageID ]
type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

/**
 * @deprecated A combination of FullScan and Realtime Listening is now used to find and cache ding messages.
 * This is planned removed after production launch and stabilization of those two features.
 */
export class DeepSearch extends OnComplete {
    constructor(
        private ctx: BotContext,
        private msg: Discord.Message,
        private searchTerm: string,
        private level: string
    ) {
        super();
    }

    private progress = {
        done: 0,
        calc: () => this.progress.done.toString(),
    };

    async doSearch(userID: string, cancellationToken: { cancelled: boolean }): Promise<Discord.Message> {
        logger.info(`Starting user-requested deepSearch for userID: ${userID}`);
        const service = MonitoringService.createService(this.msg, DeepSearch.name, this.progress.calc);

        let message: Discord.Message;
        try {
            message = await this.doSearchInternal(userID, cancellationToken);
            service.finished();
            this.completed(true);
            return message;
        }
        catch (err) {
            if (err instanceof Error) {
                service.finished(err.message);
            }
            this.completed(false);
            throw err;
        }
    }

    private async doSearchInternal(userID: string, cancellationToken: { cancelled: boolean }): Promise<Discord.Message> {
        let foundMessage: Discord.Message;
        let messages: Discord.Message[];

        const channels = this.getGuildTextChannels();

        for (const channel of channels) {
            if (cancellationToken.cancelled) break;
            let before: string = undefined;
            let keepGoing: boolean = true;

            while (!cancellationToken.cancelled && keepGoing) {
                [messages, keepGoing, before] = await this.fetchMatchingMessages(userID, channel, before);

                for (const message of messages) {
                    const prev = await this.fetchPreviousMessage(message);

                    if (prev.author.id != userID) {
                        throw new Error("previous message is not the expected author!");
                    }

                    foundMessage = prev;
                    cancellationToken.cancelled = true;
                    break;
                }
            }
        }

        return foundMessage;
    }

    private getGuildTextChannels() {
        const channels = this.msg.guild.channels.cache.filter(ch => ch.type === "text");
        return channels.map(ch => <TextChannel>ch);
    }

    private async fetchMatchingMessages(userID: Discord.Snowflake, channel: Discord.TextChannel, before: string): Promise<MatchingMessagesTuple> {
        const messages = await channel.messages.fetch({
            limit: Common.searchPageSize,
            before,
        });

        const keepGoing = messages.size > 0;
        const newBefore = keepGoing && this.oldest(messages.array()).id;

        this.progress.done += messages.size;

        return [
            messages.filter(this.messageFilter(userID)).map(m => m),
            keepGoing,
            newBefore
        ];
    }
    
    private messageFilter = (userID: Discord.Snowflake) => (msg: Discord.Message) =>
        msg.author.id === this.ctx.mee6UserID &&
        msg.mentions.members.size > 0 &&
        msg.mentions.members.first().id === userID &&
        msg.cleanContent.indexOf(this.searchTerm) !== -1 &&
        Common.extractNumber(msg.cleanContent) === this.level;

    private async fetchPreviousMessage(msg: Discord.Message) {
        let drilldownMessages = await msg.channel.messages.fetch({
            limit: 1,
            before: msg.id,
        });

        return drilldownMessages.find(m => m.author.id === msg.mentions.members.first().id);
    }

    private oldest(msgs: Discord.Message[]) {
        return msgs.reduce((acc, val) => {
            if (!acc) return val;
            if (val.createdTimestamp < acc.createdTimestamp) return val;
            return acc;
        });
    }
}
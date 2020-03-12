import Discord, { TextChannel } from "discord.js";

import { logger } from "../Logger";

import { BotContext } from ".";
import { MonitoringService } from "../Services/MonitoringService";
import { Common } from "../Common";


//                        [ matchedMessages, shouldSearchMore, oldestMessageID ]
type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

export class DeepSearch {
    constructor(
        private ctx: BotContext,
        private msg: Discord.Message,
        // private guild: Discord.Guild,
        private searchTerm: string,
        private level: string
    ) {}

    private progress = {
        total: 0,
        done: 0,
        calc: () => `${this.progress.done}/${this.progress.total} (${ Math.floor(100 * this.progress.done / this.progress.total)}%)`,

        register: () => MonitoringService.registerService({
            command: this.msg.cleanContent,
            messageID: this.msg.id,
            requestingUserID: this.msg.author.id,
            progress: this.progress.calc,
        }, this.msg.guild.id),

        error: (error: string) => {},

        success: () => {
            this.progress.done = this.progress.total;
        },
    };

    async doSearch(userID: string): Promise<Discord.Message> {
        logger.info(`Starting user-requested deepSearch for userID: ${userID}`);
        this.progress.register();

        let cancelled = false;
        let foundMessage: Discord.Message;
        let messages: Discord.Message[];

        const channels = this.getGuildTextChannels();

        for (const channel of channels) {
            this.progress.total += channel.messages.size;

            if (cancelled) break;
            let before: string = undefined;
            let keepGoing: boolean = true;

            while (!cancelled && keepGoing) {
                [messages, keepGoing, before] = await this.fetchMatchingMessages(userID, channel, before);

                for (const message of messages) {
                    const prev = await this.fetchPreviousMessage(message);

                    if (prev.author.id != userID) {
                        throw new Error("previous message is not the expected author!");
                    }

                    foundMessage = prev;
                    cancelled = true;
                    break;
                }
            }
        }

        if (foundMessage) {
            this.progress.done = this.progress.total;
        }

        return foundMessage;
    }

    private getGuildTextChannels() {
        const channels = this.msg.guild.channels.filter(ch => ch.type === "text");
        return channels.map(ch => <TextChannel>ch);
    }

    private async fetchMatchingMessages(userID: Discord.Snowflake, channel: Discord.TextChannel, before: string): Promise<MatchingMessagesTuple> {
        const messages = await channel.fetchMessages({
            limit: Common.searchPageSize,
            before,
        });

        const keepGoing = messages.size > 0;
        const newBefore = keepGoing && this.oldest(messages.array()).id;

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
        let drilldownMessages = await msg.channel.fetchMessages({
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
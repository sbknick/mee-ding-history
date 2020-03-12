import Discord, { TextChannel } from "discord.js";

import { logger } from "../Logger";

import { BotContext } from ".";
import { Common } from "../Common";


//                        [ matchedMessages, shouldSearchMore, oldestMessageID ]
type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

export class MemberLevelSearch {
    constructor(
        private ctx: BotContext,
        private member: Discord.GuildMember,
        private searchTerm: string,
    ) {}

    async doSearch(): Promise<string> {
        logger.info(`Starting deep search for level of userID: ${this.member.id}`);

        const channels = this.getGuildTextChannels();

        const beforeMap = new Map<Discord.Channel, MatchingMessagesTuple>(channels.map(ch => [ch, [undefined, true, undefined]]));

        let levelResult = "0";

        while (levelResult === "0" && this.any(beforeMap, m => m[1] /* keepGoing */)) {
            for (const channel of channels) {
                const prevMatch = beforeMap.get(channel);
                if (!prevMatch[1] /* keepGoing */) {
                    break;
                }

                const before = prevMatch[2] /* before */;
                const results = await this.fetchMatchingMessages(channel, before);

                for (const message of results[0] /* messages */) {
                    const level = Common.extractNumber(message.cleanContent);
                    if (!level) throw new Error("WTF");
                    if (Number(level) > Number(levelResult)) {
                        levelResult = level;
                    }
                    results[1] = false; /* keepGoing */
                }
                beforeMap.set(channel, results);
            }
        }

        return levelResult !== "0" ? levelResult : undefined;
    }

    private any(beforeMap: Map<Discord.Channel, MatchingMessagesTuple>,
                predicate: (match: MatchingMessagesTuple) => boolean) {
        for (const match of beforeMap.values()) {
            if (predicate(match)) {
                return true;
            }
        }
        return false;
    }
    
    private getGuildTextChannels() {
        const channels = this.member.guild.channels.filter(ch => ch.type == "text");
        return channels.map(ch => <TextChannel>ch);
    }
    
    private async fetchMatchingMessages(channel: Discord.TextChannel, before: string): Promise<MatchingMessagesTuple> {
        const messages = await channel.fetchMessages({
            limit: Common.searchPageSize,
            before,
        });

        const keepGoing = messages.size > 0;
        const newBefore = keepGoing && this.oldest(messages.array()).id;

        return [
            messages.filter(this.messageFilter).map(m => m),
            keepGoing,
            newBefore
        ];
    }
    
    private messageFilter = (msg: Discord.Message) =>
        msg.author.id === this.ctx.mee6UserID &&
        msg.mentions.members.size > 0 &&
        msg.mentions.members.first().id === this.member.id &&
        msg.cleanContent.indexOf(this.searchTerm) !== -1;

    private oldest(msgs: Discord.Message[]) {
        return msgs.reduce((acc, val) => {
            if (!acc) return val;
            if (val.createdTimestamp < acc.createdTimestamp) return val;
            return acc;
        });
    }
}
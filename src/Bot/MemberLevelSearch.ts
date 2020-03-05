import Discord, { TextChannel } from "discord.js";

import { logger } from "../Logger";

import { BotContext } from ".";


// [ matchedMessages, shouldSearchMore, oldestMessageID ]
type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

export class MemberLevelSearch {
    private static readonly pageSize = 100;
    private static readonly numberRegex = /([\d])+/;

    constructor(
        private ctx: BotContext,
        private member: Discord.GuildMember,
        private searchTerm: string,
    ) {}

    async doSearch(): Promise<string> {
        logger.info(`Starting deep search for level of userID: ${this.member.user.id}`);

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
                    const level = MemberLevelSearch.numberRegex.exec(message.cleanContent)[0];
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
            limit: MemberLevelSearch.pageSize,
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
        msg.author.id == this.ctx.mee6UserID &&
        msg.cleanContent.indexOf(this.searchTerm) != -1;

    private oldest(msgs: Discord.Message[]) {
        return msgs.reduce((acc, val) => {
            if (!acc) return val;
            if (val.createdTimestamp < acc.createdTimestamp) return val;
            return acc;
        });
    }
}
import Discord, { TextChannel } from "discord.js";

import { BotContext } from ".";
import { Common } from "../Common";
import { logger } from "../Logger";
import { MonitoringService } from "../Services/MonitoringService";
import { OnComplete } from "./OnComplete";


//                        [ matchedMessages, shouldSearchMore, oldestMessageID ]
type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

/**
 * @deprecated A combination of FullScan and Realtime Listening is now used to maintain Member Levels.
 * This is planned removed after production launch and stabilization of those two features.
 */
export class MemberLevelSearch extends OnComplete {
    constructor(
        private ctx: BotContext,
        private msg: Discord.Message,
        private member: Discord.GuildMember,
        private searchTerm: string,
    ) {
        super();
    }

    private progress = {
        total: 0,
        done: 0,
        calc: () => `${this.progress.done}/${this.progress.total} (${ Math.floor(100 * this.progress.done / this.progress.total)}%)`,
    };

    async doSearch(cancellationToken: { cancelled: boolean }): Promise<string> {
        logger.info(`Starting deep search for level of userID: ${this.member.id}`);
        const service = MonitoringService.createService(this.msg, MemberLevelSearch.name, this.progress.calc);

        try {
            const level = await this.doSearchInternal(cancellationToken);
            service.finished();
            this.completed(true);
            return level;
        }
        catch (err) {
            if (err instanceof Error) {
                service.finished(err.message);
            }
            this.completed(false);
            throw err;
        }
    }

    private async doSearchInternal(cancellationToken: { cancelled: boolean }): Promise<string> {
        const channels = this.getGuildTextChannels();
        const beforeMap = new Map<Discord.Channel, MatchingMessagesTuple>(channels.map(ch => [ch, [undefined, true, undefined]]));

        let levelResult = "0";
        while (levelResult === "0" && this.any(beforeMap, m => m[1] /* keepGoing */)) {
            if (cancellationToken.cancelled) break;
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
        const channels = this.member.guild.channels.cache.filter(ch => ch.type == "text");
        return channels.map(ch => <TextChannel>ch);
    }
    
    private async fetchMatchingMessages(channel: Discord.TextChannel, before: string): Promise<MatchingMessagesTuple> {
        const messages = await channel.messages.fetch({
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
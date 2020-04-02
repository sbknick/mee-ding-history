import Discord, { TextChannel, Message, Channel } from "discord.js";

import { logger } from "../Logger";
import { MonitoringService } from "../Services/MonitoringService";
import { Common } from "../Common";
import { TermHandler, LevelHandler } from "../MessageHandlers";
import { DingRepository } from "../Repositories/DingRepository";
import { Fetch } from "../DiscordUtil";


//                        [ matchedMessages, shouldSearchMore, oldestMessageID ]
// type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

export class FullScan {
    private storedLevels = new Map<[Discord.Snowflake, Discord.Snowflake], number>();
    private dingMisses: string[] = [];

    constructor(
        private bot: Discord.Client,
        private mee6: Discord.User,
    ) {
    }

    private progress = {
        done: 0,
        calc: () => this.progress.done.toString(),
    };

    async doScan() {
        logger.info(`Starting full scan of guilds.`);
        const service = MonitoringService.createService(undefined, FullScan.name, this.progress.calc);

        try {
            await this.doScanInternal();
            service.finished();
            logger.info(`Full scan of guilds completed.`);
        }
        catch (err) {
            service.finished(err.message || err);
            logger.info(`Full scan of guilds errored.`);
            throw err;
        }
        finally {
            for (const str of this.dingMisses) {
                logger.info(str);
            }
        }
    }

    private async doScanInternal() {
        await this.forEachAsync(this.bot.guilds.array(), async guild => {
            logger.info(`Scanning guild: ` + guild.name);
            const guildSearchTerm = TermHandler.getTermForGuild(guild);
            const channels = guild.channels.filter(ch => ch.type === "text" && ch.permissionsFor(this.bot.user).has("READ_MESSAGE_HISTORY")).array();

            for (const channel of channels) {
                await this.scanChannel(<TextChannel>channel, guildSearchTerm);
            }
        });
    }

    private async scanChannel(channel: Discord.TextChannel, searchTerm: string) {
        let messages: Discord.Collection<string, Discord.Message>;
        let before: Discord.Snowflake;

        logger.info(`Scanning channel: ${channel.guild.name}/${channel.name}`);
        do {
            try {
                messages = await channel.fetchMessages({
                    limit: Common.searchPageSize,
                    before
                });
            }
            catch (err) {
                logger.error(err.message);
                throw err;
            }

            await this.scanMessages(messages.filter(this.messageFilter(searchTerm)).array());

            this.progress.done += messages.size;
            if (messages.size > 0)
                before = messages.last().id;
        }
        while(messages.size === Common.searchPageSize);
    }

    private messageFilter = (searchTerm: string) =>
        (m: Discord.Message) =>
            m.author.id === this.mee6.id &&
            Common.contains(m.cleanContent, searchTerm) &&
            m.mentions.members.size > 0;

    private async scanMessages(messages: Discord.Message[]) {
        for (const message of messages) {
            const level = Common.extractLevel(message);
            this.testStoredLevel(message, level);
            const prev = await this.fetchDingMessage(<TextChannel>message.channel, message.mentions.members.first(), message.id);

            if (prev)
                DingRepository.add({
                    userID: prev.author.id,
                    channelID: prev.channel.id,
                    guildID: prev.guild.id,
                    level,
                    messageID: prev.id,
                });
            else {
                const str = `ding found for ${message.mentions.members.first().displayName} level ${level}, but failed to find the associated message :: ${message.url}`;
                logger.error(str)
                this.dingMisses.push(str);
            }
        }
    }

    private fetchDingMessage = Fetch.firstBefore;

    private async testStoredLevel(message: Discord.Message, level: string): Promise<void> {
        const levelNum = Number.parseInt(level);
        const member = message.mentions.members.first();

        const storedLevel = await this.getStoredLevel(member);

        if (!storedLevel || storedLevel < levelNum) {
            await this.setStoredLevel(member, levelNum);
        }
    }

    private async getStoredLevel(member: Discord.GuildMember): Promise<number> {
        let storedLevel = this.storedLevels.get(this.key(member));
        if (storedLevel) return storedLevel;

        const persistedLevel = await LevelHandler.get(member);
        if (persistedLevel) {
            const levelNum = Number.parseInt(persistedLevel.level);
            this.storedLevels.set(this.key(member), levelNum);
            return levelNum;
        }
    }

    private async setStoredLevel(member: Discord.GuildMember, level: number) {
        LevelHandler.add(member, level.toString());
        this.storedLevels.set(this.key(member), level);
    }

    private key(member: Discord.GuildMember): [Discord.Snowflake, Discord.Snowflake] { return [member.guild.id, member.id]; }

    private async forEachAsync<T, V>(items: T[], asyncFunc: (item: T) => Promise<V>) {
        const promises: Promise<V>[] = [];

        for (const item of items) {
            promises.push(asyncFunc(item));
        }

        return Promise.all(promises);
    }
}
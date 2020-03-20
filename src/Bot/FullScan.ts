import Discord, { TextChannel, Message, Channel } from "discord.js";

import { logger } from "../Logger";
import { MonitoringService } from "../Services/MonitoringService";
import { Common } from "../Common";
import { TermHandler } from "../MessageHandlers";
import { DingRepository } from "../Repositories/DingRepository";


//                        [ matchedMessages, shouldSearchMore, oldestMessageID ]
type MatchingMessagesTuple = [Discord.Message[], boolean, Discord.Snowflake];

export class FullScan {

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
            if (err instanceof Error) {
                service.finished(err.message);
                logger.info(`Full scan of guilds errored.`);
            }
            throw err;
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
            const level = Common.extractNumber(message.cleanContent);
            const prev = await this.fetchDingMessage(<TextChannel>message.channel, message.id, message.mentions.members.first().id);

            // if (message.mentions.members.first().id !== prev.author.id) throw new Error("message author mismatch");

            DingRepository.add({
                userID: prev.author.id,
                channelID: prev.channel.id,
                guildID: prev.guild.id,
                level,
                messageID: prev.id,
            });
        }
    }

    private async fetchDingMessage(channel: Discord.TextChannel, before: Discord.Snowflake, authorID: Discord.Snowflake) {
        const messages = await channel.fetchMessages({
            limit: 10,
            before
        });
        return messages.find(m => m.author.id === authorID);
    }

    private async forEachAsync<T, V>(items: T[], asyncFunc: (item: T) => Promise<V>) {
        const promises: Promise<V>[] = [];

        for (const item of items) {
            promises.push(asyncFunc(item));
        }

        return Promise.all(promises);
    }
}
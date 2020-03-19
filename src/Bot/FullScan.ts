import Discord, { TextChannel } from "discord.js";

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
        logger.info(`Starting full scan of guilds`);
        const service = MonitoringService.createService(undefined, FullScan.name, this.progress.calc);

        try {
            await this.doScanInternal();
            service.finished();
        }
        catch (err) {
            if (err instanceof Error) {
                service.finished(err.message);
            }
            throw err;
        }
    }

    private async doScanInternal() {
        await this.forEachAsync(this.bot.guilds.array(), async guild => {
            const guildSearchTerm = TermHandler.getTermForGuild(guild);
            const channels = guild.channels.filterArray(ch => ch.type === "text" && ch.permissionsFor(this.bot.user).hasPermission("READ_MESSAGE_HISTORY"));

            for (const channel of channels) {
                await this.scanChannel(<TextChannel>channel, guildSearchTerm);
            }
        });
    }

    private async scanChannel(channel: Discord.TextChannel, searchTerm: string) {
        let messages: Discord.Message[];
        let before: Discord.Snowflake;
        do {
            messages = (await channel.fetchMessages({
                limit: Common.searchPageSize,
                before
            })).array();

            await this.scanMessages(messages.filter(this.messageFilter(searchTerm)));
        }
        while(messages.length === Common.searchPageSize);
    }

    private messageFilter = (searchTerm: string) =>
        (m: Discord.Message) =>
            m.author.id === this.mee6.id &&
            Common.contains(m.cleanContent, searchTerm) &&
            m.mentions.members.size > 0;

    private async scanMessages(messages: Discord.Message[]) {
        for (const message of messages) {
            const level = Common.extractNumber(message.cleanContent);
            const prev = (await message.channel.fetchMessages({
                limit: 1,
                before: message.id
            })).first();

            if (message.mentions.members.first().id !== prev.id) throw new Error();

            DingRepository.add({
                userID: prev.author.id,
                channelID: prev.channel.id,
                guildID: prev.guild.id,
                level,
                messageID: prev.id,
            });
        }
    }

    private async forEachAsync<T, V>(items: T[], asyncFunc: (item: T) => Promise<V>) {
        const promises: Promise<V>[] = [];

        for (const item of items) {
            promises.push(asyncFunc(item));
        }

        return Promise.all(promises);
    }
}
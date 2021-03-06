import Discord, { TextChannel } from "discord.js";

import { BotContext } from "../Bot";
import { MessageHandler } from "../Models/Message";
import { Common } from "../Common";
import { Fetch } from "../DiscordUtil";
import { DingRepository } from "../Repositories/DingRepository";
import { logger } from "../Logger";


export class MemoryHandler {
    public constructor (
        private ctx: BotContext
    ) {}

    public commit: MessageHandler = async msg => {
        const term = this.ctx.termHandler.getTerm();
        if (!Common.contains(msg.message, term)) return;

        const member = msg.source.mentions.members.first();
        const level = Common.extractLevel(msg.source);

        if (!member) {
            const user = msg.source.mentions.users.first();
            logger.error(`No member found for user ${user.username}... Received message was "${msg.message}"`);
            return;
        }

        this.ctx.levelHandler.add(member, level);
        const dingMessage = await this.getDingMessage(msg.source, member);
        DingRepository.add({
            userID: member.id,
            guildID: msg.source.guild.id,
            channelID: msg.channelID,
            messageID: dingMessage.id,
            level
        });
    }

    private getDingMessage(msg: Discord.Message, member: Discord.GuildMember) {
        return Fetch.firstBefore(<TextChannel>msg.channel, member, msg.id);
    }
}
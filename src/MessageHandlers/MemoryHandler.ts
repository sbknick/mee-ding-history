import Discord, { TextChannel } from "discord.js";

import { BotContext } from "../Bot";
import { Convert } from "../Convert";
import { Memory } from "../Models/Memory";
import { MessageHandler } from "../Models/Message";
import { Common } from "../Common";
import { Fetch } from "../DiscordUtil";
import { DingRepository } from "../Repositories/DingRepository";
import { logger } from "../Logger";


export class MemoryHandler {
    // key: userID
    private lastMessageMap: Map<string, Memory> = new Map<string, Memory>();

    public constructor (
        private ctx: BotContext
    ) {}

    // public remember: MessageHandler = msg => {
    //     this.lastMessageMap.set(msg.userID, Convert.ToMemory(msg));
    // }

    public commit: MessageHandler = async msg => {
        const term = this.ctx.termHandler.getTerm();
        if (!Common.contains(msg.message, term)) return;

        const member = msg.source.mentions.members.first();
        const level = Common.extractLevel(msg.source);

        this.ctx.levelHandler.add(member, level);
        const dingMessage = await this.getDingMessage(msg.source, member);
        DingRepository.add({
            userID: member.id,
            guildID: msg.source.guild.id,
            channelID: msg.channelID,
            messageID: dingMessage.id,
            level
        });

        logger.info(`realtime memory!:: ${member.displayName} - L${level} - ${dingMessage.cleanContent}`);
    }

    private getDingMessage(msg: Discord.Message, member: Discord.GuildMember) {
        return Fetch.firstBefore(<TextChannel>msg.channel, member, msg.id);
    }
}
import Discord from "discord.js";
import { LevelRepository } from "../Repositories/LevelRepository";


export class LevelHandler {
    add(member: Discord.GuildMember, level: string) {
        return LevelHandler.add(member, level);
    }

    get(member: Discord.GuildMember) {
        return LevelHandler.get(member);
    }

    static add(member: Discord.GuildMember, level: string) {
        return LevelRepository.add({
            guildID: member.guild.id,
            userID: member.id,
            level
        });
    }

    static get(member: Discord.GuildMember) {
        return LevelRepository.get(member.guild.id, member.id);
    }

}
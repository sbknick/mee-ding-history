import Discord from "discord.js";

import { BotContext } from "../Bot";
import { Common } from "../Common";


export class TermHandler {
    private static termMap = new Map<Discord.Guild, string>();
    private static defaultTerm = "GG"; // "Gratz!";

    constructor(
        private ctx: BotContext
    ) {}

    getTerm(): string {
        return TermHandler.getTermForGuild(this.ctx.member.guild);
    }

    setTerm(term: string): void {
        TermHandler.termMap.set(this.ctx.member.guild, term);
    }

    static getTermForGuild(guild: Discord.Guild): string {
        if (Common.contains(guild.name, "Blair")) return "GG";
        else return "Gratz!";

        const term = TermHandler.termMap.get(guild);
        return term || TermHandler.defaultTerm;
    }
}
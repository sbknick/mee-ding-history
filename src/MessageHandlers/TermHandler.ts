import Discord from "discord.js";

import { BotContext } from "../Bot";


export class TermHandler {
    private static termMap = new Map<Discord.Guild, string>();
    private static defaultTerm = "Gratz!"; // "GG";

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
        const term = TermHandler.termMap.get(guild);
        return term || TermHandler.defaultTerm;
    }
}
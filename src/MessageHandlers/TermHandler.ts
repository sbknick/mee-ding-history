import Discord from "discord.js";

import { BotContext } from "../Bot";


export class TermHandler {
    private static termMap = new Map<Discord.Guild, string>();
    private static defaultTerm = "GG";

    constructor(
        private ctx: BotContext
    ) {}

    getTerm() {
        const term = TermHandler.termMap.get(this.ctx.member.guild);
        return term || TermHandler.defaultTerm;
    }

    setTerm(term: string) {
        TermHandler.termMap.set(this.ctx.member.guild, term);
    }
}
import { BotContext } from "../Bot";

import { Message } from "../Models/Message";
import { ValidCmds } from "../Models/ValidCmds";


export class HelpHandler {
    private static readonly CMDS = [
        ["!ding help", "Shows this message"],
        ["!ding me <level>", "Quotes the line that you dinged on for a particular level. If no level is supplied, it will assume your current level."],
        ["!ding user @name <level>", "Quotes the line that the mentioned user dinged on for a particular level. If no level is supplied, it will assume their current level."],
    ];

    private static readonly MANAGER_CMDS = [
        ["!ding term <term>", "Get or set the search term so I know which MEE6 messages are the right ones to look at. Defaults to \"GG\""],
    ];

    constructor (
        private ctx: BotContext
    ) {}

    help() {
        const output = this.helpText();
        this.ctx.send.cleanReply(output.join("\n"));
    }

    unknownInput(msg: Message) {
        const output: string[] = [
            "Unknown input: " + msg.message,
            ,
            ...this.helpText()
        ];

        this.ctx.send.cleanReply(output.join("\n"));
    }

    error(msg: Message, args: string[]) {
        const cmd = <ValidCmds>args[0];

        const output: string[] = [ `Unexpected input: "${msg.message}"` ];
        
        switch (cmd) {
            case "me":
            case "user":
                output.push()
                output.push(`Expected input in the form of "!ding (me/user @mention) <level>`, "");
                break;
        }

        this.ctx.send.reply(output.join("\n"));
    }

    levelError() {
        const output: string[] = [
            "Level not found for user. Is your search term set correctly?"
        ];

        this.ctx.send.reply(output.join("\n"));
    }

    unauthorized() {
        this.ctx.send.reply("You don't have permission to do that...")
    }

    private helpText(): string[] {
        const output: string[] = [
            `Commands must be in the form of "!ding <command> <args...>"`,
            ,
            "Valid commands are:",
            ...this.listHelpCommands()
        ];

        if (this.ctx.member.permissions.has("MANAGE_GUILD", true)) {
            output.push(
                undefined,
                "Commands for Managers:",
                ...this.listHelpCommands(true))
        }

        return output;
    }

    private listHelpCommands(authorized: boolean = false): string[] {
        const map = (cmds: string[][]) =>
            cmds.map(c => `\n**${c[0]}**\n    _${c[1]}_`);

        return map(authorized ? HelpHandler.MANAGER_CMDS : HelpHandler.CMDS);
    }
}
import { BotContext } from "../Bot";

import { Message } from "../Models/Message";
import { ValidCmds } from "../Models/ValidCmds";


export class HelpHandler {
    private static readonly CMDS = [
        ["!ding help", "Shows this message"],
        ["!ding me <level>", "Quotes the line that you dinged on for a particular level. If no level is supplied, it will assume your current level."],
        ["!ding user @name <level>", "Quotes the line that the mentioned user dinged on for a particular level. If no level is supplied, it will assume their current level."],
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
            "",
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

    private helpText(): string[] {
        return [
            `Commands must be in the form of "!ding <command> <args...>"`,
            "",
            "Valid commands are:",
            ...this.listHelpCommands()
        ];
    }

    private listHelpCommands(): string[] {
        return HelpHandler.CMDS.map(c => c[0].padEnd(20) + ": " + c[1]);
    }
}
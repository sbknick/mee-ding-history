import { BotContext } from "../Bot";
import { Message } from "../Models/Message";


export class HelpHandler {
    private static readonly CMDS = [
        ["!ding help", "Shows this message"],
        ["!ding me", "!ding me <level> : This will quote the line that you dinged on for a particular level. If no level is supplied, it will assume your current level."],
        ["!ding me", "!ding user <level> : This will quote the line that you dinged on for a particular level. If no level is supplied, it will assume your current level."],
    ];

    public constructor (
        private ctx: BotContext
    ) {}

    public help() {
        this.ctx.dm("help str");
    }

    public unknownInput(msg: Message) {
        let output: string[] = [
            "Unknown input: " + msg.message,
            "",
            "Commands must be in the form of \"!ding <command> <args...>",
            "Valid commands are:",
            ...this.listHelpCommands()
        ];

        this.ctx.dm(output.join("\n"));
    }

    public error(cmd: string) {

    }

    private listHelpCommands(): string[] {
        let lines = HelpHandler.CMDS.map(c => c[0].padEnd(20) + ": " + c[1]);
        return lines;
    }
}
import { Bot } from "../Bot";
import { Message } from "../Models/Message";


class HelpHandler {
    private cmds = [
        ["!ding help", "Shows this message"],
        ["!ding me", "!ding me <level> : This will quote the line that you dinged on for a particular level. If no level is supplied, it will assume your current level."],
    ];

    public constructor (
        private bot: Bot
    ) {}

    public help() {
        this.bot.dm("help str");
    }

    public unknownInput(msg: Message) {
        let output: string[] = [
            "Unknown input: " + msg.message,
            "",
            "Commands must be in the form of \"!ding <command> <args...>",
            "Valid commands are:",
            ...this.listHelpCommands()
        ];

        this.bot.dm(output.join("\n"));
    }

    public error(cmd: string) {

    }

    private listHelpCommands(): string[] {
        let lines = this.cmds.map(c => c[0].padEnd(20) + ": " + c[1]);
        return lines;
    }
}

export default HelpHandler;

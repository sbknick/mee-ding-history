import IHandler from "./IHandler";
import Bot from "../Bot";

class HelpHandler implements IHandler {
    private cmds = [
        ["!ding help", "Shows this message"],
        ["!ding me", "!ding me <level> : This will quote the line that you dinged on for a particular level. If no level is supplied, it will assume your current level."],
    ];

    public constructor (
        private bot: Bot
    ) {}

    handle: msgCallback = m => {};

    public help(msg: message) {

        this.bot.dm(msg, "str");
        // msg.dm()
    }

    public unknownInput(msg: message) {
        // this.bot.directMessages;
        // this.bot.getMessage({
        //     channelID, messageID
        // })
        let output: string[] = [
            "Unknown input: " + msg.message,
            "",
            "Commands must be in the form of \"!ding <command> <args...>",
            "Valid commands are:",
            ...this.listHelpCommands()
        ];

        this.bot.dm(msg, output.join("\n"));
    }

    public error(cmd: string) {

    }

    private listHelpCommands(): string[] {
        let lines = this.cmds.map(c => c[0].padEnd(20) + ": " + c[1]);
        return lines;
    }
}

export default HelpHandler;

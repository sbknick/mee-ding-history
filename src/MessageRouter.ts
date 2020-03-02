import { Bot } from "./Bot";
import HelpHandler from "./MessageHandlers/HelpHandler";
import MemoryHandler from "./MessageHandlers/MemoryHandler";
import { Message } from "./Models/Message";


interface Router { route: (message: Message) => void };

class MessageRouter implements Router {
    private helpHandler: HelpHandler;
    private memoryHandler: MemoryHandler;

    public constructor (
        private bot: Bot
    ) {
        this.helpHandler = new HelpHandler(bot);
        this.memoryHandler = new MemoryHandler(bot);
    }

    public route = (msg: Message) => {
        if (msg.userID == this.bot.userID()) {
            return;
        }

        try {
            // Our bot needs to know if it will execute a command
            // It will listen for messages that will start with `!`
            if (msg.message.substring(0, 1) == '!') {
                var args = msg.message.slice(1).trim().split(/ +/g);
                var cmd = args[0];
            
                args = args.splice(1);
                switch (cmd) {
                    // !ping
                case "ping":
                    this.bot.reply(msg, "Pong!");
                    break;

                case "repeat":
                    this.memoryHandler.repeat(msg);
                    break;

                    // !ding
                case "ding":
                    if (args.length == 0 || args[0] == "help")
                        return this.helpHandler.help(msg);

                    switch (args[0]) {
                        case "me":
                            return this.bot.reply(msg, "I can't remember... Sorry!");

                        case "self":
                            return this.bot.reply(msg, "I can't remember... Sorry!");

                        default:
                            return this.helpHandler.unknownInput(msg);
                    }
                }
            }
        }
        finally {
            this.memoryHandler.handle(msg);
        }
    }
}

export default MessageRouter;
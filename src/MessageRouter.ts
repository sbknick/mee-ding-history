import logger from "winston";

import HelpHandler from "./MessageHandlers/HelpHandler";
import MemoryHandler from "./MessageHandlers/MemoryHandler";
import Bot from "./Bot";

type routeDelegate = (msg: message) => void;
type Router = { route: messageCallback };

class MessageRouter implements Router {
    private helpHandler: HelpHandler;
    private memoryHandler: MemoryHandler;

    public constructor (
        private bot: Bot
    ) {
        this.helpHandler = new HelpHandler(bot);
        this.memoryHandler = new MemoryHandler(bot);
    }

    private XForm = (del: routeDelegate) => (user: string, userID: string, channelID: string, message: string, event: WebSocketEvent): void => {
        del({user, userID, channelID, message, event});
    }

    private doRoute: (msg: message) => void = msg => {
        if (msg.userID == this.bot.userID()) {
            logger.info("Received my own message: ", msg);
            return;
        }

        try {
            // Our bot needs to know if it will execute a command
            // It will listen for messages that will start with `!`
            if (msg.message.substring(0, 1) == '!') {
                var args = msg.message.substring(1).split(' ');
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

    public route: messageCallback = this.XForm(this.doRoute);
}

export default MessageRouter;

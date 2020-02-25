import Discord = require("discord.io");

class MessageRouter {
    public constructor (
        private bot: Discord.Client
    ) {}

    public route: messageCallback =
    (user: string, userID: string, channelID: string, message: string, event: WebSocketEvent) => {
        
        // Our bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.substring(0, 1) == '!') {
            var args = message.substring(1).split(' ');
            var cmd = args[0];
        
            args = args.splice(1);
            switch(cmd) {
                // !ping
                case "ping":
                    this.bot.sendMessage({
                        to: channelID,
                        message: "Pong!"
                    });
                    break;

                // Just add any case commands if you want to..

                // !ding
                case "ding":
                    this.bot.sendMessage({
                        to: channelID,
                        message: 'Dong!'
                    });
                    this.bot.sendMessage({
                        to: userID,
                        message: 'You ding!'
                    });
                    break;
            }
        }
    }
}

export default MessageRouter;

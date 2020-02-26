import Discord from "discord.io";
import logger from "winston";

class Bot {
    constructor(
        private bot: Discord.Client
    ) {
        this.bot.on("ready", evt => {
            logger.info("Connected");
            logger.info("Logged in as: ");
            logger.info(this.bot.username + " - (" + this.bot.id + ")");
        });
    }

    public reply = (msg: message, response: string) =>
        this.bot.sendMessage({
            to: msg.channelID,
            message: response
        });

    public dm = (msg: message, response: string) =>
        this.bot.sendMessage({
            to: msg.userID,
            message: response
        });
}

export default Bot;
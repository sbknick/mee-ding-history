import IHandler from "./IHandler";
import Bot from "../Bot";

interface memory {
    userID: string,
    channelID: string,
    messageID: string
}

class MemoryHandler implements IHandler {
    // key: userID
    private lastMessageMap: Map<string, memory> = new Map<string, memory>();

    public constructor (
        private bot: Bot
    ) {}

    public handle: msgCallback = msg => {
        const { user, userID, channelID, message, event } = msg;

        this.lastMessageMap.set(userID, {
            userID, channelID, messageID: event.d.id
        });
        // this.bot.reply(msg, `user: ${user} userID: ${userID} channelID: ${channelID} message: ${message}`);
    }

    public repeat: msgCallback = msg => {
        const m = this.lastMessageMap.get(msg.userID);
        this.bot.retrieveMessage(m.messageID);
        this.bot.reply(msg, `Your last message is\n> userID: ${m.userID} channelID: ${m.channelID} messageID: ${m.messageID}`);


        // const { user, userID, channelID, message } = msg;
        // this.bot.reply(msg, "I have no memory yet!");
    }
}

export default MemoryHandler

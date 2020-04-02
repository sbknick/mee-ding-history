import Discord from "discord.js";

const mentionRegex = /(<@!\d+>)/
const searchNumberRegex = /([\d])+/;

function exciseMention(input: string) { return input.replace(mentionRegex, ""); }

export const Common = {
    searchPageSize: 100,
    memoryThreshold: 1000 * 60 * 10, // 10 minutes
    
    extractNumber: (input: string) => searchNumberRegex.exec(input)[0],
    extractLevel: (msg: Discord.Message) => Common.extractNumber(exciseMention(msg.content)),
    contains: (input: string, searchTerm: string) => input.indexOf(searchTerm) !== -1,

    isDeveloper: (userID: string) => userID === process.env.DEVELOPER_USERID,
}
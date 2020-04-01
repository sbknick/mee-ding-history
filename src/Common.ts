
const searchNumberRegex = /([\d])+/;

export const Common = {
    searchPageSize: 100,
    memoryThreshold: 1000 * 60 * 10, // 10 minutes
    
    extractNumber: (input: string) => searchNumberRegex.exec(input)[0],
    contains: (input: string, searchTerm: string) => input.indexOf(searchTerm) !== -1,

    isDeveloper: (userID: string) => userID === process.env.DEVELOPER_USERID,
}
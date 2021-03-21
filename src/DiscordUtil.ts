import Discord from "discord.js";


async function firstBefore(channel: Discord.TextChannel, member: Discord.GuildMember, before: Discord.Snowflake) {
    const messages = await channel.messages.fetch({
        limit: 10,
        before
    });
    return messages.find(m => m.author.id === member.id);
}

export const Fetch = {
    firstBefore,
};
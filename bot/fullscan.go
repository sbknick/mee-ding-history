package bot

import (
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
)

var (
	storedLevels map[userGuildKey]int
	dingMisses   []string

	progress struct {
		done bool
		calc func() string
	}

	myID string
)

func prep(session *discordgo.Session) error {
	user, err := session.User("@me")
	if err != nil {
		return err
	}

	myID = user.ID
	return nil
}

type userGuildKey struct{ userId, guildId string }

func scanGuilds(session *discordgo.Session, after string) error {
	guilds, err := session.UserGuilds(100, "", after)
	if err != nil {
		return fmt.Errorf("guild fetch failed.\n%v", err)
	}

	for _, guild := range guilds {
		fmt.Println("Scanning guild", guild.Name)
		guildSearchTerm := "GG" // TODO: term service lookup

		scanChannels(session, guild, guildSearchTerm, "")
	}

	if len(guilds) == 100 {
		scanGuilds(session, guilds[99].ID)
	}

	return nil
}

func scanChannels(session *discordgo.Session, guild *discordgo.UserGuild, searchTerm string, after string) error {
	channels, err := session.GuildChannels(guild.ID)
	if err != nil {
		return fmt.Errorf("channel fetch failed for guild: %s\n%v", guild.Name, err)
	}

	for _, channel := range channels {
		if channel.Type != discordgo.ChannelTypeGuildText {
			continue
		}

		p, err := session.UserChannelPermissions(myID, channel.ID)
		if err != nil {
			return fmt.Errorf("failed to fetch permissions for channel: %s\n%v", channel.Name, err)
		}

		if p&discordgo.PermissionReadMessageHistory != 0 {
			fmt.Println("Initiating channel scan:", channel.Name)
		}
	}

	return nil
}

// FullScan initiates a full, deep scan of all guilds and all accessible text channels.
func FullScan(session *discordgo.Session, mee6 *discordgo.User) error {
	fmt.Println("Starting full scan of guilds.")
	if err := prep(session); err != nil {
		return err
	}
	// TODO: inform monitoring service of task start

	return scanGuilds(session, "")

	guilds, err := session.UserGuilds(100, "", "")
	if err != nil {
		return fmt.Errorf("Guild fetch failed.\n%v", err)
	}

	for _, guild := range guilds {
		fmt.Println("Scanning guild", guild.Name)
		guildSearchTerm := "GG" // TODO: term service lookup

		channels, err := session.GuildChannels(guild.ID)
		if err != nil {
			return fmt.Errorf("Channel fetch failed.\n%v", err)
		}

		for _, channel := range channels {
			fmt.Println(" Scanning channel", channel.Name)
			if channel.Type != discordgo.ChannelTypeGuildText {
				continue
			}

			if perms, err := session.State.UserChannelPermissions(session.State.User.ID, channel.ID); err != nil {
				log.Println("Error:", err)
				continue
			} else if perms&discordgo.PermissionReadMessageHistory == 0 {
				continue
			}
			// else {
			// 	log.Println("   Permissions:", perms, perms&discordgo.PermissionReadMessageHistory)
			// }

			scanChannel(channel, guildSearchTerm)
		}
	}

	return nil
}

func scanChannel(channel *discordgo.Channel, searchTerm string) {
	fmt.Println("  Scanning channel", channel.Name)
}

// var queuedRequests chan string = make(chan string, 40)

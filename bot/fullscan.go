package bot

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/sbknick/mee-ding-history/data"
)

const searchPageSize = 100

var (
	// bot          *Bot
	storedLevels map[userGuildKey]int
	dingMisses   []string

	progress struct {
		done bool
		calc func() string
	}

	taskQueue chan scanTask
)

type userGuildKey struct{ userId, guildId string }

// FullScan initiates a full, deep scan of all guilds and all accessible text channels.
func (bot *Bot) FullScan() error {
	fmt.Println("Starting full scan of guilds.")
	// TODO: inform monitoring service of task start

	taskQueue = make(chan scanTask, 200)

	go processHistory(bot)

	return scanGuilds(bot, "")
}

func scanGuilds(bot *Bot, after string) error {
	guilds, err := bot.session.UserGuilds(searchPageSize, "", after)
	if err != nil {
		return fmt.Errorf("guild fetch failed.\n%v", err)
	}

	for _, guild := range guilds {
		if guild.Name == "Spectre Creations" {
			continue
		}

		fmt.Println("Scanning guild", guild.Name)
		guildSearchTerm := "GG" // BTS
		// guildSearchTerm := "Gratz!" // Spectre
		// TODO: term service lookup

		scanChannels(bot, guild, guildSearchTerm, "")
	}

	if len(guilds) == searchPageSize {
		scanGuilds(bot, guilds[searchPageSize-1].ID)
	}

	return nil
}

func scanChannels(bot *Bot, guild *discordgo.UserGuild, searchTerm string, after string) error {
	channels, err := bot.session.GuildChannels(guild.ID)
	if err != nil {
		return fmt.Errorf("channel fetch failed for guild: %s\n%v", guild.Name, err)
	}

	for _, channel := range channels {
		if channel.Type != discordgo.ChannelTypeGuildText {
			continue
		}

		p, err := bot.session.UserChannelPermissions(bot.myID, channel.ID)
		if err != nil {
			return fmt.Errorf("failed to fetch permissions for channel: %s\n%v", channel.Name, err)
		}

		if p&discordgo.PermissionReadMessageHistory != 0 {
			fmt.Println("Initiating channel scan:", channel.Name)
			scanChannel(channel, searchTerm)
		}
	}

	return nil
}

func scanChannel(channel *discordgo.Channel, searchTerm string) {
	taskQueue <- scanTask{channel: channel}
}

type scanTask struct {
	channel    *discordgo.Channel
	before     string
	searchTerm string
}

func processHistory(bot *Bot) {
	for task := range taskQueue {
		before := ""
		if task.before != "" {
			before = "After: " + task.before
		}
		fmt.Println(" - Starting Task:", task.channel.Name, before)

		messages, _ := bot.session.ChannelMessages(task.channel.ID, searchPageSize, task.before, "", "")

		for i, m := range messages {
			if i < searchPageSize-1 &&
				m.Author.ID == bot.mee6.ID &&
				strings.Contains(m.ContentWithMentionsReplaced(), task.searchTerm) &&
				len(m.Mentions) > 0 {

				level := extractLevel(m.Content)
				data.Cache.MaxLevels.Update(m.Mentions[0].ID, task.channel.GuildID, level)

				dingMsg := messages[i+1]
				if dingMsg.Author.ID != m.Mentions[0].ID {
					// panic("dafuq")
					dingMisses = append(dingMisses, fmt.Sprintf("%s: %s", dingMsg.Author.Username, level))
					fmt.Println("ding missed:", dingMsg.Author.Username, level)
					// maybe ding miss, (deleted)
					// maybe chat race
				}

				d := data.Ding{
					UserID:  dingMsg.Author.ID,
					GuildID: task.channel.GuildID,
					Level:   level,

					MessageID: dingMsg.ID,
					ChannelID: dingMsg.ChannelID,

					Message: dingMsg,
				}
				data.Cache.Dings.Put(d)

				fmt.Println("Cached level", level, "ding for", dingMsg.Author.Username)
			}
		}

		if len(messages) == searchPageSize {
			task.before = messages[searchPageSize-2].ID
			taskQueue <- task
		}
	}
}

var (
	mentionRegex      *regexp.Regexp = regexp.MustCompile(`(<@!\d+>)|(<@\d+>)`)
	searchNumberRegex *regexp.Regexp = regexp.MustCompile(`([\d])+`)
)

func extractLevel(input string) string {
	return extractNumber(exciseMention(input))
}

func extractNumber(input string) string {
	return searchNumberRegex.FindString(input)
}

func exciseMention(input string) string {
	return mentionRegex.ReplaceAllString(input, "")
}
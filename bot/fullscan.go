package bot

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/bwmarrin/discordgo"

	"github.com/sbknick/mee-ding-history/data/dings"
	"github.com/sbknick/mee-ding-history/data/maxLevels"
	"github.com/sbknick/mee-ding-history/data/models"
	"github.com/sbknick/mee-ding-history/services"
)

const searchPageSize = 100

var (
	dingMisses []string

	// progress struct {
	// 	done bool
	// 	calc func() string
	// }

	taskQueue chan scanTask
)

// FullScan initiates a full, deep scan of all guilds and all accessible text channels.
func (bot *Bot) FullScan() error {

	// afterId := "854040298463297546"
	// channelId := "565222197199765504"
	// // guildId := "565201829877514240"

	// messages, err := bot.session.ChannelMessages(channelId, 5, "", afterId, "")
	// if err != nil {
	// 	return err
	// }

	// _ = messages

	// return nil

	if taskQueue != nil {
		return fmt.Errorf("full Scan already in progress")
	}

	fmt.Println("Starting full scan of guilds.")
	taskQueue = make(chan scanTask, 200)
	// TODO: inform monitoring service of task start

	go processHistory(bot)

	return scanGuilds(bot, "")
}

func scanGuilds(bot *Bot, after string) error {
	guilds, err := bot.session.UserGuilds(searchPageSize, "", after)
	if err != nil {
		return fmt.Errorf("guild fetch failed.\n%v", err)
	}

	for _, guild := range guilds {
		fmt.Println("Scanning guild", guild.Name)
		scanGuildChannels(bot, guild)
	}

	if len(guilds) == searchPageSize {
		scanGuilds(bot, guilds[searchPageSize-1].ID)
	}

	return nil
}

func scanGuildChannels(bot *Bot, guild *discordgo.UserGuild) error {
	channels, err := bot.session.GuildChannels(guild.ID)
	if err != nil {
		return fmt.Errorf("channel fetch failed for guild: %s\n%v", guild.Name, err)
	}

	searchTerm := services.SearchTerm.GetSearchTerm(guild.ID)
	progress, ok := services.ScanProgress.GetScanProgress(guild.ID)
	if !ok {
		progress = services.ProgressByChannel{}
	}
	// if pr == nil {
	// 	pr = &services.ProgressByChannel{}
	// }
	// progress := *pr

	for _, channel := range channels {
		if channel.ID != "565222197199765504" {
			continue
		}

		if channel.Type != discordgo.ChannelTypeGuildText {
			continue
		}

		p, err := bot.session.UserChannelPermissions(bot.myID, channel.ID)
		if err != nil {
			return fmt.Errorf("failed to fetch permissions for channel: %s\n%v", channel.Name, err)
		}

		if p&discordgo.PermissionReadMessageHistory != 0 {
			enqueueScanTasks(progress, channel, searchTerm)
		}
	}

	return nil
}

func enqueueScanTasks(progress services.ProgressByChannel, channel *discordgo.Channel, searchTerm string) {
	// fmt.Println("Initiating channel scan:", channel.Name)
	task := scanTask{channel: channel, searchTerm: searchTerm}
	pr, ok := progress[channel.ID]
	if ok {
		task.before = pr.Earliest
		// task.progress.Earliest = pr.Earliest
		taskQueue <- task
		task.before = ""
		task.after = pr.Latest
		// task.progress.Earliest = ""
		// task.progress.Latest = pr.Latest
		taskQueue <- task
		// task.before = pr.Latest
		// taskQueue <- task
		// task.before = ""
		// task.after = pr.Earliest
		// taskQueue <- task
	} else {
		taskQueue <- task
	}
}

// func scanChannel(channel *discordgo.Channel, searchTerm string) {
// 	taskQueue <- scanTask{channel: channel}
// }

type scanTask struct {
	channel *discordgo.Channel
	// before, after string
	before, after string
	// progress      services.Progress
	searchTerm string
}

func processHistory(bot *Bot) {
	defer func() {
		fmt.Println("Full Scan of guilds complete.")
		taskQueue = nil
	}()

	for task := range taskQueue {
		pastward := task.after == ""
		var messages []*discordgo.Message
		if pastward {
			messages, _ = bot.session.ChannelMessages(task.channel.ID, searchPageSize, task.before, "", "")
		} else {
			messages, _ = bot.session.ChannelMessages(task.channel.ID, searchPageSize, "", task.after, "")
			messages = reverse(messages)
		}

		// if !pastward {
		// 	messages = reverse(messages)
		// }

		if len(messages) == 0 {
			return
		}

		for i, m := range messages {
			if i < searchPageSize-1 &&
				m.Author.ID == bot.Mee6.ID &&
				strings.Contains(m.Content, task.searchTerm) &&
				len(m.Mentions) == 1 {

				level := extractLevel(m.Content)
				maxLevels.Update(m.Mentions[0].ID, task.channel.GuildID, level)

				var dingMsg *discordgo.Message
				if pastward {
					dingMsg = messages[i+1]
				} else { // futureward
					if i == 0 {
						continue
						// first message will always be an already-cached Mee6 ding notification
						// either that, or a non-ding message at the head of a channel
					}
					dingMsg = messages[i-1]
				}
				if dingMsg.Author.ID != m.Mentions[0].ID {
					dingMisses = append(dingMisses, fmt.Sprintf("%s: %s", dingMsg.Author.Username, level))
					// fmt.Println("ding missed:", dingMsg.Author.Username, level)
					// TODO:
					// maybe ding miss, (deleted)
					// maybe chat race
				}

				d := &models.Ding{
					UserID:  dingMsg.Author.ID,
					GuildID: task.channel.GuildID,
					Level:   level,

					MessageID: dingMsg.ID,
					ChannelID: dingMsg.ChannelID,

					Message: dingMsg,
				}
				dings.Put(d)

				if _, ok := services.UserNames.Get(d.UserID); !ok {
					var userName string
					if dingMsg.Member != nil {
						userName = dingMsg.Member.Nick
					}
					if userName == "" {
						userName = dingMsg.Author.Username
					}
					services.UserNames.Set(d.UserID, userName)
				}

				// fmt.Println("Cached level", level, "ding for", dingMsg.Author.Username)
			}
		}

		var high, low *discordgo.Message
		if pastward {
			high, low = messages[0], messages[len(messages)-1]
		} else {
			low, high = messages[0], messages[len(messages)-1]
		}

		services.ScanProgress.Update(task.channel.GuildID, task.channel.ID, pastward, high, low)
		if len(messages) == searchPageSize {
			if pastward {
				task.before = messages[searchPageSize-2].ID
			} else {
				task.after = messages[searchPageSize-2].ID
			}
			taskQueue <- task
		} else {
			// services.ScanProgress.Update(task.channel.GuildID, task.channel.ID, pastward, messages[0].ID, messages[len(messages)-1].ID, high.Content, low.Content)
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

func reverse(in []*discordgo.Message) []*discordgo.Message {
	for i := 0; i < len(in)/2; i++ {
		j := len(in) - 1 - i
		in[i], in[j] = in[j], in[i]
	}
	return in
}

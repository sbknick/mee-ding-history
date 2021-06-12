package bot

import (
	"fmt"
	"log"
	"strings"

	"github.com/bwmarrin/discordgo"

	"github.com/sbknick/mee-ding-history/data"
	"github.com/sbknick/mee-ding-history/services"
)

func (b *Bot) filter(msg *discordgo.MessageCreate, term string) bool {
	return msg.Author.Bot &&
		msg.Author.ID == b.Mee6.ID &&
		strings.Contains(msg.Message.Content, term) &&
		len(msg.Mentions) == 1
}

func (b *Bot) MessageScanner(session *discordgo.Session, msg *discordgo.MessageCreate) {
	if msg.Author.Bot && msg.Author.ID == b.Mee6.ID {
		fmt.Println("from mee6")
		fmt.Println("msg content:", msg.Message.Content)
		term := services.SearchTerm.GetSearchTerm(msg.GuildID)
		fmt.Println("term:", term)
		if !b.filter(msg, term) {
			fmt.Println("filter failed")
			return
		}

		fmt.Println("Ding caught.")

		user := msg.Mentions[0]
		level := extractLevel(msg.Content)
		dingMessage := b.firstBefore(msg.Message, user)
		log.Println("First before located.")
		if dingMessage == nil {
			fmt.Println("dingMessage is nil")
			return
		}

		// services.Memory.Commit(ding)
		data.Cache.Dings.Put(data.Ding{
			UserID:    user.ID,
			GuildID:   msg.GuildID,
			ChannelID: msg.ChannelID,
			MessageID: dingMessage.ID,
			Level:     level,
		})
		data.Cache.MaxLevels.Update(user.ID, msg.GuildID, level)

		userName := ""
		if _, ok := services.UserNames.Get(user.ID); !ok {
			if dingMessage.Member != nil {
				userName = dingMessage.Member.Nick
			}
			if userName == "" {
				userName = user.Username
			}
			services.UserNames.Set(user.ID, userName)
		}

		log.Println("User:", userName, "Level:", level, "Msg:", dingMessage.Content)
	}
}

func (b *Bot) firstBefore(msg *discordgo.Message, user *discordgo.User) *discordgo.Message {
	prev, err := b.session.ChannelMessages(msg.ChannelID, 10, msg.ID, "", "")
	if err != nil {
		fmt.Println("Error:", err)
	}

	for _, p := range prev {
		if p.Author.ID == user.ID {
			return p
		}
	}
	return nil
}

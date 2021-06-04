package data

import (
	"strings"

	"github.com/bwmarrin/discordgo"
)

type Ding struct {
	UserID  string
	GuildID string
	Level   string

	MessageID string
	ChannelID string

	Message *discordgo.Message
}

func (ding Ding) Key() string {
	return key(ding.GuildID, ding.UserID, ding.Level)
}

type MaxLevel struct {
	UserID  string
	GuildID string
	Level   string
}

func (ml MaxLevel) Key() string {
	return key(ml.GuildID, ml.UserID)
}

type Message struct {
	UserID    string
	ChannelID string
	MessageID string
	Message   string
	Source    discordgo.Message
}

func key(args ...string) string {
	return strings.Join(args, ":")
}

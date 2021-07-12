package models

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

	Message *discordgo.Message `json:"-"`
}

func (ding Ding) Key() string {
	return ToKey(ding.GuildID, ding.UserID, ding.Level)
}

type MaxLevel struct {
	UserID  string
	GuildID string
	Level   string
}

func (ml MaxLevel) Key() string {
	return ToKey(ml.GuildID, ml.UserID)
}

type Progress struct {
	Earliest, Latest              string
	EarlyTimestamp, LateTimestamp string
}

type ChannelProgress map[string]Progress
type GuildProgress map[string]ChannelProgress

type Message struct {
	UserID    string
	ChannelID string
	MessageID string
	Message   string
	Source    discordgo.Message
}

func ToKey(args ...string) string {
	return strings.Join(args, ":")
}

func SplitKey(input string) []string {
	return strings.Split(input, ":")
}

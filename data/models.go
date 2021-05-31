package data

import "github.com/bwmarrin/discordgo"

type Ding struct {
	UserID  string
	GuildID string
	Level   string

	MessageID string
	ChannelID string

	Message *discordgo.Message
}

type Level struct {
	UserID  string
	GuildID string
	Level   string
}

type Message struct {
	UserID    string
	ChannelID string
	MessageID string
	Message   string
	Source    discordgo.Message
}

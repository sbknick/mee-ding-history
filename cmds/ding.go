package cmds

import (
	"fmt"
	"log"

	"github.com/Lukaesebrot/dgc"
	"github.com/bwmarrin/discordgo"
	"github.com/sbknick/mee-ding-history/data"
)

func Ding() *dgc.Command {
	return &dgc.Command{
		Name:       "Ding",
		IgnoreCase: true,
		Handler:    dingUserHandler,
		SubCommands: []*dgc.Command{
			{
				Name:       "Me",
				IgnoreCase: true,
				Handler:    dingMeHandler,
			},
			{
				Name:       "Term",
				IgnoreCase: true,
				Handler:    termHandler,
			},
			{
				Name:       "Cancel",
				IgnoreCase: true,
				Handler:    cancelHandler,
			},
		},
	}
}

var termHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	if ctx.Arguments.Amount() == 0 {
		ctx.RespondText(fmt.Sprintf("My current search term is \"%s\"", "unknown"))
	} else {
		ctx.RespondText(fmt.Sprintf("Okay, my new search term is \"%s\"", ctx.Arguments.AsSingle().Raw()))
	}
}

var cancelHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	ctx.RespondText("You have been cancelled.")
}

var dingMeHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	var level string
	var ok bool
	if ctx.Arguments.Amount() > 0 {
		_, err := ctx.Arguments.AsSingle().AsInt()
		if err != nil {
			ctx.RespondText("How dare you?!? That's not a number! Are you _TRYING_ to crash me?!?")
			return
		}
		level = ctx.Arguments.AsSingle().Raw()
	}

	if level == "" {
		level, ok = data.Cache.MaxLevels.Get(ctx.Event.Author.ID, ctx.Event.GuildID)
	}
	if !ok {
		ctx.RespondText("error")
		return
	}

	d := data.Cache.Dings.Get(ctx.Event.Author.ID, ctx.Event.GuildID, level)
	_, err := ctx.Session.ChannelMessage(d.ChannelID, d.MessageID)
	if err != nil {
		ctx.RespondText("error")
		return
	}
	reportAsEmbed(ctx, d)
}

var dingUserHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	ctx.RespondText("Dong!")
}

func reportAsEmbed(ctx *dgc.Ctx, d data.Ding) {
	desc, err := d.Message.ContentWithMoreMentionsReplaced(ctx.Session)
	if err != nil {
		log.Fatal(err)
	}
	emb := &discordgo.MessageEmbed{
		Color:       0x42b983,
		Title:       "Level " + d.Level,
		Description: desc,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  "\u200b",
				Value: fmt.Sprintf("[Jump to...](%s)", messageLink(d)),
			},
		},
		Timestamp: string(d.Message.Timestamp),
		Footer:    &discordgo.MessageEmbedFooter{Text: "Brought to you by Blair"},
	}
	emb.Author = &discordgo.MessageEmbedAuthor{
		Name:    ctx.Event.Author.Username,
		IconURL: ctx.Event.Author.AvatarURL(""),
	}
	if len(d.Message.Attachments) > 0 {
		emb.Image = &discordgo.MessageEmbedImage{URL: d.Message.Attachments[0].URL}
	}

	err = ctx.RespondEmbed(emb)
	if err != nil {
		fmt.Println("Error:", err)
	}
}

func messageLink(d data.Ding) string {
	// `https://discord.com/channels/${this.guild ? this.guild.id : '@me'}/${this.channel.id}/${this.id}`
	return fmt.Sprintf("https://discord.com/channels/%s/%s/%s", d.GuildID, d.ChannelID, d.MessageID)
}

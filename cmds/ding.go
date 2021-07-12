package cmds

import (
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
	"github.com/lus/dgc"

	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/dings"
	"github.com/sbknick/mee-ding-history/data/maxLevels"
	"github.com/sbknick/mee-ding-history/data/models"
)

var cancelled chan struct{}

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
			{
				Name:       "Flush",
				IgnoreCase: true,
				Handler:    authorizedCommand(flushHandler),
			},
			{
				Name:       "Dump",
				IgnoreCase: true,
				Handler:    authorizedCommand(dumpHandler),
				SubCommands: []*dgc.Command{
					{
						Name:       "Key",
						IgnoreCase: true,
						Handler:    authorizedCommand(dumpKeyHandler),
					},
					{
						Name:       "Ding",
						IgnoreCase: true,
						Handler:    authorizedCommand(dumpDingHandler),
					},
				},
			},
		},
	}
}

var termHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	// if ctx.Arguments.Amount() == 0 {
	// 	ctx.RespondText(fmt.Sprintf("My current search term is \"%s\"", "unknown"))
	// } else {
	// 	ctx.RespondText(fmt.Sprintf("Okay, my new search term is \"%s\"", ctx.Arguments.AsSingle().Raw()))
	// }
}

var flushHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	cache.Flush()
	ctx.RespondText("OK")
}

var dumpHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	d, err := cache.Dump()
	if err != nil {
		ctx.RespondText("Error: " + err.Error())
	} else {
		ctx.RespondText("Dump: " + d)
	}
}

var dumpKeyHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	key := ctx.Arguments.Raw()

	d, err := cache.FetchAllRecordsForKey(key)
	if err != nil {
		ctx.RespondText("Error: " + err.Error())
		return
	}
	if cancelled == nil {
		cancelled = make(chan struct{})
	}
	for _, str := range d {
		ctx.RespondText(str)
		select {
		case <-cancelled:
			cancelled = nil // naive, can cause panics if there's multiple cancellable processes running in parallel
			return
		default:
		}
	}
}

var dumpDingHandler dgc.ExecutionHandler = authorizedCommand(func(ctx *dgc.Ctx) {
	guildId := ctx.Arguments.Get(0).Raw()
	userId := ctx.Arguments.Get(1).Raw()
	level := ctx.Arguments.Get(2).Raw()

	d, ok := cache.GetDing(guildId, userId, level)
	if !ok {
		ctx.RespondText("Error: No ding in memory")
		return
	}

	ctx.RespondText(fmt.Sprintf("%v", d))
})

var cancelHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	ctx.RespondText("You have been cancelled.")
	if cancelled != nil {
		close(cancelled)
	}
}

var dingMeHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	var level string
	var err error
	if ctx.Arguments.Amount() > 0 {
		_, err = ctx.Arguments.AsSingle().AsInt()
		if err != nil {
			ctx.RespondText("How dare you?!? That's not a number! Are you _TRYING_ to crash me?!?")
			return
		}
		level = ctx.Arguments.AsSingle().Raw()
	}

	if level == "" {
		level, err = maxLevels.Get(ctx.Event.Author.ID, ctx.Event.GuildID)
		if err != nil {
			log.Println("Error:", err.Error())
			ctx.RespondText("error")
			return
		}
	}

	d := dings.Get(ctx.Event.Author.ID, ctx.Event.GuildID, level)
	reportAsEmbed(ctx, d)
}

var dingUserHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	ctx.RespondText("Dong!")
}

func reportAsEmbed(ctx *dgc.Ctx, d *models.Ding) {
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
		Name:    ctx.Event.Member.Nick,
		IconURL: ctx.Event.Author.AvatarURL(""),
	}
	if emb.Author.Name == "" {
		emb.Author.Name = ctx.Event.Author.Username
	}
	if len(d.Message.Attachments) > 0 {
		emb.Image = &discordgo.MessageEmbedImage{URL: d.Message.Attachments[0].URL}
	}

	err = ctx.RespondEmbed(emb)
	if err != nil {
		fmt.Println("Error:", err)
	}
}

func messageLink(d *models.Ding) string {
	// `https://discord.com/channels/${this.guild ? this.guild.id : '@me'}/${this.channel.id}/${this.id}`
	return fmt.Sprintf("https://discord.com/channels/%s/%s/%s", d.GuildID, d.ChannelID, d.MessageID)
}

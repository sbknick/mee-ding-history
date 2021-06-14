package cmds

import (
	"fmt"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/lus/dgc"

	"github.com/sbknick/mee-ding-history/data"
	"github.com/sbknick/mee-ding-history/services"
)

func Found() *dgc.Command {
	return &dgc.Command{
		Name:       "Found",
		IgnoreCase: true,

		SubCommands: []*dgc.Command{
			{
				Name:       "Levels",
				IgnoreCase: true,
				Handler:    levelsHandler,
			},
		},
	}
}

var levelsHandler dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	if ctx.Event.GuildID != "" {
		return
	}

	ctx.RespondText("Working...")

	guilds := make(map[string]*discordgo.Guild)
	levels := data.Cache.MaxLevels.All()
	strs := make([]string, 0, len(levels))
	ctx.RespondText(fmt.Sprintf("Found %d results...", len(levels)))

	n := 0
	for _, l := range levels {
		userName, _ := services.UserNames.Get(l.UserID)

		g, ok := guilds[l.GuildID]
		if !ok {
			g, _ = ctx.Session.Guild(l.GuildID)
			guilds[l.GuildID] = g
		}

		str := fmt.Sprintf("%s  :  %s  :  %s", g.Name, userName, l.Level)
		strs = append(strs, str)

		if n%20 == 19 {
			ctx.RespondText(strings.Join(strs, "\n"))
			strs = strs[:0]
		}
		n++
	}

	ctx.RespondText(strings.Join(strs, "\n"))
}

package cmds

import "github.com/lus/dgc"

func authorizedCommand(fn func(ctx *dgc.Ctx)) dgc.ExecutionHandler {
	return func(ctx *dgc.Ctx) {
		if ctx.Event.Author.ID != "583594630415777802" {
			return
		}

		fn(ctx)
	}
}

package cmds

import (
	"fmt"

	"github.com/Lukaesebrot/dgc"
)

func Ding() *dgc.Command {
	return &dgc.Command{
		Name:       "Ding",
		IgnoreCase: true,
		SubCommands: []*dgc.Command{
			{
				Name:       "Me",
				IgnoreCase: true,
			},
			{
				Name:       "Term",
				IgnoreCase: true,
				Handler:    routeTerm,
			},
			{
				Name:       "Cancel",
				IgnoreCase: true,
			},
		},
		Handler: func(ctx *dgc.Ctx) {
			ctx.RespondText("Dong!")
		},
	}
}

var routeTerm dgc.ExecutionHandler = func(ctx *dgc.Ctx) {
	if ctx.Arguments.Amount() == 0 {
		ctx.RespondText(fmt.Sprintf("My current search term is \"%s\"", "unknown"))
	} else {
		ctx.RespondText(fmt.Sprintf("Okay, my new search term is \"%s\"", ctx.Arguments.AsSingle().Raw()))
	}
}

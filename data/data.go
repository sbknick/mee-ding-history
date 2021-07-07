package data

import (
	"context"

	"github.com/sbknick/mee-ding-history/data/cache"
)

var (
	ctx      context.Context
	cancelFn context.CancelFunc
)

func Init(redisUrl string) {
	ctx, cancelFn = context.WithCancel(context.Background())
	cache.Init(redisUrl, ctx)
	Driver.init()
}

func Stop() <-chan struct{} {
	Driver.cancel()
	cache.Cancel()
	return ctx.Done()
}

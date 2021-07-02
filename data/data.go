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
	driver.init()

}

func Stop() <-chan struct{} {
	driver.cancel()
	cache.Cancel()
	return ctx.Done()
}

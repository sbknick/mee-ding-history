package data

import (
	"context"
	"log"

	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/db"
	"github.com/sbknick/mee-ding-history/data/driver"
	"github.com/sbknick/mee-ding-history/data/maxLevels"
)

var (
	ctx      context.Context
	cancelFn context.CancelFunc
)

func Init(redisUrl, dbConnStr string) {
	ctx, cancelFn = context.WithCancel(context.Background())
	db.Init(dbConnStr)
	cache.Init(redisUrl, ctx)
	driver.Init()

	if err := maxLevels.Hydrate(); err != nil {
		log.Println("Error hydrating maxLevels:", err.Error())
	}
}

func Stop() <-chan struct{} {
	cancelFn()
	driver.Cancel()
	cache.Cancel()
	return ctx.Done()
}

package dings

import (
	"log"
	"time"

	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/db"
	"github.com/sbknick/mee-ding-history/data/driver"
	"github.com/sbknick/mee-ding-history/data/models"
)

const (
	KEEP_ALIVE time.Duration = time.Hour * 24
	MAX_IN_MEM               = 1000
)

var dingMap map[string]*models.Ding = make(map[string]*models.Ding)
var dingTimerMap map[string]time.Time = make(map[string]time.Time)

func init() {
	go func() {
		ticker := time.NewTicker(time.Hour)

		for range ticker.C {
			if len(dingMap) > MAX_IN_MEM {
				now := time.Now()
				for k, v := range dingTimerMap {
					if now.Sub(v) < 0 {
						delete(dingMap, k)
						delete(dingTimerMap, k)
					}
				}
			}
		}
	}()
}

func Get(userId string, guildId string, level string) *models.Ding {
	d, ok := dingMap[models.ToKey(guildId, userId, level)]
	if ok {
		return d
	}

	d, ok = cache.GetDing(guildId, userId, level)
	if ok {
		dingMap[d.Key()] = d
		return d
	}

	var err error
	d, err = db.GetDing(guildId, userId, level)
	if err != nil {
		log.Printf("Error: " + err.Error())
		return nil
	}
	dingMap[d.Key()] = d
	driver.AddDing(d)
	return d
}

func Put(ding *models.Ding) error {
	dingMap[ding.Key()] = ding
	driver.AddDing(ding)
	err := db.PutDing(ding)
	return err
}

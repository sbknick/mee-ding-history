package dings

import (
	"github.com/sbknick/mee-ding-history/data"
	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/models"
)

// var Dings dings

// type dings struct{}

var dingMap map[string]*models.Ding = make(map[string]*models.Ding)

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

	return nil
}

func Put(ding *models.Ding) error {
	dingMap[ding.Key()] = ding
	data.Driver.AddDing(ding)
	return nil
	// return cache.SaveDings([]*models.Ding{ding})
}

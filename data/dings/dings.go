package dings

import (
	"github.com/sbknick/mee-ding-history/data/models"
)

// var Dings dings

// type dings struct{}

var dingMap map[string]models.Ding = make(map[string]models.Ding)

func Get(userId string, guildId string, level string) models.Ding {
	return dingMap[models.ToKey(guildId, userId, level)]
}

func Put(ding models.Ding) {
	dingMap[ding.Key()] = ding
}

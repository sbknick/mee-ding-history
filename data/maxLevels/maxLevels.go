package maxLevels

import (
	"strconv"

	"github.com/sbknick/mee-ding-history/data/models"
)

var maxLevelMap map[string]models.MaxLevel = make(map[string]models.MaxLevel)

func Get(userId string, guildId string) (string, bool) {
	ml, ok := maxLevelMap[models.ToKey(guildId, userId)]
	if ok {
		return ml.Level, true
	}
	return "", false
}

func Update(userID string, guildId string, level string) {
	maxLevel := models.MaxLevel{
		UserID:  userID,
		GuildID: guildId,
		Level:   level,
	}
	key := maxLevel.Key()
	cml, exists := maxLevelMap[key]
	if exists {
		c, _ := strconv.Atoi(cml.Level)
		n, _ := strconv.Atoi(maxLevel.Level)
		if n > c {
			maxLevelMap[key] = maxLevel
		}
	} else {
		maxLevelMap[key] = maxLevel
	}
}

func All() map[string]models.MaxLevel {
	return maxLevelMap
}

func hydrate() {
	// x := redisClient.HGetAll(ctx, "maxlevels")
	// l, err := x.Result()
	// if err != nil {
	// 	return // not available in redis
	// }

	// maxLevelMap = driver.heighten(l)
}

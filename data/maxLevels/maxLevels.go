package maxLevels

import (
	"fmt"
	"strconv"

	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/driver"
	"github.com/sbknick/mee-ding-history/data/models"
	"github.com/sbknick/mee-ding-history/services"
)

var maxLevelMap map[string]models.MaxLevel

func Get(userId string, guildId string) (string, error) {
	ml, ok := maxLevelMap[models.ToKey(guildId, userId)]
	if ok {
		return ml.Level, nil
	}
	username, ok := services.UserNames.Get(userId)
	if !ok {
		username = userId
	}

	return "", fmt.Errorf("max level for user(%s), guild(%s) not found", username, guildId)
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
			driver.UpdateMaxLevel(maxLevel)
		}
	} else {
		maxLevelMap[key] = maxLevel
		driver.UpdateMaxLevel(maxLevel)
	}
}

func All() map[string]models.MaxLevel {
	return maxLevelMap
}

func Hydrate() error {
	if ml, err := cache.GetMaxLevels(); err != nil {
		maxLevelMap = make(map[string]models.MaxLevel)
		return fmt.Errorf("failed to fetch maxLevels from redis: %s", err.Error())
	} else {
		maxLevelMap = ml
		return nil
	}
}

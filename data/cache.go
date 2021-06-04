package data

import (
	"strconv"
)

var Cache cache

type (
	cache struct {
		Dings     dings
		MaxLevels maxLevels
	}
	dings     struct{}
	maxLevels struct{}
)

var (
	dingMap     map[string]Ding     = make(map[string]Ding)
	maxLevelMap map[string]MaxLevel = make(map[string]MaxLevel)
)

/** dings **/

func (dings) Get(userId string, guildId string, level string) Ding {
	return dingMap[key(guildId, userId, level)]
}

func (dings) Put(ding Ding) {
	dingMap[ding.Key()] = ding
}

/** max levels **/

func (maxLevels) Get(userId string, guildId string) (string, bool) {
	ml, ok := maxLevelMap[key(guildId, userId)]
	if ok {
		return ml.Level, true
	}
	return "", false
}

func (maxLevels) Update(userID string, guildId string, level string) {
	maxLevel := MaxLevel{
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

/** common util **/

func Hydrate() {

}

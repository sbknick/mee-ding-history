package data

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	redis "github.com/go-redis/redis/v8"
)

var Cache cache

type (
	cache struct {
		Dings     dings
		MaxLevels maxLevels
	}
	dings     struct{}
	maxLevels struct{}

	progress struct {
		channelID string
		latest    string
		earliest  string
	}

	// map[guildId][]progress
	fullScanProgress map[string][]progress
)

var (
	dingMap     map[string]Ding     = make(map[string]Ding)
	maxLevelMap map[string]MaxLevel = make(map[string]MaxLevel)

	redisClient *redis.Client
	ctx         context.Context
	cancelFn    context.CancelFunc
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

func (maxLevels) All() map[string]MaxLevel {
	return maxLevelMap
}

func (maxLevels) Commit() error {
	x := redisClient.HSet(ctx, "maxlevels", flatten(maxLevelMap))
	return x.Err()
}

func (maxLevels) hydrate() {
	x := redisClient.HGetAll(ctx, "maxlevels")
	l, err := x.Result()
	if err != nil {
		return // not available in redis
	}

	maxLevelMap = heighten(l)
}

/** common util **/

func Init(redisUrl string) {
	ctx, cancelFn = context.WithCancel(context.Background())

	opts, err := redis.ParseURL(redisUrl)
	if err != nil {
		panic(err)
	}

	redisClient = redis.NewClient(opts).WithContext(ctx)

	Cache.MaxLevels.hydrate()
}

func flatten(m map[string]MaxLevel) []interface{} {
	vals := make([]interface{}, 0, len(m)*2)
	for k, v := range m {
		b, _ := json.Marshal(v)
		vals = append(vals, k, b)
	}
	return vals
}

func heighten(m map[string]string) map[string]MaxLevel {
	ml := make(map[string]MaxLevel, len(m))
	return ml
}

func (cache) Flush() error {
	x := redisClient.FlushDB(ctx)
	return x.Err()
}

func (cache) Dump() (string, error) {
	x := redisClient.Keys(ctx, "*")
	v, err := x.Result()
	if err != nil {
		return "", err
	}
	return strings.Join(v, " "), nil
}

func (cache) Stop() <-chan struct{} {
	cancelFn()
	return ctx.Done()
}

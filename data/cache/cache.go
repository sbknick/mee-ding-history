package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	redis "github.com/go-redis/redis/v8"
	"github.com/sbknick/mee-ding-history/data/models"
)

// var Cache cache

var (
	redisClient *redis.Client
	ctx         context.Context
)

func Init(redisUrl string, contxt context.Context) {
	ctx = contxt

	opts, err := redis.ParseURL(redisUrl)
	if err != nil {
		panic(err)
	}

	redisClient = redis.NewClient(opts).WithContext(ctx)

	// Cache.MaxLevels.hydrate()
}

func Cancel() {
}

func SaveDings(dings []*models.Ding) error {
	return save("dings", dings)
}

func SaveMaxLevels(maxLevels map[string]models.MaxLevel) error {
	return save("maxlevels", maxLevels)
}

func SaveGuildScanProgress(progress models.ChannelProgress) error {
	// // x := make(map[string]models.Progress)
	// // for c, v := range progress {
	// // 	x[models.ToKey(guildID, c)] = v
	// // }
	// x := redisClient.HMSet(ctx, "scanprogress", progress)
	// rs, err := x.Result()
	// _ = rs
	// return err
	return save("scanprogress", progress)
}

func save(key string, record interface{}) error {
	rs, err := redisClient.HMSet(ctx, key, redisify(record)...).Result()
	_ = rs
	return err
}

func GetDing(guildId, userId, level string) (*models.Ding, bool) {
	key := models.ToKey(guildId, userId, level)
	x := redisClient.HGet(ctx, "dings", key)
	_ = x
	rs, err := x.Result()
	if err != nil {
		fmt.Println("Error: ", err.Error())
		return nil, false
	}

	var ding *models.Ding
	err = json.Unmarshal([]byte(rs), ding)
	if err != nil {
		fmt.Println("Error: ", err.Error())
		return nil, false
	}

	return ding, true
}

func GetFullScanProgress() (models.GuildProgress, error) {
	// return nil, nil

	x := redisClient.HGetAll(ctx, "scanprogress")
	rs, err := x.Result()
	if err != nil {
		return nil, err
	}

	_ = rs
	var progress models.GuildProgress
	e := json.Unmarshal(nil, &progress)

	return progress, e
}

/** common util **/

func Flush() error {
	x := redisClient.FlushDB(ctx)
	return x.Err()
}

func Dump() (string, error) {
	x := redisClient.Keys(ctx, "*")
	v, err := x.Result()
	if err != nil {
		return "", err
	}
	return strings.Join(v, " "), nil
}

func FetchAllRecordsForKey(key string) ([]string, error) {
	x := redisClient.HGetAll(ctx, key)
	rs, err := x.Result()
	if err != nil {
		panic("")
	}

	out := make([]string, 0, len(rs))
	for k, v := range rs {
		out = append(out, k+" :: "+v)
	}

	return out, nil
}

func redisify(coll interface{}) []interface{} {
	v := reflect.ValueOf(coll)
	vals := make([]interface{}, 0, v.Len()*2)

	switch v.Kind() {
	case reflect.Map:
		for iter := v.MapRange(); iter.Next(); {
			value, _ := json.Marshal(iter.Value().Interface())
			vals = append(vals, iter.Key().String(), string(value))
		}

	case reflect.Slice:
		for i := 0; i < v.Len(); i++ {
			item := v.Index(i)
			key := item.MethodByName("Key").Call(make([]reflect.Value, 0))
			value, _ := json.Marshal(item.Interface())
			vals = append(vals, key[0].Interface(), string(value))
		}
	}

	return vals
}

// func heighten(m map[string]string) map[string]models.MaxLevel {
// 	ml := make(map[string]models.MaxLevel, len(m))
// 	return ml
// }

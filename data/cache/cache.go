package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"time"

	redis "github.com/go-redis/redis/v8"
	"github.com/sbknick/mee-ding-history/data/models"
)

// var Cache cache

type Batch struct {
	pipeline redis.Pipeliner
}

const (
	TIME_TO_LIVE time.Duration = time.Hour * 24 * 7
)

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
}

func Cancel() {
}

func NewBatch() *Batch {
	return &Batch{
		pipeline: redisClient.Pipeline(),
	}
}

func (b *Batch) Execute() error {
	cmderr, err := b.pipeline.Exec(ctx)
	if err != nil {
		return err
	}
	for _, c := range cmderr {
		if c.Err() != nil {
			return c.Err()
		}
	}
	return nil
}

func (b *Batch) SaveDings(dings []*models.Ding) error {
	for _, d := range dings {
		data, err := json.Marshal(d)
		if err != nil {
			return err
		}
		b.pipeline.Set(ctx, "{dings}"+d.Key(), data, TIME_TO_LIVE)
	}
	return nil
}

func (b *Batch) SaveMaxLevels(maxLevels map[string]models.MaxLevel) {
	b.pipeline.HSet(ctx, "maxlevels", redisify(maxLevels)...).Result()
	// b.pipeline.Expire(ctx, "maxlevels", 0)
}

func (b *Batch) SaveGuildScanProgress(progress models.ChannelProgress) {
	b.pipeline.HSet(ctx, "scanprogress", redisify(progress)...).Result()
	// b.pipeline.Expire(ctx, "scanprogress", 0)
}

// func SaveDings(dings []*models.Ding) error {
// 	// p.HSet
// 	// p := redisClient.Pipeline()
// 	// addSaveValue(p, "dings")

// 	return saveHash("dings", dings)
// }

// func SaveMaxLevels(maxLevels map[string]models.MaxLevel) error {
// 	return saveHash("maxlevels", maxLevels)
// }

// func SaveGuildScanProgress(progress models.ChannelProgress) error {
// 	// // x := make(map[string]models.Progress)
// 	// // for c, v := range progress {
// 	// // 	x[models.ToKey(guildID, c)] = v
// 	// // }
// 	// x := redisClient.HMSet(ctx, "scanprogress", progress)
// 	// rs, err := x.Result()
// 	// _ = rs
// 	// return err
// 	return saveHash("scanprogress", progress)
// }

// func saveValue(key, value string) error {
// 	x := redisClient.Set(ctx, key, value, 0)
// 	_ = x
// 	return nil
// }

// func saveHash(key string, record interface{}) error {
// 	rs, err := redisClient.HSet(ctx, key, redisify(record)...).Result()
// 	_ = rs
// 	return err
// }

// func getValue(key string) (string, error) {
// 	p := redisClient.Pipeline()
// 	x := p.Get(ctx, key)
// 	p.Expire(ctx, key, time.Hour*24*7)
// 	rs, err := x.Result()
// 	return rs, err
// }

func GetDing(guildId, userId, level string) (*models.Ding, bool) {
	key := "{dings}" + models.ToKey(guildId, userId, level)
	p := redisClient.Pipeline()
	x := p.Get(ctx, key)
	// _ = x
	p.Expire(ctx, key, TIME_TO_LIVE)
	p.Exec(ctx)

	rs, err := x.Result()
	if err != nil {
		fmt.Println("Error: ", err.Error())
		return nil, false
	}

	var ding models.Ding
	err = json.Unmarshal([]byte(rs), &ding)
	if err != nil {
		fmt.Println("Error: ", err.Error())
		return nil, false
	}

	return &ding, true
}

// func GetDing(guildId, userId, level string) (*models.Ding, bool) {
// 	key := models.ToKey(guildId, userId, level)
// 	x := redisClient.HGet(ctx, "dings", key)
// 	_ = x
// 	rs, err := x.Result()
// 	if err != nil {
// 		fmt.Println("Error: ", err.Error())
// 		return nil, false
// 	}

// 	var ding *models.Ding
// 	err = json.Unmarshal([]byte(rs), ding)
// 	if err != nil {
// 		fmt.Println("Error: ", err.Error())
// 		return nil, false
// 	}

// 	return ding, true
// }

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

func GetMaxLevels() (map[string]models.MaxLevel, error) {
	// return nil, nil

	x := redisClient.HGetAll(ctx, "maxlevels")
	rs, err := x.Result()
	if err != nil {
		return nil, err
	}

	_ = rs
	var maxLevels map[string]models.MaxLevel
	e := json.Unmarshal(nil, &maxLevels)

	return maxLevels, e
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
		return nil, fmt.Errorf("%s", err.Error())
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

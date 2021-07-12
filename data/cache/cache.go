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

func GetDing(guildId, userId, level string) (*models.Ding, bool) {
	key := "{dings}" + models.ToKey(guildId, userId, level)
	pipe := redisClient.Pipeline()
	x := pipe.Get(ctx, key)

	pipe.Expire(ctx, key, TIME_TO_LIVE)
	pipe.Exec(ctx)

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

func GetFullScanProgress() (models.GuildProgress, error) {
	x := redisClient.HGetAll(ctx, "scanprogress")
	rs, err := x.Result()
	if err != nil {
		return nil, err
	}

	progress := make(models.GuildProgress)
	for k, v := range rs {
		x := models.SplitKey(k)
		guildId, channelId := x[0], x[1]

		gProg, ok := progress[guildId]
		if !ok {
			gProg = make(models.ChannelProgress)
			progress[guildId] = gProg
		}

		var p models.Progress
		if err := json.Unmarshal([]byte(v), &p); err != nil {
			return nil, err
		}

		gProg[channelId] = p
	}

	return progress, nil
}

func GetMaxLevels() (map[string]models.MaxLevel, error) {
	x := redisClient.HGetAll(ctx, "maxlevels")
	rs, err := x.Result()
	if err != nil {
		return nil, err
	}

	maxLevels := make(map[string]models.MaxLevel, len(rs))
	for k, v := range rs {
		var ml models.MaxLevel
		if err := json.Unmarshal([]byte(v), &ml); err != nil {
			return nil, err
		}

		maxLevels[k] = ml
	}
	return maxLevels, nil
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

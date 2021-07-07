package scanProgress

import (
	"github.com/sbknick/mee-ding-history/data"
	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/models"
)

// type (
// 	// map[guildId][channelId]
// 	GuildProgress map[string]map[string]models.Progress

// 	// Progress struct {
// 	// 	Earliest, Latest              string
// 	// 	EarlyTimestamp, LateTimestamp string
// 	// }
// )

/** fullscan progress **/

func Put(guildID, channelID string, progress models.Progress) error {
	// b, err := json.Marshal(m)
	// if err != nil {
	// 	log.Println("Failed to marshal progress to json")
	// 	return
	// }

	// pr := models.ChannelProgress{models.ToKey(guildID, channelID): progress}
	data.Driver.UpdateScanProgress(progress, guildID, channelID)
	return nil
	// return cache.SaveGuildScanProgress(pr)

	// redisClient.Set(ctx, "fullscan-progress", b, 0)
}

func Fetch() (models.GuildProgress, error) {
	return cache.GetFullScanProgress()
}

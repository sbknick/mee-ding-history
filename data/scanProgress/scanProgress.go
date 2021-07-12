package scanProgress

import (
	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/driver"
	"github.com/sbknick/mee-ding-history/data/models"
)

/** fullscan progress **/

func Put(guildID, channelID string, progress models.Progress) error {
	driver.UpdateScanProgress(progress, guildID, channelID)
	return nil
}

func Fetch() (models.GuildProgress, error) {
	return cache.GetFullScanProgress()
}

package services

import (
	"github.com/bwmarrin/discordgo"

	"github.com/sbknick/mee-ding-history/data/models"
	sp "github.com/sbknick/mee-ding-history/data/scanProgress"
)

var ScanProgress scanProgress

type scanProgress struct{}

type (
	ProgressByChannel map[string]Progress
	Progress          struct {
		models.Progress
		LatestContent, EarliestContent string
	}
)

var (
	guildProgress map[string]ProgressByChannel = make(map[string]ProgressByChannel)
	guildPr       models.GuildProgress
)

func Init() {
	var err error
	guildPr, err = sp.Fetch()
	if err != nil {
		guildPr = make(models.GuildProgress)
	}

	for guildId, cpr := range guildPr {
		for channelId, pr := range cpr {
			gpr, ok := guildProgress[guildId]
			if !ok {
				gpr = make(ProgressByChannel)
				guildProgress[guildId] = gpr
			}

			gpr[channelId] = Progress{Progress: pr}
		}
	}
}

func (scanProgress) GetScanProgress(guildID string) (ProgressByChannel, bool) {
	pbc, ok := guildProgress[guildID]
	return pbc, ok
}

func (scanProgress) Update(guildID, channelID string, isPastward bool, high, low *discordgo.Message) {
	pbc, ok := guildProgress[guildID]
	if !ok {
		pbc = make(ProgressByChannel)
		guildProgress[guildID] = pbc
	}

	cpr, ok := pbc[channelID]
	if !ok {
		cpr = Progress{
			Progress: models.Progress{
				Earliest:       low.ID,
				Latest:         high.ID,
				EarlyTimestamp: string(low.Timestamp),
				LateTimestamp:  string(high.Timestamp),
			},
			LatestContent:   high.Content,
			EarliestContent: low.Content,
		}
	} else {
		if isPastward {
			cpr.Earliest = low.ID
			cpr.EarliestContent = low.Content
			cpr.EarlyTimestamp = string(low.Timestamp)
		} else {
			cpr.Latest = high.ID
			cpr.LatestContent = high.Content
			cpr.LateTimestamp = string(low.Timestamp)
		}
	}
	pbc[channelID] = cpr

	sp.Put(guildID, channelID, cpr.Progress)
}

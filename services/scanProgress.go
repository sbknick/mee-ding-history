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
		// Latest                         string
		// Earliest                       string
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
		// panic(err.Error())
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

// func init() {
// 	pbc := make(ProgressByChannel)
// 	pbc["565222197199765504"] = Progress{data.Progress{"855463868078882816", "855463868078882816"},
// 		"Get some druggies", "Get some druggies"}
// 	guildProgress["565201829877514240"] = pbc
// }

func (scanProgress) GetScanProgress(guildID string) (ProgressByChannel, bool) {
	pbc, ok := guildProgress[guildID]
	return pbc, ok
}

func (scanProgress) Update(guildID, channelID string, isPastward bool, high, low *discordgo.Message) {
	// pbc := ScanProgress.GetScanProgress(guildID)
	pbc, ok := guildProgress[guildID]
	if !ok {
		pbc = make(ProgressByChannel)
		guildProgress[guildID] = pbc
	}
	cpr, ok := pbc[channelID]
	if !ok {
		cpr = Progress{Progress: models.Progress{
			Latest:   high.ID,
			Earliest: low.ID,
		},
			LatestContent:   high.Content,
			EarliestContent: low.Content,
		}
		pbc[channelID] = cpr
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
		// if pr.Latest != "" {
		// 	cpr.Latest = low
		// }
		// if pr.Earliest != "" {
		// 	cpr.Earliest = low
		// }
		pbc[channelID] = cpr
	}

	// var gp models.ChannelProgress = toGuildPro()
	sp.Put(guildID, channelID, cpr.Progress)
}

// func toGuildPro() models.ChannelProgress {
// 	guildPr := make(models.ChannelProgress)

// 	for k, v := range guildProgress {
// 		x := make(map[string]models.Progress)
// 		guildPr[k] = x

// 		for k, v := range v {
// 			x[k] = v.Progress
// 		}
// 	}

// 	return guildPr
// }

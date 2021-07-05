package data

import (
	"time"

	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/models"
)

var driver dv

type dv struct{}

const (
	_                      = iota
	dvFinish driverMsgType = iota
	dvAddDing
	dvUpdateMaxLevel
	dvUpdateProgress

	maxDings = 20
)

type (
	driverMsg struct {
		msgType  driverMsgType
		ding     *models.Ding
		maxLevel models.MaxLevel
		progress struct {
			models.Progress
			guildID, channelID string
		}
		done chan<- struct{}
	}

	driverMsgType int8
)

var (
	driverCh chan driverMsg
)

func (dv) AddDing(ding *models.Ding) {
	driverCh <- driverMsg{
		msgType: dvAddDing,
		ding:    ding,
	}
}

func (dv) UpdateMaxLevel(maxLevel models.MaxLevel) {
	driverCh <- driverMsg{
		msgType:  dvUpdateMaxLevel,
		maxLevel: maxLevel,
	}
}

func (dv) UpdateScanProgress(progress models.Progress, guildID, channelID string) {
	driverCh <- driverMsg{
		msgType: dvUpdateProgress,
		progress: struct {
			models.Progress
			guildID   string
			channelID string
		}{progress, guildID, channelID},
	}
}

func (dv) init() {
	driverCh = make(chan driverMsg, 20)

	go func() {
		var (
			dings     = make([]*models.Ding, 0, maxDings)
			maxLevels = make(map[string]models.MaxLevel)
			progress  = make(models.ChannelProgress)

			reset = func() {
				dings = dings[:0]
				for k := range maxLevels {
					delete(maxLevels, k)
				}
				for k := range progress {
					delete(progress, k)
				}
			}
		)

		commitTimer := time.NewTicker(time.Minute * 1) // 10)
		for {
			select {
			case msg, ok := <-driverCh:
				if !ok {
					return
				}

				switch msg.msgType {
				case dvAddDing:
					dings = append(dings, msg.ding)
					if len(dings) == maxDings {
						driver.commit(dings, nil, nil, nil)
						dings = dings[:0]
					}
				case dvUpdateMaxLevel:
					maxLevels[msg.maxLevel.Key()] = msg.maxLevel
				case dvUpdateProgress:
					progress[models.ToKey(msg.progress.guildID, msg.progress.channelID)] = msg.progress.Progress
				case dvFinish:
					driver.commit(dings, maxLevels, progress, msg.done)
					defer close(msg.done)
				}

			case <-commitTimer.C:
				driver.commit(dings, maxLevels, progress, nil)
				reset()
			}
		}
	}()
}

func (dv) cancel() {
	done := make(chan struct{})
	driverCh <- driverMsg{
		msgType: dvFinish,
		done:    done,
	}
	close(driverCh)
	<-done
}

func (dv) commit(dings []*models.Ding, maxLevels map[string]models.MaxLevel, progress models.ChannelProgress, done chan<- struct{}) {
	// do the things
	if len(dings) > 0 {
		cache.SaveDings(dings)
	}
	if len(maxLevels) > 0 {
		cache.SaveMaxLevels(maxLevels)
	}
	if len(progress) > 0 {
		cache.SaveGuildScanProgress(progress)
	}

	if done != nil {
		close(done)
	}
}

package data

import (
	"time"

	"github.com/sbknick/mee-ding-history/data/cache"
	"github.com/sbknick/mee-ding-history/data/models"
)

var Driver driver

type driver struct{}

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
		progress driverProgress
		done     chan<- struct{}
	}

	driverProgress struct {
		models.Progress
		guildID, channelID string
	}

	driverMsgType int8
)

var (
	driverCh chan driverMsg
)

func (driver) AddDing(ding *models.Ding) {
	driverCh <- driverMsg{
		msgType: dvAddDing,
		ding:    ding,
	}
}

func (driver) UpdateMaxLevel(maxLevel models.MaxLevel) {
	driverCh <- driverMsg{
		msgType:  dvUpdateMaxLevel,
		maxLevel: maxLevel,
	}
}

func (driver) UpdateScanProgress(progress models.Progress, guildID, channelID string) {
	msg := driverMsg{
		msgType: dvUpdateProgress,
		progress: driverProgress{
			Progress:  progress,
			guildID:   guildID,
			channelID: channelID,
		},
	}

	// for k, v := range progress {
	// 	pg := driverProgress{
	// 		Progress:  v,
	// 		guildID:   guildID,
	// 		channelID: k,
	// 	}
	// 	msg.progress = append(msg.progress, pg)
	// }

	driverCh <- msg
}

func (driver) init() {
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
						Driver.commit(dings, nil, nil, nil)
						dings = dings[:0]
					}

				case dvUpdateMaxLevel:
					maxLevels[msg.maxLevel.Key()] = msg.maxLevel

				case dvUpdateProgress:
					// for _, v := range msg.progress {
					progress[models.ToKey(msg.progress.guildID, msg.progress.channelID)] = msg.progress.Progress
					// }

				case dvFinish:
					Driver.commit(dings, maxLevels, progress, msg.done)
					defer close(msg.done)
				}

			case <-commitTimer.C:
				Driver.commit(dings, maxLevels, progress, nil)
				reset()
			}
		}
	}()
}

func (driver) cancel() {
	done := make(chan struct{})
	driverCh <- driverMsg{
		msgType: dvFinish,
		done:    done,
	}
	close(driverCh)
	<-done
}

func (driver) commit(dings []*models.Ding, maxLevels map[string]models.MaxLevel, progress models.ChannelProgress, done chan<- struct{}) {
	batch := cache.NewBatch()

	// do the things
	if len(dings) > 0 {
		// cache.SaveDings(dings)
		batch.SaveDings(dings)
	}
	if len(maxLevels) > 0 {
		// cache.SaveMaxLevels(maxLevels)
		batch.SaveMaxLevels(maxLevels)
	}
	if len(progress) > 0 {
		// cache.SaveGuildScanProgress(progress)
		batch.SaveGuildScanProgress(progress)
	}

	batch.Execute()

	if done != nil {
		close(done)
	}
}

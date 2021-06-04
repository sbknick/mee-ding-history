package bot

import (
	"testing"
)

func TestRun(t *testing.T) {
	bot, _ := New(nil)
	_ = bot.FullScan()
}

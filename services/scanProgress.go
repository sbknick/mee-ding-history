package services

var ScanProgress scanProgress

type scanProgress struct{}

type (
	ProgressByChannel map[string]Progress
	Progress          struct {
		Latest   string
		Earliest string
	}
)

func (scanProgress) GetScanProgress(guildID string) ProgressByChannel {
	pr := make(map[string]Progress)

	return pr
}

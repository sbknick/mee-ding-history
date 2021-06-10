package services

var (
	SearchTerm searchTermService
)

type searchTermService struct{}

// GetSearchTerm returns the string to use for assessing whether a message from Mee6 is a ding message for a server.
// The ding message can be configured for each server in Mee6, so we have to be able to cope with that.
// Perhaps in the future, we can define multiple terms to match against...
// TODO: Un-hard-code this.
func (searchTermService) GetSearchTerm(guildName string) string {
	switch guildName {
	case "681815996943826945": // Test server
		return "GG"
	default:
		return "DING!"
	}
}

package services

import "github.com/sbknick/mee-ding-history/data/models"

var UserNames = userNamesService{
	names: make(map[string]string),
}

type userNamesService struct {
	names map[string]string
}

func (uns userNamesService) Get(guildID, userID string) (string, bool) {
	n, x := uns.names[models.ToKey(guildID, userID)]
	return n, x
}

func (uns userNamesService) Set(guildID, userID, userName string) {
	uns.names[models.ToKey(guildID, userID)] = userName
}

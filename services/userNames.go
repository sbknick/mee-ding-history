package services

var UserNames = userNamesService{
	names: make(map[string]string),
}

type userNamesService struct {
	names map[string]string
}

func (uns userNamesService) Get(userID string) (string, bool) {
	n, x := uns.names[userID]
	return n, x
}

func (uns userNamesService) Set(userID, userName string) {
	uns.names[userID] = userName
}

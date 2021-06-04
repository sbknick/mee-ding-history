package bot

import (
	"github.com/bwmarrin/discordgo"
)

type Bot struct {
	session *discordgo.Session
	mee6    *discordgo.User
	myID    string
}

func New(session *discordgo.Session) (*Bot, error) {
	user, err := session.User("@me")
	if err != nil {
		return nil, err
	}

	mee6, err := session.User("159985870458322944")
	if err != nil {
		return nil, err
	}

	return &Bot{
		session: session,
		mee6:    mee6,
		myID:    user.ID,
	}, nil
}

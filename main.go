package main

import (
	"flag"
	"log"
	"os"
	"os/signal"

	"github.com/Lukaesebrot/dgc"
	"github.com/bwmarrin/discordgo"

	"github.com/sbknick/mee-ding-history/bot"
	"github.com/sbknick/mee-ding-history/cmds"
)

var (
	discordToken string
)

func main() {
	flag.StringVar(&discordToken, "discord-token", "", "Discord bot access token")

	flag.Parse()

	router := dgc.Create(&dgc.Router{
		Prefixes: []string{"!"},
		Commands: []*dgc.Command{
			cmds.Ding(),
		},
	})

	var session *discordgo.Session
	var err error

	if session, err = discordgo.New("Bot " + discordToken); err != nil {
		log.Fatalf("Invalid bot parameters: %v", err)
	}

	/** **/

	session.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Print("Ready!")
	})

	/** **/

	if err = session.Open(); err != nil {
		log.Fatalf("Failed to open session: %v", err)
	}

	defer session.Close()
	router.Initialize(session)

	b, _ := bot.New(session)
	_ = b.FullScan()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop
	log.Println("OS interrupt received, shutting down.")
}

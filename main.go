package main

import (
	"flag"
	"log"
	"os"
	"os/signal"

	"github.com/bwmarrin/discordgo"
	"github.com/lus/dgc"

	"github.com/sbknick/mee-ding-history/bot"
	"github.com/sbknick/mee-ding-history/cmds"
	"github.com/sbknick/mee-ding-history/data"
)

var (
	discordToken string
	redisUrl     string
	dbUrl        string
)

func main() {
	flag.StringVar(&discordToken, "discord-token", "", "Discord bot access token")
	flag.StringVar(&redisUrl, "redis", "", "Redis Url")
	flag.StringVar(&dbUrl, "db", "", "Db Url")
	flag.Parse()

	router := dgc.Create(&dgc.Router{
		Prefixes: []string{"!"},
		Commands: []*dgc.Command{
			cmds.Ding(),
			cmds.Found(),
		},
	})

	var session *discordgo.Session
	var err error

	if session, err = discordgo.New("Bot " + discordToken); err != nil {
		log.Fatalf("Invalid bot parameters: %v", err)
	}
	dingBot, _ := bot.New(session)

	data.Init(redisUrl)

	/** **/

	// session.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
	// 	log.Print("Ready!")
	// })

	// session.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
	// 	if m.Author.Bot && m.Author.ID == b.Mee6.ID {
	// 		term := services.SearchTerm.GetSearchTerm(m.GuildID)
	// 		if strings.Contains(m.Message.Content, term) {
	// 			services.Memory.Commit(m.Message)
	// 		}
	// 	}
	// })

	session.AddHandler(dingBot.MessageScanner)

	/** **/

	if err = session.Open(); err != nil {
		log.Fatalf("Failed to open session: %v", err)
	}

	defer session.Close()
	router.Initialize(session)

	_ = dingBot.FullScan()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop
	<-data.Cache.Stop()
	//.MaxLevels.Cancel()
	log.Println("OS interrupt received, shutting down.")
}

package main

import (
	"flag"
	"log"
	"os"

	"github.com/go-pg/pg/v10"
	migrations "github.com/robinjoseph08/go-pg-migrations/v3"
)

const directory = "migrations"

var dbUrl string

func main() {
	flag.StringVar(&dbUrl, "db", "", "")
	flag.Parse()

	log.Println("Running Migrations...")

	db := pg.Connect(&pg.Options{
		Addr: dbUrl,
	})

	err := migrations.Run(db, directory, os.Args)
	if err != nil {
		log.Fatalln(err)
	}
}

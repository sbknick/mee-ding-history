package main

import (
	"github.com/go-pg/pg/v10/orm"
	migrations "github.com/robinjoseph08/go-pg-migrations/v3"
)

func init() {
	up := func(db orm.DB) error {
		_, err := db.Exec(`
				CREATE TABLE kv (
					key TEXT PRIMARY KEY NOT NULL,
					value TEXT NOT NULL
				)
		`)
		return err
	}

	down := func(db orm.DB) error {
		_, err := db.Exec("DROP TABLE kv")
		return err
	}

	migrations.Register("20210614114752_create_kv_table", up, down, migrations.MigrationOptions{})
}

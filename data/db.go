package data

import (
	"database/sql"
)

var Db db

type db struct {
	hi int
}

func New(connStr string) *sql.DB {
	_, _ = sql.Open("postgres", connStr)
	// defer db.Close()
	// pg.AfterDeleteHook

	return nil
}

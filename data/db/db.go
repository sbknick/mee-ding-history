package db

import (
	"database/sql"
)

func New(connStr string) *sql.DB {
	_, _ = sql.Open("postgres", connStr)
	// defer db.Close()
	// pg.AfterDeleteHook

	return nil
}

package db

import (
	"github.com/go-pg/pg/v10"
	"github.com/go-pg/pg/v10/orm"

	"github.com/sbknick/mee-ding-history/data/models"
)

var db *pg.DB

func Init(connStr string) *pg.DB {
	// d := pg.Connect(&pg.Options{
	// 	User: "postgres",
	// 	Addr: connStr,
	// })
	url, err := pg.ParseURL(connStr)
	if err != nil {
		panic(err)
	}
	d := pg.Connect(url)

	err = createSchema(d)
	if err != nil {
		panic(err)
	}

	db = d

	return nil
}

func GetDing(guildId, userId, level string) (*models.Ding, error) {
	ding := &models.Ding{
		UserID:  userId,
		GuildID: guildId,
		Level:   level,
	}
	err := db.Model(ding).WherePK().Select()
	return ding, err
}

func PutDing(ding *models.Ding) error {
	_, err := db.Model(ding).Insert()
	return err
}

func createSchema(db *pg.DB) error {
	models := []interface{}{
		(*models.Ding)(nil),
	}

	for _, model := range models {
		err := db.Model(model).CreateTable(&orm.CreateTableOptions{
			IfNotExists: true,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

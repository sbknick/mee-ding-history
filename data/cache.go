package data

type dings struct{}

var Dings dings

func (d dings) Get(userId string, level int) *Ding {
	return nil
}

func (d dings) Put()

// func GetDing(userId string, level int) {

// }

func Hydrate() {

}

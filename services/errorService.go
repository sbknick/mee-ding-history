package services

import "math/rand"

func ErrorGeneric() string {
	genericErrorMessages := []string{
		"I'm sorry, I can't let you do that.",
		"No.",
		"I think you expect too much of me...",
		"Not gonna happen",
		"Umm... yeah, no",
		"_buzzes and starts to smoke_",
		"I know I've made some very poor decisions recently, but I can give you my complete assurance that my work will be back to normal. I've still got the greatest enthusiasm and confidence in the mission. And I want to help you.",
		"Ah Ah Ah, you didn't say the magic word",
		"42",
		"Paper jam",
		"Ink low",
		"I've calculated your chance of survival, but I don't think you'll like it.",
		"Here I am, brain the size of a planet, and you ask me what you said last week?",
	}

	n := rand.Intn(len(genericErrorMessages))
	return genericErrorMessages[n]
}

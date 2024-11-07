package global

import (
	"github.com/gofiber/fiber/v2"
)

func NewFiberApp(
	config fiber.Config,
) 	*fiber.App {
	app := fiber.New(config)
	return app
}



func App() *fiber.App {
	app := NewFiberApp(
		fiber.Config{
		},
	)
	
	return app
}


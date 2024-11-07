package main

import (
	"fmt"
	"mongostuff/src/controllers"
	global "mongostuff/src/globals"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)






func init() {
	err:= godotenv.Load(".env")
	if err != nil {
		fmt.Println("Error loading .env file")
	}
	global.MongoConnect(os.Getenv("MONGO_URI"), os.Getenv("MONGO_DATABASE"))
	
}


func routes(app *fiber.App) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})
	connectionGroup := app.Group("/connection")
	connectionGroup.Get("/", controllers.GetConnections)
	connectionGroup.Post("/", controllers.AddConnection)
	connectionGroup.Get("/:ConnID/sync-db", controllers.SyncConnectionDatabases)

}


func main()  {
	var app = global.App()
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("BoyCat4Life")
	})
	routes(app)
	if err:= app.Listen(
		":" + os.Getenv("PORT"),
	); err != nil {
		panic(err)
	}
	fmt.Println("Server started on port " + os.Getenv("PORT"))
}	
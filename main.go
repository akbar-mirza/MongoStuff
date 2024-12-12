package main

import (
	"fmt"
	"log/slog"
	"mongostuff/src/controllers"
	global "mongostuff/src/globals"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		fmt.Println("Error loading .env file")
	}
	global.MongoConnect(os.Getenv("MONGO_URI"), os.Getenv("MONGO_DATABASE"))

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	slog.SetDefault(logger)

}

func routes(app *fiber.App) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})
	app.Get("/test", func(c *fiber.Ctx) error {
		// // Path to the file on the server
		// filePath := "./test.txt"

		// // Set a custom file name for the download
		// c.Set("Content-Disposition", "attachment; filename=\"custom_name.txt\"")

		// Send the file
		return controllers.DownloadSnapshot(c)
	})

	// [Connection Routes]
	connectionGroup := app.Group("/connection")
	connectionGroup.Get("/", controllers.GetConnections)
	connectionGroup.Get("/:ConnID", controllers.GetConnection)
	connectionGroup.Post("/", controllers.AddConnection)
	connectionGroup.Get("/:ConnID/sync-db", controllers.SyncConnectionDatabases)
	connectionGroup.Get("/:ConnID/status", controllers.GetClusterStatus)

	// [Snapshot Routes]
	snapshotGroup := app.Group("/snapshot")
	snapshotGroup.Post("/:ConnID", controllers.TakSnapshot)
	snapshotGroup.Get("/:ConnID", controllers.GetSnapshots)
	snapshotGroup.Get("/:ConnID/:SnapID", controllers.GetSnapshot)
	snapshotGroup.Get("/:ConnID/:SnapID/download", controllers.DownloadSnapshot)
}

func main() {
	var app = global.App()
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("MongoStuff API")
	})
	app.Use(cors.New(cors.Config{
		ExposeHeaders: "Content-Disposition",
		AllowOrigins:  "*",
	}))

	routes(app)
	if err := app.Listen(
		":" + os.Getenv("PORT"),
	); err != nil {
		panic(err)
	}
	fmt.Println("Server started on port " + os.Getenv("PORT"))

}

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

	// if _stuffs/snapshots folder doesn't exist, create it
	if _, err := os.Stat("./_stuffs"); os.IsNotExist(err) {
		err := os.Mkdir("./_stuffs", 0755)
		if err != nil {
			slog.Error("Error creating _stuffs directory", err)
		}
		slog.Info("Created _stuffs/snapshots directory")
		err = os.Mkdir("./_stuffs/snapshots", 0755)
		if err != nil {
			slog.Error("Error creating _stuffs directory", err)
		}
		slog.Info("Created _stuffs/snapshots directory")
	}

}

func routes(app *fiber.App) {

	app.Get("/test", func(c *fiber.Ctx) error {
		// // Path to the file on the server
		// filePath := "./test.txt"

		// // Set a custom file name for the download
		// c.Set("Content-Disposition", "attachment; filename=\"custom_name.txt\"")

		// Send the file
		return controllers.DownloadSnapshot(c)
	})

	api := app.Group("/api")
	api.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("MongoStuff API")
	})
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// [Connection Routes]
	connectionGroup := api.Group("/connection")
	connectionGroup.Get("/", controllers.GetConnections)
	connectionGroup.Get("/:ConnID", controllers.GetConnection)
	connectionGroup.Post("/", controllers.AddConnection)
	connectionGroup.Get("/:ConnID/sync-db", controllers.SyncConnectionDatabases)
	connectionGroup.Get("/:ConnID/status", controllers.GetClusterStatus)

	// [Snapshot Routes]
	snapshotGroup := api.Group("/snapshot")
	snapshotGroup.Post("/:ConnID", controllers.TakSnapshot)
	snapshotGroup.Get("/:ConnID", controllers.GetSnapshots)
	snapshotGroup.Get("/:ConnID/:SnapID", controllers.GetSnapshot)
	snapshotGroup.Get("/:ConnID/:SnapID/download", controllers.DownloadSnapshot)
	snapshotGroup.Patch("/:ConnID/:SnapID/tags", controllers.UpdateSnapshotTags)

	// [Restore Routes]
	restoreGroup := api.Group("/restore")
	restoreGroup.Get("/:ConnID", controllers.GetRestores)
	restoreGroup.Post("/:ConnID/:SnapID", controllers.RestoreSnapshot)
	restoreGroup.Get("/:ConnID/:RestoreID", controllers.GetRestore)

	// Catches all routes not defined
	app.Static("*", "./web/dist", fiber.Static{
		Compress: true,
	})
}

func main() {
	var app = global.App()
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

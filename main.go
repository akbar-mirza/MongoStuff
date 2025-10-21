package main

import (
	"fmt"
	"log/slog"
	"mongostuff/src/controllers"
	global "mongostuff/src/globals"
	"mongostuff/src/middlewares"
	"mongostuff/src/services"
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

	folderRequired := []string{"./_stuffs", "./_stuffs/snapshots", "./_stuffs/backups"}

	// check if folder exists
	for _, folder := range folderRequired {
		if _, err := os.Stat(folder); os.IsNotExist(err) {
			err := os.Mkdir(folder, 0755) // 0755 is the octal representation of rwxr-xr-x
			if err != nil {
				slog.Error("Error creating _stuffs directory", "error", err)
			}
			slog.Info("Created _stuffs/snapshots directory")
		}
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
	connectionGroup := api.Group("/connection", middlewares.Auth)
	connectionGroup.Get("/", controllers.GetConnections)
	connectionGroup.Get("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.GetConnection)
	connectionGroup.Post("/", controllers.AddConnection)
	connectionGroup.Get("/:ConnID/sync-db", middlewares.IsConnectionBelongToUser, controllers.SyncConnectionDatabases)
	connectionGroup.Get("/:ConnID/status", middlewares.IsConnectionBelongToUser, controllers.GetClusterStatus)
	connectionGroup.Patch("/:ConnID/default-storage/:StorageID", middlewares.IsConnectionBelongToUser, controllers.SetDefaultStorageForConnection)

	// [Snapshot Routes]
	snapshotGroup := api.Group("/snapshot", middlewares.Auth)
	snapshotGroup.Post("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.TakSnapshot)
	snapshotGroup.Get("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.GetSnapshots)
	snapshotGroup.Get("/:ConnID/:SnapID", middlewares.IsConnectionBelongToUser, controllers.GetSnapshot)
	snapshotGroup.Get("/:ConnID/:SnapID/download", middlewares.IsConnectionBelongToUser, controllers.DownloadSnapshot)
	snapshotGroup.Patch("/:ConnID/:SnapID/tags", middlewares.IsConnectionBelongToUser, controllers.UpdateSnapshotTags)
	snapshotGroup.Delete("/:ConnID/:SnapID", middlewares.IsConnectionBelongToUser, controllers.DeleteSnapshot)
	snapshotGroup.Get("/:ConnID/:SnapID/download", middlewares.IsConnectionBelongToUser, controllers.DownloadSnapshotFromStorage)

	// [Restore Routes]
	restoreGroup := api.Group("/restore", middlewares.Auth)
	restoreGroup.Get("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.GetRestores)
	restoreGroup.Post("/:ConnID/:SnapID/snapshot", middlewares.IsConnectionBelongToUser, controllers.RestoreSnapshot)
	restoreGroup.Get("/:ConnID/:RestoreID", middlewares.IsConnectionBelongToUser, controllers.GetRestore)
	restoreGroup.Post("/:ConnID/:BackupID/backup", middlewares.IsConnectionBelongToUser, controllers.RestoreBackup)

	// [Auth Routes]
	authGroup := api.Group("/auth")
	authGroup.Post("/login", controllers.Login)
	authGroup.Post("/register", controllers.Register)
	authGroup.Get("/current", controllers.GetCurrentUser)
	authGroup.Delete("/logout", controllers.Logout)

	// [Storage]
	storageGroup := api.Group("/storage", middlewares.Auth)
	storageGroup.Post("/", controllers.CreateStorage)
	storageGroup.Get("/", controllers.ListStorages)
	storageGroup.Get("/:StorageID", controllers.GetStorage)
	storageGroup.Patch("/:StorageID", controllers.UpdateStorage)
	storageGroup.Delete("/:StorageID", controllers.DeleteStorage)
	storageGroup.Patch("/:StorageID/default", controllers.SetDefaultStorage)

	// [Backup Policies]
	backupPolicyGroup := api.Group("/backup-policy", middlewares.Auth)
	backupPolicyGroup.Post("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.CreateBackupPolicy)
	backupPolicyGroup.Get("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.GetBackupPolicies)
	backupPolicyGroup.Get("/:ConnID/:BackupPolicyID", middlewares.IsConnectionBelongToUser, controllers.GetBackupPolicy)
	backupPolicyGroup.Patch("/:ConnID/:BackupPolicyID", middlewares.IsConnectionBelongToUser, controllers.UpdateBackupPolicy)
	backupPolicyGroup.Delete("/:ConnID/:BackupPolicyID", middlewares.IsConnectionBelongToUser, controllers.DeleteBackupPolicy)
	backupPolicyGroup.Put("/:ConnID/:BackupPolicyID/trigger", middlewares.IsConnectionBelongToUser, controllers.TriggerBackup)


	// [Backup]
	backupGroup := api.Group("/backup", middlewares.Auth)
	backupGroup.Get("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.BackupsForConnection)
	backupGroup.Get("/:ConnID/:BackupPolicyID", middlewares.IsConnectionBelongToUser, controllers.BackupsForPolicy)

	// Serve Static Files
	app.Static("/", "./web/dist", fiber.Static{
		Compress: true,
	})

	// To avoid 404 on page refresh
	app.Static("*", "./web/dist", fiber.Static{
		Compress: true,
	})

}

func main() {
	var app = global.App()

	IsDocker := os.Getenv("IS_DOCKER")
	slog.Info("IsDocker", "value", IsDocker)
	if IsDocker != "true" {
		// For Dev When running on local machine
		app.Use(cors.New(cors.Config{
			ExposeHeaders:    "Content-Disposition",
			AllowOrigins:     "http://localhost:27019", //  react vite server
			AllowCredentials: true,                     // Required for cookies to work
		}))
	}

	routes(app)
	services.InitCron()

	if err := app.Listen(
		":" + os.Getenv("PORT"),
	); err != nil {
		panic(err)
	}
	fmt.Println("Server started on port " + os.Getenv("PORT"))
}

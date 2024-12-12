package controllers

import (
	"log/slog"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func TakSnapshot(
	c *fiber.Ctx,
) error {
	ConnID := c.Params("ConnID")

	// Parse the request body
	type Request struct {
		Database    string `json:"database"`
		Compression bool   `json:"compression"`
	}

	body := new(Request)

	if err := c.BodyParser(body); err != nil {
		return err
	}

	snap, err := services.TakSnapshot(
		ConnID,
		body.Database,
		body.Compression,
	)

	if err != nil {
		c.JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message":  "Snapshot has been taken successfully",
		"snapshot": snap,
	})
}

func GetSnapshots(
	c *fiber.Ctx,
) error {
	connID := c.Params("ConnID")
	snaps := services.GetSnapshots(connID)
	return c.JSON(fiber.Map{
		"snapshots": snaps,
	})
}

func GetSnapshot(
	c *fiber.Ctx,
) error {
	SnapID := c.Params("SnapID")

	snap, err := services.GetSnapshot(SnapID)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(snap)
}

func DownloadSnapshot(
	c *fiber.Ctx,
) error {
	SnapID := c.Params("SnapID")
	downloadPath, error := services.DownloadSnapshot(SnapID)
	slog.Info("Downloading Snapshot", "SnapshotID", SnapID, "OutputFile", downloadPath.FilePath, "FileName", downloadPath.FileNameWithExt)
	if error != nil {
		return c.JSON(fiber.Map{
			"error": error.Error(),
		})
	}

	c.Set(fiber.HeaderContentDisposition, "attachment; filename=\""+downloadPath.FileNameWithExt+"\"")

	return c.SendFile(
		downloadPath.FilePath,
	)
}

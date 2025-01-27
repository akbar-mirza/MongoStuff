package controllers

import (
	"log/slog"
	"mongostuff/src/libs"
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
		Collection  string `json:"collection"`
		Compression bool   `json:"compression"`
	}

	body := new(Request)

	if err := c.BodyParser(body); err != nil {
		return err
	}

	snap, err := services.TakSnapshot(
		services.TakSnapshotParams{
			ConnectionID: ConnID,
			Database:     libs.FallBackString(body.Database, ""),
			Collection:   libs.FallBackString(body.Collection, ""),
			Compression:  body.Compression,
		},
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

func UpdateSnapshotTags(
	c *fiber.Ctx,
) error {
	SnapID := c.Params("SnapID")
	var body struct {
		Tags []string `json:"tags"`
	}
	if err := c.BodyParser(&body); err != nil {
		return err
	}
	snap, err := services.UpdateSnapshotTags(
		SnapID,
		body.Tags,
	)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(snap)
}

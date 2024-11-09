package controllers

import (
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func TakSnapshot(
	c *fiber.Ctx,
) error {
	ConnID := c.Params("ConnID")
	Database := c.Params("Database")

	snap, err := services.TakSnapshot(
		ConnID,
		Database,
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

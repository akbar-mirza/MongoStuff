package controllers

import (
	"fmt"
	"mongostuff/src/libs"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func RestoreSnapshot(
	c *fiber.Ctx,
) error {
	connID := c.Params("ConnID")
	snapID := c.Params("SnapID")

	type Request struct {
		Database   string `json:"database"`
		Collection string `json:"collection"`
	}

	body := new(Request)

	if err := c.BodyParser(body); err != nil {
		return err
	}

	fmt.Println(connID, snapID, body)

	err := services.RestoreSnapshot(
		connID,
		snapID,
		libs.FallBackString(
			body.Database,
			"",
		),
		libs.FallBackString(
			body.Collection,
			"",
		),
	)

	if err != nil {
		return c.JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Snapshot restored",
	})

}

func GetRestores(
	c *fiber.Ctx,
) error {
	connID := c.Params("ConnID")
	fmt.Print("Connection ID:", connID)
	snaps := services.GetRestores(connID)
	return c.JSON(fiber.Map{
		"restores": snaps,
	})
}

func GetRestore(
	c *fiber.Ctx,
) error {
	connID := c.Params("ConnID")
	restoreID := c.Params("RestoreID")

	restore := services.GetRestore(
		connID,
		restoreID,
	)

	return c.JSON(restore)
}

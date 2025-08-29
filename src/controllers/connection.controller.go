package controllers

import (
	"log/slog"
	"mongostuff/src/interfaces"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func AddConnection(
	c *fiber.Ctx,
) error {
	// Request body

	var params interfaces.Connection
	if err := c.BodyParser(&params); err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
		return err
	}

	connection := services.AddConnection(
		params,
	)

	return c.JSON(fiber.Map{
		"message":    "Connection added controller",
		"connection": connection,
	})

}

func GetConnections(
	c *fiber.Ctx,
) error {
	UserID := c.Locals("UserID").(string)
	connections := services.GetConnections(UserID)

	slog.Info("UserID", "value", UserID)
	return c.JSON(fiber.Map{
		"connections": connections,
	})
}

func GetConnection(
	c *fiber.Ctx,
) error {
	ConnID := c.Params("ConnID")

	connection, error := services.GetConnection(ConnID)
	if error != nil {
		return c.JSON(fiber.Map{
			"error": error,
		})
	}
	return c.JSON(connection)
}

func SyncConnectionDatabases(
	c *fiber.Ctx,
) error {
	ConnID := c.Params("ConnID")
	Databases := services.SyncConnectionDatabases(ConnID)
	return c.JSON(fiber.Map{
		"databases": Databases,
	})
}

func GetClusterStatus(
	c *fiber.Ctx,
) error {
	ConnID := c.Params("ConnID")
	Status := services.GetClusterStatus(ConnID)
	// return json response
	return c.JSON(fiber.Map{
		"status": Status,
	})
}

func SetDefaultStorageForConnection(
	c *fiber.Ctx,
) error {
	ConnID := c.Params("ConnID")
	StorageID := c.Params("StorageID")
	err := services.SetDefaultStorageForConnection(ConnID, StorageID)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": err,
		})
	}
	return c.JSON(fiber.Map{
		"message": "Default storage set",
	})
}

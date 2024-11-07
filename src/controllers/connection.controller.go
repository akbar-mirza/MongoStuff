package controllers

import (
	"fmt"
	"mongostuff/src/interfaces"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)



func AddConnection(
	c *fiber.Ctx,
) error{
	// Request body
	

	var params interfaces.Connection
	if err := c.BodyParser(&params); err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
		return err
	}

	services.AddConnection(
		params,	
	)




	return c.JSON(fiber.Map{
		"message": "Connection added controller",
		"params": params,
	})
	
}

func GetConnections(
	c *fiber.Ctx,
) error{
	connections := services.GetConnections("admin")
	return c.JSON(fiber.Map{
		"connections": connections,
	})
}

func SyncConnectionDatabases(
	c *fiber.Ctx,
) error{
	ConnID := c.Params("ConnID")
	fmt.Println("Connection ID:", ConnID)
	Databases := services.SyncConnectionDatabases(ConnID)
	return c.JSON(fiber.Map{
		"databases": Databases,
	})
}
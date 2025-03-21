package middlewares

import (
	"log/slog"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func IsConnectionBelongToUser(c *fiber.Ctx) error {
	ConnID := c.Params("ConnID")

	slog.Info("ConnID", "value", ConnID)

	UserID := c.Locals("UserID").(string)

	slog.Info("UserID", "value", UserID)
	conn, err := services.GetConnection(ConnID)

	if err != nil {
		c.Status(404).JSON(fiber.Map{
			"error": "Connection not found",
		})
		return err
	}

	if conn.UserID != UserID {
		c.Status(401).JSON(fiber.Map{
			"error": "Not Authorized",
		})
		return err
	}

	return c.Next()
}

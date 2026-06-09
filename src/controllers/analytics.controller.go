package controllers

import (
	"log/slog"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

// GetConnectionAnalytics returns actual metrics + projections for a single connection
func GetConnectionAnalytics(c *fiber.Ctx) error {
	connectionID := c.Params("ConnID")

	analytics, err := services.GetConnectionAnalytics(connectionID)
	if err != nil {
		slog.Error("Error getting connection analytics", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"analytics": analytics,
	})
}

// GetOverviewAnalytics returns aggregate metrics + projections across all of the user's connections
func GetOverviewAnalytics(c *fiber.Ctx) error {
	userID, ok := c.Locals("UserID").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Not Authorized",
		})
	}

	analytics, err := services.GetOverviewAnalytics(userID)
	if err != nil {
		slog.Error("Error getting overview analytics", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"analytics": analytics,
	})
}

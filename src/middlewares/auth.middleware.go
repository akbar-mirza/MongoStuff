package middlewares

import (
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func Auth(c *fiber.Ctx) error {
	// get header csrf token
	csrfToken := c.Get("X-CSRF-Token")
	// get session token
	sessionToken := c.Cookies("session")

	if csrfToken == "" || sessionToken == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "Not Authorized",
		})
	}

	// slog.Info("sessionToken", "value", sessionToken)
	// slog.Info("csrfToken: ", "value", csrfToken)

	user, err := services.GetCurrentUser(sessionToken, csrfToken)
	if err != nil {
		c.Status(401).JSON(fiber.Map{
			"error": "Not Authorized",
		})
		return err
	}

	c.Locals("UserID", user.UserID)
	return c.Next()
}

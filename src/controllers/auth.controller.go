package controllers

import (
	"mongostuff/src/interfaces"
	"mongostuff/src/services"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
)

func cookieSecure() bool {
	return os.Getenv("COOKIE_SECURE") == "true"
}

func setSessionCookies(c *fiber.Ctx, sessionToken string, csrfToken string, expires time.Time) {
	secure := cookieSecure()

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    sessionToken,
		Expires:  expires,
		Path:     "/",
		HTTPOnly: true,
		SameSite: "Lax",
		Secure:   secure,
	})

	c.Cookie(&fiber.Cookie{
		Name:     "csrf",
		Value:    csrfToken,
		Expires:  expires,
		Path:     "/",
		HTTPOnly: false,
		SameSite: "Lax",
		Secure:   secure,
	})
}

func Register(
	c *fiber.Ctx,
) error {
	// Request body
	var params interfaces.CreateUser
	if err := c.BodyParser(&params); err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": "invalid request body",
		})
		return err
	}

	user, err := services.Register(params)
	if err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
		return err
	}

	setSessionCookies(c, user.SessionToken, user.CSRFToken, time.Now().Add(24*time.Hour))

	return c.JSON(fiber.Map{
		"message": "User created successfully",
		"user":    user,
	})
}

func Login(
	c *fiber.Ctx,
) error {
	// Request body
	var params interfaces.LoginUser
	if err := c.BodyParser(&params); err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
		return err
	}

	user, err := services.Login(params.Username, params.Password)
	if err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	setSessionCookies(c, user.SessionToken, user.CSRFToken, time.Now().Add(24*time.Hour))

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"user":    user,
	})
}

func Logout(
	c *fiber.Ctx,
) error {
	sessionToken := c.Cookies("session")
	if err := services.RevokeSession(sessionToken); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to revoke session",
		})
	}

	setSessionCookies(c, "", "", time.Now().Add(-1*time.Hour))

	return c.JSON(fiber.Map{
		"message": "Logout successful",
	})
}

func GetCurrentUser(
	c *fiber.Ctx,
) error {
	user := c.Locals("User").(interfaces.User)

	return c.JSON(fiber.Map{
		"user": user,
	})
}

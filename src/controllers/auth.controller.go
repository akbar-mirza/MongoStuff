package controllers

import (
	"log/slog"
	"mongostuff/src/interfaces"
	"mongostuff/src/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

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

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    user.SessionToken,
		Expires:  time.Now().Add(24 * time.Hour), // 24 hours
		HTTPOnly: true,
	})

	c.Cookie(&fiber.Cookie{
		Name:     "csrf",
		Value:    user.CSRFToken,
		Expires:  time.Now().Add(24 * time.Hour), // 24 hours
		HTTPOnly: false,
	})

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
			"error": "invalid credentials",
		})
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    user.SessionToken,
		Expires:  time.Now().Add(24 * time.Hour), // 24 hours
		HTTPOnly: true,
	})

	c.Cookie(&fiber.Cookie{
		Name:     "csrf",
		Value:    user.CSRFToken,
		Expires:  time.Now().Add(24 * time.Hour), // 24 hours
		HTTPOnly: false,
	})

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"user":    user,
	})
}

func Logout(
	c *fiber.Ctx,
) error {
	sessionToken := c.Cookies("session")
	csrfToken := c.Cookies("csrf")

	_, err := services.GetCurrentUser(sessionToken, csrfToken)
	if err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": "invalid credentials",
		})
		return err
	}

	_, err = services.GetCurrentUser(sessionToken, csrfToken)
	if err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": "invalid credentials",
		})
		return err
	}

	// remove cookies
	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    "",                             // Empty value
		Expires:  time.Now().Add(-1 * time.Hour), // Expired in the past
		Path:     "/",
		HTTPOnly: true,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     "csrf",
		Value:    "",                             // Empty value
		Expires:  time.Now().Add(-1 * time.Hour), // Expired in the past
		Path:     "/",
		HTTPOnly: false,
		SameSite: "Lax",
	})

	return c.JSON(fiber.Map{
		"message": "Logout successful",
	})
}

func GetCurrentUser(
	c *fiber.Ctx,
) error {
	sessionToken := c.Cookies("session")
	// get header csrf token
	csrfToken := c.Get("X-CSRF-Token")

	slog.Info("sessionToken", "value", sessionToken)
	slog.Info("csrfToken: ", "value", csrfToken)

	user, err := services.GetCurrentUser(sessionToken, csrfToken)
	if err != nil {
		c.Status(400).JSON(fiber.Map{
			"error": "invalid credentials",
		})
		return err
	}

	return c.JSON(fiber.Map{
		"user": user,
	})
}

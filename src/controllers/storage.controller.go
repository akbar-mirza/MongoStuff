package controllers

import (
	"mongostuff/src/interfaces"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

func CreateStorage(c *fiber.Ctx) error {

	body := new(interfaces.Storage)

	UserID := c.Locals("UserID").(string)

	if err := c.BodyParser(body); err != nil {
		return err
	}

	storage, err := services.CreateStorage(
		services.CreateStorageParams{
			Name:    body.Name,
			Type:    body.Type,
			Storage: body.Storage,
			UserID:  UserID,
		},
	)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message": "Storage created",
		"storage": storage,
	})
}

func UpdateStorage(
	c *fiber.Ctx,
) error {
	body := new(interfaces.Storage)
	UserID := c.Locals("UserID").(string)
	StorageID := c.Params("StorageID")
	body.StorageID = StorageID
	if err := c.BodyParser(body); err != nil {
		c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request",
		})
		return err
	}
	storage, err := services.UpdateStorage(
		services.UpdateStorageParams{
			StorageID: body.StorageID,
			Name:      body.Name,
			Type:      body.Type,
			Storage:   body.Storage,
			UserID:    UserID,
		},
	)

	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message": "Storage updated",
		"storage": storage,
	})
}

func GetStorage(
	c *fiber.Ctx,
) error {
	StorageID := c.Params("StorageID")
	UserID := c.Locals("UserID").(string)
	storage, err := services.GetStorage(
		services.GetStorageParams{
			StorageID: StorageID,
			UserID:    UserID,
		},
	)
	if err != nil {
		c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Internal server error",
		})
		return err
	}
	return c.JSON(storage)
}

func ListStorages(
	c *fiber.Ctx,
) error {
	UserID := c.Locals("UserID").(string)
	storages, err := services.ListStorages(
		services.ListStoragesParams{
			UserID: UserID,
		},
	)
	if err != nil {
		c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Internal server error",
		})
	}

	return c.JSON(storages)
}

func DeleteStorage(
	c *fiber.Ctx,
) error {
	StorageID := c.Params("StorageID")
	UserID := c.Locals("UserID").(string)
	err := services.DeleteStorage(
		services.DeleteStorageParams{
			StorageID: StorageID,
			UserID:    UserID,
		},
	)
	if err != nil {
		c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Internal server error",
		})
	}
	return c.JSON(fiber.Map{
		"message": "Storage deleted",
	})
}

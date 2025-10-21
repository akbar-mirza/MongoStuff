package controllers

import (
	"log/slog"
	"mongostuff/src/interfaces"
	"mongostuff/src/services"

	"github.com/gofiber/fiber/v2"
)

// CreateBackupPolicy creates a new backup policy
func CreateBackupPolicy(c *fiber.Ctx) error {
	// Parse the request body
	var body interfaces.BackupPolicy
	if err := c.BodyParser(&body); err != nil {
		slog.Error("Error parsing request body", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	body.ConnectionID = c.Params("ConnID")

	// Create the backup policy
	backupPolicy, err := services.CreateBackUpPolicy(body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Add the backup policy to the cron scheduler if it's active
	if backupPolicy.Status == "Active" {
		services.AddBackupToCron(backupPolicy.BackupPolicyID)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":      "Backup policy created successfully",
		"backupPolicy": backupPolicy,
	})
}

// GetBackupPolicy gets a backup policy by ID
func GetBackupPolicy(c *fiber.Ctx) error {
	backupPolicyID := c.Params("BackupPolicyID")

	backupPolicy, err := services.GetBackUpPolicy(backupPolicyID, nil)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Backup policy not found",
		})
	}

	return c.JSON(fiber.Map{
		"backupPolicy": backupPolicy,
	})
}

// GetBackupPolicies gets all backup policies for a connection
func GetBackupPolicies(c *fiber.Ctx) error {
	connectionID := c.Params("ConnID")

	backupPolicies, err := services.GetBackUpPolicies(services.GetBackUpPoliciesParams{
		ConnectionID: &connectionID,
		Status:       nil,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"backupPolicies": backupPolicies,
	})
}

// GetAllBackupPolicies gets all backup policies
func GetAllBackupPolicies(c *fiber.Ctx) error {
	backupPolicies, err := services.GetBackUpPolicies(services.GetBackUpPoliciesParams{
		ConnectionID: nil,
		Status:       nil,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"backupPolicies": backupPolicies,
	})
}

// UpdateBackupPolicy updates a backup policy
func UpdateBackupPolicy(c *fiber.Ctx) error {
	backupPolicyID := c.Params("BackupPolicyID")
	connectionID := c.Params("ConnID")

	// Get the existing backup policy
	existingPolicy, err := services.GetBackUpPolicy(backupPolicyID, nil)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Backup policy not found",
		})
	}

	// Parse the request body
	var body interfaces.BackupPolicy
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Ensure the ID remains the same
	body.BackupPolicyID = backupPolicyID
	body.ConnectionID = connectionID

	// Update the backup policy
	updatedPolicy, err := services.UpdateBackUpPolicy(backupPolicyID, body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}


	// Handle cron job updates based on status changes
	if existingPolicy.Status != updatedPolicy.Status {
		if updatedPolicy.Status == "Active" {
			services.AddBackupToCron(backupPolicyID)
		} else {
			services.RemoveBackupFromCron(backupPolicyID)
		}
	} else if updatedPolicy.Status == "Active" &&
		(existingPolicy.Interval != updatedPolicy.Interval ||
			existingPolicy.TimeUnit != updatedPolicy.TimeUnit) {
		// If schedule changed but still active, update the cron job
		services.RemoveBackupFromCron(backupPolicyID)
		services.AddBackupToCron(backupPolicyID)
	}

	return c.JSON(fiber.Map{
		"message":      "Backup policy updated successfully",
		"backupPolicy": updatedPolicy,
	})
}

// DeleteBackupPolicy deletes a backup policy
func DeleteBackupPolicy(c *fiber.Ctx) error {
	backupPolicyID := c.Params("BackupPolicyID")

	// Delete the backup policy
	deletedPolicy, err := services.DeleteBackUpPolicy(backupPolicyID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Backup policy not found",
		})
	}

	// Remove from cron scheduler
	services.RemoveBackupFromCron(backupPolicyID)

	return c.JSON(fiber.Map{
		"message":      "Backup policy deleted successfully",
		"backupPolicy": deletedPolicy,
	})
}

// TriggerBackup manually triggers a backup for a policy
func TriggerBackup(c *fiber.Ctx) error {
	backupPolicyID := c.Params("BackupPolicyID")
	connectionID := c.Params("ConnID")

	// Check if the backup policy exists
	_, err := services.GetBackUpPolicy(backupPolicyID, &connectionID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Backup policy not found",
		})
	}

	// Process the backup
	isTriggered := true
	go services.ProcessBackUp(backupPolicyID, &isTriggered)

	return c.JSON(fiber.Map{
		"message": "Backup process started",
	})
}

// BackupsForPolicy gets all backups for a backup policy for a connection
func BackupsForPolicy(c *fiber.Ctx) error {
	backupPolicyID := c.Params("BackupPolicyID")
	connectionID := c.Params("ConnID")

	backups, err := services.GetBackUpLogs(backupPolicyID, connectionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"backups": backups,
	})
}

func BackupsForConnection(c *fiber.Ctx) error {
	connectionID := c.Params("ConnID")

	backups, err := services.GetAllLogs(connectionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"backups": backups,
	})
}

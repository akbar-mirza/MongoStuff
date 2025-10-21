package interfaces

type BackupPolicy struct {
	Interval       int    `json:"interval"`  // Frequency
	TimeUnit       string `json:"timeUnit"`  // Time unit (minutes, hours, days)
	Keep           int    `json:"keep"`      // Number of backups
	Retention      int    `json:"retention"` // Number of days
	Name           string `json:"name"`
	Status         string `json:"status"`      // Active or Inactive
	Compression    bool   `json:"compression"` // Compress backups
	ConnectionID   string `json:"connectionID"`
	StorageID      string `json:"storageID"`
	BackupPolicyID string `json:"backupPolicyID"`

	// Data Control
	IsClusterBackup bool   `json:"isClusterBackup"`
	Database        string `json:"database"`
	Collection      string `json:"collection"`
	IsDeleted       bool   `json:"isDeleted"`
	NextRun         int64  `json:"nextRun"` // Unix timestamp of next run
}

// System Backup Logs
type Backup struct {
	BackupID       string   `json:"backupID"`
	Timestamp      int64    `json:"timestamp"`
	Status         string   `json:"status"`
	BackupPolicyID string   `json:"backupPolicyID"`
	Logs           string   `json:"logs"`
	Duration       int64    `json:"duration"`
	Size           int64    `json:"size"`
	Artifact       Artifact `json:"artifact"`
	StorageID      string   `json:"storageID"`
	IsDeleted      bool     `json:"isDeleted"`
	ToBeDeletedAt  int64    `json:"toBeDeletedAt"` // Unix timestamp of deletion
	IsTriggered    bool     `json:"isTriggered"`
}


type BackupWithPolicyName struct {
	BackupID       string   `json:"backupID"`
	Timestamp      int64    `json:"timestamp"`
	Status         string   `json:"status"`
	BackupPolicyID string   `json:"backupPolicyID"`
	Logs           string   `json:"logs"`
	Duration       int64    `json:"duration"`
	Size           int64    `json:"size"`
	Artifact       Artifact `json:"artifact"`
	StorageID      string   `json:"storageID"`
	IsDeleted      bool     `json:"isDeleted"`
	ToBeDeletedAt  int64    `json:"toBeDeletedAt"` // Unix timestamp of deletion
	PolicyName     string   `json:"policyName"`
}
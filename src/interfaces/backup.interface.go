package interfaces

type BackupPolicy struct {
	Interval     int    `json:"interval"`  // Frequency
	Keep         int    `json:"keep"`      // Number of backups
	Retention    int    `json:"retention"` // Number of days
	Name         string `json:"name"`
	Status       string `json:"status"`      // Active or Inactive
	Compression  bool   `json:"compression"` // Compress backups
	ConnectionID string `json:"connectionID"`
	StorageID    string `json:"storageID"`
	BackupID     string `json:"backupID"`

	// Data Control
	IsClusterBackup bool   `json:"isClusterBackup"`
	Database        string `json:"database"`
	Collection      string `json:"collection"`
}

type Backup struct {
	BackupID  string `json:"backupID"`
	Timestamp int64  `json:"timestamp"`
	Status    string `json:"status"`
	Logs      string `json:"logs"`
	Duration  int64  `json:"duration"`
	Size      int64  `json:"size"`
}

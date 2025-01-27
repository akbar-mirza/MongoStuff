package interfaces

type RestoreType string

type Restore struct {
	RestoreType         RestoreType `json:"type"` // Snapshot or Restore
	Timestamp           int64       `json:"timestamp"`
	ConnectionID        string      `json:"connectionID"`
	SnapshotID          string      `json:"snapshotID"`
	RestoreConnectionID string      `json:"restoreConnectionID"`
	BackupID            string      `json:"backupID"`
	Logs                string      `json:"logs"`
	Status              string      `json:"status"`
	Duration            int64       `json:"duration"`
	RestoreID           string      `json:"restoreID"`
	// User Controlled
	Database   string `json:"database"`
	Collection string `json:"collection"`

	RestoreToDiffConnection bool `json:"restoreToDiffConnection"`
}

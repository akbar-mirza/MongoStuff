package interfaces

type Snapshot struct {
	ConnectionID      string `json:"connectionID"`
	IsClusterSnapshot bool   `json:"isClusterSnapshot"`
	SnapshotID        string `json:"snapshotID"`
	Database          string `json:"database"`
	// MongoDB Timestamp
	Timestamp   int64  `json:"timestamp"`
	Status      string `json:"status"`
	Logs        string `json:"logs"`
	Duration    int64  `json:"duration"`
	Size        int64  `json:"size"`
	Compression bool   `json:"compression"`
}

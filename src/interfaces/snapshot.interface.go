package interfaces

type Artifact struct {
	URL     string `json:"url"`
	Key     string `json:"key"`
	Expires *int64 `json:"expires,omitempty"` // optional
}

type Snapshot struct {
	ConnectionID      string `json:"connectionID"`
	IsClusterSnapshot bool   `json:"isClusterSnapshot"`
	SnapshotID        string `json:"snapshotID"`
	Database          string `json:"database"`
	Collection        string `json:"collection"`
	// MongoDB Timestamp
	Timestamp   int64    `json:"timestamp"`
	Status      string   `json:"status"`
	Logs        string   `json:"logs"`
	Duration    int64    `json:"duration"`
	Size        int64    `json:"size"`
	Compression bool     `json:"compression"`
	Tags        []string `json:"tags"`
	Artifact    Artifact `json:"artifact"`
	StorageID   string   `json:"storageID"`
}

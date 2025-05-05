package interfaces

import "time"

// Enum for storage type
type StorageType string

const (
	Local StorageType = "local"
	S3    StorageType = "s3"
	R2    StorageType = "r2"
)

type StorageUnion struct {
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
	Folder    string `json:"folder"`
}

type Storage struct {
	Name      string       `json:"name"`
	Type      StorageType  `json:"type"`
	StorageID string       `json:"storageID"`
	CreatedAt time.Time    `json:"createdAt"`
	Storage   StorageUnion `json:"storage"`
	UserID    string       `json:"userID"`
}

type LocalStorage struct {
	Storage
	Path string `json:"path"`
}

type S3Storage struct {
	Storage
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
	Folder    string `json:"folder"`
}

type R2Storage struct {
	Storage
	Endpoint  string `json:"endpoint"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
	Folder    string `json:"folder"`
}

type StorageInterface interface {
	GetStorage() Storage
	SetStorage(storage Storage)
}

func (s Storage) GetStorage() Storage {
	return s
}
func (s Storage) SetStorage(storage Storage) {
	s = storage
}

// example
/*
var storage Storage
storage.SetStorage(LocalStorage{
	Storage: Storage{
		Type: Local,
	},
	Path: "/Users/akbarmirza/Desktop/Projects/MongoStuff/storage",
})

storage.SetStorage(S3Storage{
	Storage: Storage{
		Type: S3,
	},
	Bucket: "mongostuff",
	Region: "us-east-1",
})

storage.SetStorage(R2Storage{
	Storage: Storage{
		Type: R2, }, Endpoint: "https://s3.us-east-1.wasabisys.com",
})
*/

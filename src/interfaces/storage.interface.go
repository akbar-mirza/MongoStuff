package interfaces

// Enum for storage type
type StorageType string

const (
	Local StorageType = "local"
	S3    StorageType = "s3"
	R2    StorageType = "r2"
)

type Storage struct {
	Type StorageType `json:"type"`
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
}

type R2Storage struct {
	Storage
	Endpoint  string `json:"endpoint"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
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

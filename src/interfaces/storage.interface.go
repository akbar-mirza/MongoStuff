package interfaces

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

// StorageType enum
type StorageType string

const (
	Local StorageType = "local"
	S3    StorageType = "s3"
	R2    StorageType = "r2"
)

// Base Storage definition
type Storage struct {
	Name      string       `json:"name"`
	Type      StorageType  `json:"type"`
	StorageID string       `json:"storageID"`
	CreatedAt time.Time    `json:"createdAt"`
	Storage   StorageUnion `json:"storage"`
	UserID    string       `json:"userID"`
	IsDefault bool         `json:"isDefault"`

	adapter StorageAdapter // the adapter instance
}

// Shared configuration for all storage types
type StorageUnion struct {
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
	Folder    string `json:"folder"`
	Endpoint  string `json:"endpoint"` // R2 or custom S3-compatible
}

type ArtifactUnion struct {
	URL     string `json:"url"`
	Key     string `json:"key"`
	Expires *int64 `json:"expires,omitempty"` // optional
}

// ===================
// StorageAdapter Interface
// ===================
type StorageAdapter interface {
	UploadFile(path string, content []byte) (ArtifactUnion, error)
	DownloadFile(path string) ([]byte, error)
	DeleteFile(path string) error
	GetURL(key string) string
}

// ===================
// Local Storage Adapter
// ===================
type LocalStorageAdapter struct {
	Path string
}

func (l *LocalStorageAdapter) UploadFile(path string, content []byte) (ArtifactUnion, error) {
	// fullPath := l.Path + "/" + path
	// return os.WriteFile(fullPath, content, 0644)
	// Create the directory if it doesn't exist
	return ArtifactUnion{}, nil
}

func (l *LocalStorageAdapter) DownloadFile(path string) ([]byte, error) {
	fullPath := l.Path + "/" + path
	return os.ReadFile(fullPath)
}

func (l *LocalStorageAdapter) DeleteFile(path string) error {
	fullPath := l.Path + "/" + path
	return os.Remove(fullPath)
}

func (l *LocalStorageAdapter) GetURL(key string) string {
	// Construct the URL for the object in the local folder
	return ""
}

// ===================
// S3 Storage Adapter
// ===================
type S3StorageAdapter struct {
	Bucket  string
	Region  string
	Folder  string
	Session *session.Session
}

func NewS3Adapter(config StorageUnion) *S3StorageAdapter {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(config.Region),
		Credentials: credentials.NewStaticCredentials(
			config.AccessKey,
			config.SecretKey,
			"",
		),
	})
	if err != nil {
		log.Fatal("Unable to create AWS session: ", err)
	}

	return &S3StorageAdapter{
		Bucket:  config.Bucket,
		Region:  config.Region,
		Folder:  config.Folder,
		Session: sess,
	}
}

func (s *S3StorageAdapter) PreSignedURL(key string, expires int64) (string, error) {
	// Create a new S3 session
	svc := s3.New(s.Session)
	req, _ := svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(key),
	})

	// Generate presigned URL with expiration time
	url, err := req.Presign(time.Duration(expires) * time.Second)
	if err != nil {
		return "", fmt.Errorf("error generating presigned URL: %v", err)
	}

	return url, nil
}

func (s *S3StorageAdapter) GetURL(key string) string {
	// Construct the URL for the object in the S3 bucket
	return ""
}

func (s *S3StorageAdapter) UploadFile(path string, content []byte) (ArtifactUnion, error) {
	// log s struct
	fmt.Printf("S3 Storage Adapter: %+v\n", s)
	fmt.Printf("Uploading %s to S3 bucket %s\n", path, s.Bucket)
	// implement using s3manager.Uploader if needed
	// Create an uploader instance
	uploader := s3manager.NewUploader(s.Session)

	key := s.Folder + "/" + path
	// Upload the file to S3
	upload, uploadErr := uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(content),
	})

	if uploadErr != nil {
		fmt.Println("Error uploading file to S3: ", uploadErr)
		return ArtifactUnion{}, uploadErr
	}

	fmt.Printf("File uploaded to %s\n", upload.Location)

	// PreSigned URL 1 week
	expires := time.Now().Add(7 * 24 * time.Hour).Unix()
	url, err := s.PreSignedURL(key, expires)

	if err != nil {
		fmt.Println("Error generating presigned URL: ", err)
		return ArtifactUnion{}, err
	}

	return ArtifactUnion{
		URL:     url,
		Key:     key,
		Expires: &expires,
	}, nil
}

func (s *S3StorageAdapter) DownloadFile(path string) ([]byte, error) {
	fmt.Printf("Downloading %s from S3 bucket %s\n", path, s.Bucket)
	return nil, nil
}

func (s *S3StorageAdapter) DeleteFile(path string) error {
	fmt.Printf("Deleting %s from S3 bucket %s\n", path, s.Bucket)
	return nil
}

// ===================
// R2 Storage Adapter (S3-Compatible)
// ===================
type R2StorageAdapter struct {
	Bucket   string
	Endpoint string
	Folder   string
	Session  *session.Session
}

func NewR2Adapter(config StorageUnion) *R2StorageAdapter {
	sess, err := session.NewSession(&aws.Config{
		Region:           aws.String(config.Region),
		Endpoint:         aws.String(config.Endpoint),
		S3ForcePathStyle: aws.Bool(true),
		Credentials: credentials.NewStaticCredentials(
			config.AccessKey,
			config.SecretKey,
			"",
		),
	})
	if err != nil {
		log.Fatal("Unable to create R2 session: ", err)
	}

	return &R2StorageAdapter{
		Bucket:   config.Bucket,
		Endpoint: config.Endpoint,
		Folder:   config.Folder,
		Session:  sess,
	}
}

func (r *R2StorageAdapter) UploadFile(path string, content []byte) (ArtifactUnion, error) {
	fmt.Printf("Uploading %s to R2 bucket %s\n", path, r.Bucket)
	return ArtifactUnion{}, nil
}

func (r *R2StorageAdapter) DownloadFile(path string) ([]byte, error) {
	fmt.Printf("Downloading %s from R2 bucket %s\n", path, r.Bucket)
	return nil, nil
}

func (r *R2StorageAdapter) DeleteFile(path string) error {
	fmt.Printf("Deleting %s from R2 bucket %s\n", path, r.Bucket)
	return nil
}

func (r *R2StorageAdapter) GetURL(key string) string {
	// Construct the URL for the object in the R2 bucket
	return ""
}

// ===================
// Factory to set adapter
// ===================
func (s *Storage) InitAdapter() error {
	switch s.Type {
	case Local:
		s.adapter = &LocalStorageAdapter{Path: s.Storage.Folder}
	case S3:
		s.adapter = NewS3Adapter(s.Storage)
	case R2:
		s.adapter = NewR2Adapter(s.Storage)
	default:
		return fmt.Errorf("unknown storage type: %s", s.Type)
	}
	return nil
}

// ===================
// Unified API via Storage
// ===================
func (s *Storage) UploadFile(path string, content []byte) (ArtifactUnion, error) {
	if s.adapter == nil {
		if err := s.InitAdapter(); err != nil {
			return ArtifactUnion{}, err
		}
	}
	return s.adapter.UploadFile(path, content)
}

func (s *Storage) DownloadFile(path string) ([]byte, error) {
	if s.adapter == nil {
		if err := s.InitAdapter(); err != nil {
			return nil, err
		}
	}
	return s.adapter.DownloadFile(path)
}

func (s *Storage) DeleteFile(path string) error {
	if s.adapter == nil {
		if err := s.InitAdapter(); err != nil {
			return err
		}
	}
	return s.adapter.DeleteFile(path)
}

func (s *Storage) GetURL(key string) string {
	if s.adapter == nil {
		if err := s.InitAdapter(); err != nil {
			return ""
		}
	}
	return s.adapter.GetURL(key)
}

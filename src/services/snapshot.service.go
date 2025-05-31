package services

import (
	"context"
	"fmt"
	"log/slog"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"
	"mongostuff/src/sdk"
	"os"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TakSnapshotParams struct {
	ConnectionID string
	Database     string
	Collection   string
	Compression  bool
}

/*
Process snpashot asynchronously with goroutines
*/
func ProcessSnapshot(
	snapshotID string,
) {
	slog.Info("Processing snapshot", snapshotID)
	var Collection = global.GetCollection(global.SnapshotsCollection)
	snapshot, err := GetSnapshot(snapshotID)
	if err != nil {
		fmt.Println("Error getting snapshot")
		fmt.Println(err)
		return
	}

	connection, err := GetConnection(
		snapshot.ConnectionID,
	)

	unixString := strconv.FormatInt(snapshot.Timestamp, 10)

	fmt.Println("Snapshot ID:", snapshotID)
	outputFile := "./_stuffs/snapshots" + "/" + snapshotID + "_" + unixString

	// resolve path for windows support

	if snapshot.Compression {
		outputFile += ".gz"
	}

	// Calculate duration
	startTime := time.Now()

	// Update status to processing
	_, err = Collection.UpdateOne(
		context.TODO(),
		bson.M{
			"snapshotID": snapshotID,
		},
		bson.M{
			"$set": bson.M{
				"status": "Processing",
			},
		},
	)
	dumpRes := sdk.Dump(
		sdk.MongoDump{
			URI:         connection.URI,
			Database:    snapshot.Database,
			Collection:  snapshot.Collection,
			OutputDir:   outputFile,
			Compression: snapshot.Compression,
		},
	)

	// End time
	endTime := time.Now()
	duration := endTime.Sub(startTime)

	var status = func() string {
		if dumpRes.ErrorStr != "" {
			return "Failed"
		}
		return "Success"
	}()

	var size int64 = 0
	if status != "Failed" {
		fmt.Println("Calculating directory size", outputFile)
		dirSize, err := libs.CalDirSize(outputFile)
		if err != nil {
			fmt.Println("Error calculating directory size")
			fmt.Println(err)
		}
		size = dirSize.Size
	}

	slog.Info("Saving snapshot to storage")
	storage, err := GetDefaultStorage(
		GetDefaultStorageParams{
			UserID: connection.UserID,
		},
	)

	slog.Info("Storage:", storage)

	if err != nil {
		fmt.Println("Error getting storage")
		fmt.Println(err)
		return
	}

	storagInstance := interfaces.Storage{
		Type:    storage.Type,
		Storage: storage.Storage,
	}

	fileBtes, err := os.ReadFile(outputFile)
	if err != nil {
		fmt.Println("Error reading file")
		fmt.Println(err)
		return
	}

	var ArtifactUnion interfaces.Artifact
	if storage.IsDefault {
		artifact, err := storagInstance.UploadFile(
			snapshotID,
			fileBtes,
		)

		if err != nil {
			fmt.Println("Error uploading file")
			fmt.Println(err)
			return
		}

		ArtifactUnion = interfaces.Artifact{
			URL:     artifact.URL,
			Key:     artifact.Key,
			Expires: artifact.Expires,
		}

		// Delete file
		defer os.Remove(outputFile)

	}

	_, err = Collection.UpdateOne(
		context.TODO(),
		bson.M{
			"snapshotID": snapshotID,
		},
		bson.M{
			"$set": bson.M{
				"status":    status,
				"logs":      libs.FallBackString(dumpRes.ErrorStr, dumpRes.Output),
				"duration":  duration.Milliseconds(), // Duration in milliseconds,
				"size":      size,
				"artifact":  ArtifactUnion,
				"storageID": storage.StorageID,
			},
		},
	)
}

func TakeSnapshotAsyc(params TakSnapshotParams) (interfaces.Snapshot, error) {
	var Collection = global.GetCollection(global.SnapshotsCollection)

	_, err := GetConnection(
		params.ConnectionID,
	)
	if err != nil {
		return interfaces.Snapshot{}, err
	}
	timeStamp := time.Now().UnixMilli()

	snapshotID := libs.RandomString("snap_", 12)

	fmt.Println("Snapshot ID:", snapshotID)

	var isClusterSnapshot = libs.If(params.Database == "", true, false)

	var snapShotParams = interfaces.Snapshot{
		ConnectionID:      params.ConnectionID,
		IsClusterSnapshot: isClusterSnapshot,
		SnapshotID:        snapshotID,
		Database:          params.Database,
		Collection:        params.Collection,
		Timestamp:         timeStamp,
		Status:            "Queued",
		Logs:              "",
		Duration:          0, // Duration in milliseconds
		Size:              0, // Size in bytes
		Compression:       params.Compression,
	}

	_, err = Collection.InsertOne(
		context.TODO(),
		bson.M{
			"connectionID":      snapShotParams.ConnectionID,
			"isClusterSnapshot": snapShotParams.IsClusterSnapshot,
			"snapshotID":        snapShotParams.SnapshotID,
			"database":          snapShotParams.Database,
			"collection":        snapShotParams.Collection,
			"timestamp":         snapShotParams.Timestamp,
			"status":            snapShotParams.Status,
			"logs":              snapShotParams.Logs,
			"duration":          snapShotParams.Duration,
			"size":              snapShotParams.Size,
			"compression":       snapShotParams.Compression,
		},
	)

	if err != nil {
		return snapShotParams, err
	}

	go ProcessSnapshot(snapshotID)

	return snapShotParams, nil
}

func TakSnapshot(params TakSnapshotParams) (interfaces.Snapshot, error) {
	var Collection = global.GetCollection(global.SnapshotsCollection)

	connection, err := GetConnection(
		params.ConnectionID,
	)
	if err != nil {
		return interfaces.Snapshot{}, err
	}
	timeStamp := time.Now().UnixMilli()
	unixString := strconv.FormatInt(timeStamp, 10)

	snapshotID := libs.RandomString("snap_", 12)
	fmt.Println("Snapshot ID:", snapshotID)
	outputFile := "./_stuffs/snapshots" + "/" + snapshotID + "_" + unixString

	// resolve path for windows support

	if params.Compression {
		outputFile += ".gz"
	}

	// Calculate duration
	startTime := time.Now()
	dumpRes := sdk.Dump(
		sdk.MongoDump{
			URI:         connection.URI,
			Database:    params.Database,
			Collection:  params.Collection,
			OutputDir:   outputFile,
			Compression: params.Compression,
		},
	)

	// End time
	endTime := time.Now()
	duration := endTime.Sub(startTime)

	var status = func() string {
		if dumpRes.ErrorStr != "" {
			return "Failed"
		}
		return "Success"
	}()

	var isClusterSnapshot = libs.If(params.Database == "", true, false)

	var size int64 = 0
	if status != "Failed" {
		fmt.Println("Calculating directory size", outputFile)
		dirSize, err := libs.CalDirSize(outputFile)
		if err != nil {
			fmt.Println("Error calculating directory size")
			fmt.Println(err)
		}
		size = dirSize.Size
	}

	var snapShotParams = interfaces.Snapshot{
		ConnectionID:      params.ConnectionID,
		IsClusterSnapshot: isClusterSnapshot,
		SnapshotID:        snapshotID,
		Database:          params.Database,
		Collection:        params.Collection,
		Timestamp:         timeStamp,
		Status:            status,
		Logs:              libs.FallBackString(dumpRes.ErrorStr, dumpRes.Output),
		Duration:          duration.Milliseconds(), // Duration in milliseconds
		Size:              size,                    // Size in bytes
		Compression:       params.Compression,
	}

	slog.Info("Saving snapshot to storage")
	storage, err := GetDefaultStorage(
		GetDefaultStorageParams{
			UserID: connection.UserID,
		},
	)

	slog.Info("Storage:", storage)

	storagInstance := interfaces.Storage{
		Type:    storage.Type,
		Storage: storage.Storage,
	}

	fileBtes, err := os.ReadFile(outputFile)
	if err != nil {
		return snapShotParams, err
	}

	// Upload file
	if storage.IsDefault {
		artifact, err := storagInstance.UploadFile(
			snapshotID,
			fileBtes,
		)

		if err != nil {
			return snapShotParams, err
		}

		snapShotParams.Artifact = interfaces.Artifact{
			URL:     artifact.URL,
			Key:     artifact.Key,
			Expires: artifact.Expires,
		}

		// Delete file
		defer os.Remove(outputFile)
	}

	_, err = Collection.InsertOne(
		context.TODO(),
		bson.M{
			"connectionID":      snapShotParams.ConnectionID,
			"isClusterSnapshot": snapShotParams.IsClusterSnapshot,
			"snapshotID":        snapShotParams.SnapshotID,
			"database":          snapShotParams.Database,
			"collection":        snapShotParams.Collection,
			"timestamp":         snapShotParams.Timestamp,
			"status":            snapShotParams.Status,
			"logs":              snapShotParams.Logs,
			"duration":          snapShotParams.Duration,
			"size":              snapShotParams.Size,
			"compression":       snapShotParams.Compression,
			"artifact":          snapShotParams.Artifact,
			"storageID":         storage.StorageID,
		},
	)

	if err != nil {
		return snapShotParams, err
	}

	return snapShotParams, nil
}

func GetSnapshots(
	connectionID string,
) interface{} {
	fmt.Println("Connection ID:", connectionID)
	var Collection = global.GetCollection(global.SnapshotsCollection)
	var snapshots []interfaces.Snapshot
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{"connectionID": connectionID},
		options.Find().SetProjection(bson.M{"logs": 0}).SetSort(bson.M{"_id": -1}),
	)
	if err != nil {
		fmt.Println("Error getting snapshots")
		fmt.Println(err)
		return err
	}
	if err = cursor.All(context.TODO(), &snapshots); err != nil {
		fmt.Println("Error getting snapshots")
		fmt.Println(err)
		return err
	}
	return snapshots
}

func GetSnapshot(
	snapshotID string,
) (
	interfaces.Snapshot,
	error,
) {
	var Collection = global.GetCollection(global.SnapshotsCollection)
	var snapshot interfaces.Snapshot
	err := Collection.FindOne(
		context.TODO(),
		bson.M{"snapshotID": snapshotID},
	).Decode(&snapshot)
	if err != nil {
		fmt.Println("Error getting snapshot")
		fmt.Println(err)
		return snapshot, err
	}

	return snapshot, nil
}

// download output interface
type DownloadSnapshotRes struct {
	FileName        string
	FilePath        string
	FileExt         string
	FileNameWithExt string
}

func DownloadSnapshot(
	snapshotID string,
) (
	DownloadSnapshotRes, error) {
	snapshot, err := GetSnapshot(snapshotID)

	if err != nil {
		fmt.Println("Error getting snapshot")
		fmt.Println(err)
		return DownloadSnapshotRes{
			FileName:        "",
			FilePath:        "",
			FileExt:         "",
			FileNameWithExt: "",
		}, err
	}
	fileName := snapshotID + "_" + strconv.FormatInt(snapshot.Timestamp, 10)
	outputFile := "./_stuffs/snapshots" + "/" + fileName

	ext := ""
	if snapshot.Compression {
		outputFile += ".gz"
		ext = ".gz"
	}

	return DownloadSnapshotRes{
		FileName:        fileName,
		FilePath:        outputFile,
		FileExt:         ext,
		FileNameWithExt: fileName + ext,
	}, nil
}

func UpdateSnapshotTags(
	snapshotID string,
	tags []string,
) (
	interfaces.Snapshot,
	error,
) {
	var Collection = global.GetCollection(global.SnapshotsCollection)
	var snapshot interfaces.Snapshot
	err := Collection.FindOneAndUpdate(
		context.TODO(),
		bson.M{"snapshotID": snapshotID},
		bson.M{"$set": bson.M{"tags": tags}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&snapshot)
	if err != nil {
		fmt.Println("Error updating snapshot tags")
		fmt.Println(err)
		return interfaces.Snapshot{}, err
	}
	return snapshot, nil
}

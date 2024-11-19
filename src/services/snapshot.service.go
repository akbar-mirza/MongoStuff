package services

import (
	"context"
	"fmt"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"
	"mongostuff/src/sdk"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TakSnapshot(
	connectionID string,
	databaseName string,
	compression bool,
) (interfaces.Snapshot, error) {
	var Collection = global.GetCollection(global.SnapshotsCollection)

	connection, err := GetConnection(
		connectionID,
	)
	if err != nil {
		return interfaces.Snapshot{}, err
	}
	timeStamp := time.Now().UnixMilli()
	unixString := strconv.FormatInt(timeStamp, 10)

	snapshotID := libs.RandomString("snap_", 12)
	fmt.Println("Snapshot ID:", snapshotID)
	outputFile := ".stuffs/snapshots" + "/" + snapshotID + "_" + unixString

	if compression {
		outputFile += ".gz"
	}

	// Calculate duration
	startTime := time.Now()
	dumpRes := sdk.Dump(
		sdk.MongoDump{
			URI:         connection.URI,
			Database:    databaseName,
			OutputDir:   outputFile,
			Compression: compression,
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

	var isClusterSnapshot = libs.If(databaseName == "", true, false)

	var size int64 = 0
	if status != "Failed" {
		dirSize, err := libs.CalDirSize(outputFile)
		if err != nil {
			fmt.Println("Error calculating directory size")
			fmt.Println(err)
		}
		size = dirSize.Size
	}

	var snapShotParams = interfaces.Snapshot{
		ConnectionID:      connectionID,
		IsClusterSnapshot: isClusterSnapshot,
		SnapshotID:        snapshotID,
		Database:          databaseName,
		Timestamp:         timeStamp,
		Status:            status,
		Logs:              libs.FallBackString(dumpRes.ErrorStr, dumpRes.Output),
		Duration:          duration.Milliseconds(), // Duration in milliseconds
		Size:              size,                    // Size in bytes
		Compression:       compression,
	}

	_, err = Collection.InsertOne(
		context.TODO(),
		bson.M{
			"connectionID":      snapShotParams.ConnectionID,
			"isClusterSnapshot": snapShotParams.IsClusterSnapshot,
			"snapshotID":        snapShotParams.SnapshotID,
			"database":          snapShotParams.Database,
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

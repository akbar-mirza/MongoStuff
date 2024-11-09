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
)

func TakSnapshot(
	connectionID string,
	databaseName string,
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

	// Calculate duration
	startTime := time.Now()
	dumpRes := sdk.Dump(
		sdk.MongoDump{
			URI:       connection.URI,
			Database:  databaseName,
			OutputDir: outputFile,
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

	var snapShotParams = interfaces.Snapshot{
		ConnectionID:      connectionID,
		IsClusterSnapshot: isClusterSnapshot,
		SnapshotID:        snapshotID,
		Database:          databaseName,
		Timestamp:         timeStamp,
		Status:            status,
		Logs:              libs.FallBackString(dumpRes.ErrorStr, dumpRes.Output),
		Duration:          duration.Milliseconds(),
	}

	_, err = Collection.InsertOne(
		context.TODO(),
		snapShotParams,
	)

	if err != nil {
		return snapShotParams, err
	}

	return snapShotParams, nil
}

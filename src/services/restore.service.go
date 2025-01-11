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

func RestoreSnapshot(
	connectionID string,
	snapshotID string,
	database string,
	collection string,
) error {

	var Collection = global.GetCollection(global.RestoresCollection)
	snapshot, err := GetSnapshot(snapshotID)
	connection, err := GetConnection(connectionID)

	if err != nil {
		return err
	}

	fileName := snapshotID + "_" + strconv.FormatInt(snapshot.Timestamp, 10)
	outputFile := ".stuffs/snapshots" + "/" + fileName

	// Calculate duration
	startTime := time.Now()
	restoreRes := sdk.Restore(
		sdk.MongoRestore{
			URI:        connection.URI,
			Database:   snapshot.Database,
			BackupPath: outputFile,
			IsCompress: snapshot.Compression,
		},
	)

	endTime := time.Now()
	duration := endTime.UnixMilli() - startTime.UnixMilli()

	var status = func() string {
		if restoreRes.ErrorStr != "" {
			return "Failed"
		}
		return "Success"
	}()

	var restoreParams = interfaces.Restore{
		Timestamp:           time.Now().UnixMilli(),
		ConnectionID:        connectionID,
		RestoreConnectionID: connectionID,
		SnapshotID:          snapshotID,
		Logs:                libs.FallBackString(restoreRes.ErrorStr, restoreRes.Output),
		Status:              status,
		Duration:            duration,
		Database:            libs.FallBackString(database, snapshot.Database),
		Collection:          collection,
		RestoreID:           libs.RandomString("restore_", 12),
	}

	_, err = Collection.InsertOne(
		context.TODO(),
		bson.M{
			"connectionID":        restoreParams.ConnectionID,
			"restoreConnectionID": restoreParams.RestoreConnectionID,
			"snapshotID":          restoreParams.SnapshotID,
			"database":            restoreParams.Database,
			"collection":          restoreParams.Collection,
			"timestamp":           restoreParams.Timestamp,
			"status":              restoreParams.Status,
			"logs":                restoreParams.Logs,
			"duration":            restoreParams.Duration,
			"restoreID":           restoreParams.RestoreID,
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func GetRestores(
	connectionID string,
) interface{} {
	var Collection = global.GetCollection(global.RestoresCollection)
	var restores []interfaces.Restore
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{"connectionID": connectionID},
		options.Find().SetProjection(bson.M{"logs": 0}).SetSort(bson.M{"_id": -1}),
	)
	if err != nil {
		fmt.Println("Error getting restores")
		fmt.Println(err)
		return err
	}
	if err = cursor.All(context.TODO(), &restores); err != nil {
		fmt.Println("Error getting restores")
		fmt.Println(err)
		return err
	}
	return restores
}

func GetRestore(
	connectionID string,
	restoreID string,
) interface{} {
	var Collection = global.GetCollection(global.RestoresCollection)
	var restore interfaces.Restore
	err := Collection.FindOne(
		context.TODO(),
		bson.M{"restoreID": restoreID,
			"connectionID": connectionID},
	).Decode(&restore)
	if err != nil {
		fmt.Println("Error getting restore")
		fmt.Println(err)
		return err
	}
	return restore
}

package services

import (
	"context"
	"fmt"
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

func RestoreSnapshot(
	connectionID string,
	snapshotID string,
	sourceDatabase string,
	targetDatabase string,
	collection string,
	update bool,
) error {

	var Collection = global.GetCollection(global.RestoresCollection)
	snapshot, snap_err := GetSnapshotForConnection(connectionID, snapshotID)
	connection, conn_err := GetConnection(connectionID)

	if snap_err != nil {
		return snap_err
	}
	if conn_err != nil {
		return conn_err
	}

	fileName := snapshotID + "_" + strconv.FormatInt(snapshot.Timestamp, 10)
	outputFile := "./_stuffs/snapshots" + "/" + fileName
	if snapshot.StorageID != "" {
		fmt.Println("StorageID: ", snapshot.StorageID)
		storage, err := GetStorageByID(
			GetStorageByIDParams{
				StorageID: snapshot.StorageID,
			},
		)
		artifact := interfaces.ArtifactUnion{
			Key:     snapshot.Artifact.Key,
			Expires: snapshot.Artifact.Expires,
			URL:     snapshot.Artifact.URL,
		}

		outputPath := outputFile
		if snapshot.Compression {
			outputPath += ".gz"
		}
		// downlooad the file
		down, err := storage.DownloadFile(artifact, outputPath)
		if err != nil {
			return err
		}

		isExpired := down.Expires != nil && time.Now().Unix() > *artifact.Expires
		// update snapshot with new url
		if isExpired {
			fmt.Println("URL expired, updating snapshot with new URL")
			artifact.URL = down.URL
			// update snapshot
			_, err := Collection.UpdateOne(
				context.TODO(),
				bson.M{"snapshotID": snapshotID},
				bson.M{"$set": bson.M{"artifact": artifact}},
			)
			if err != nil {
				return err
			}
		}
		fmt.Println("Downloaded file from storage")

		defer os.Remove(outputPath)
	}

	// Calculate duration
	startTime := time.Now()
	restoreRes := sdk.Restore(
		sdk.MongoRestore{
			URI:            connection.URI,
			SourceDatabase: libs.FallBackString(sourceDatabase, snapshot.Database),
			TargetDatabase: libs.FallBackString(targetDatabase, ""),
			Collection:     libs.FallBackString(collection, snapshot.Collection),
			BackupPath:     outputFile,
			IsCompress:     snapshot.Compression,
			Update:         update || false,
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
		Timestamp:               time.Now().UnixMilli(),
		ConnectionID:            connectionID,
		RestoreConnectionID:     connectionID,
		SnapshotID:              snapshotID,
		Logs:                    libs.FallBackString(restoreRes.ErrorStr, restoreRes.Output),
		Status:                  status,
		Duration:                duration,
		Database:                libs.FallBackString(sourceDatabase, snapshot.Database),
		TargetDatabase:          targetDatabase,
		Collection:              collection,
		RestoreID:               libs.RandomString("restore_", 12),
		RestoreToDiffConnection: snapshot.ConnectionID != connectionID,
	}

	_, err := Collection.InsertOne(
		context.TODO(),
		bson.M{
			"connectionID":            restoreParams.ConnectionID,
			"restoreConnectionID":     restoreParams.RestoreConnectionID,
			"snapshotID":              restoreParams.SnapshotID,
			"database":                restoreParams.Database,
			"targetDatabase":          restoreParams.TargetDatabase,
			"collection":              restoreParams.Collection,
			"timestamp":               restoreParams.Timestamp,
			"status":                  restoreParams.Status,
			"logs":                    restoreParams.Logs,
			"duration":                restoreParams.Duration,
			"restoreID":               restoreParams.RestoreID,
			"restoreToDiffConnection": restoreParams.RestoreToDiffConnection,
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func RestoreBackup(
	connectionID string,
	backupID string,
	sourceDatabase string,
	targetDatabase string,
	collection string,
	update bool,
) error {
	var Collection = global.GetCollection(global.RestoresCollection)
	backup, backup_err := GetBackupForConnection(connectionID, backupID)
	var backupPolicy interfaces.BackupPolicy
	backupPolicy, backupPolicy_err := GetBackUpPolicy(backup.BackupPolicyID, nil)
	if backupPolicy_err != nil {
		return backupPolicy_err
	}
	connection, conn_err := GetConnection(connectionID)

	if backup_err != nil {
		return backup_err
	}
	if conn_err != nil {
		return conn_err
	}

	fileName := backupID + "_" + strconv.FormatInt(backup.Timestamp, 10)
	outputFile := "./_stuffs/backups" + "/" + fileName
	if backup.StorageID != "" {
		fmt.Println("StorageID: ", backup.StorageID)
		storage, err := GetStorageByID(
			GetStorageByIDParams{
				StorageID: backup.StorageID,
			},
		)
		outputPath := outputFile
		if backupPolicy.Compression {
			outputPath += ".gz"
		}
		down, err := storage.DownloadFile(interfaces.ArtifactUnion(backup.Artifact), outputPath)
		if err != nil {
			return err
		}

		isExpired := down.Expires != nil && time.Now().Unix() > *backup.Artifact.Expires
		// update snapshot with new url
		if isExpired {
			fmt.Println("URL expired, updating snapshot with new URL")
			backup.Artifact.URL = down.URL
			// update snapshot
			_, err := Collection.UpdateOne(
				context.TODO(),
				bson.M{"backupID": backupID},
				bson.M{"$set": bson.M{"artifact": backup.Artifact}},
			)
			if err != nil {
				return err
			}
		}
		fmt.Println("Downloaded file from storage")

		defer os.Remove(outputPath)
	}

	// Calculate duration
	startTime := time.Now()
	restoreRes := sdk.Restore(
		sdk.MongoRestore{
			URI:            connection.URI,
			SourceDatabase: libs.FallBackString(sourceDatabase, backupPolicy.Database),
			TargetDatabase: libs.FallBackString(targetDatabase, ""),
			Collection:     libs.FallBackString(collection, backupPolicy.Collection),
			BackupPath:     outputFile,
			IsCompress:     backupPolicy.Compression,
			Update:         update || false,
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
		Timestamp:               time.Now().UnixMilli(),
		ConnectionID:            connectionID,
		RestoreConnectionID:     connectionID,
		BackupID:                backupID,
		Logs:                    libs.FallBackString(restoreRes.ErrorStr, restoreRes.Output),
		Status:                  status,
		Duration:                duration,
		Database:                libs.FallBackString(sourceDatabase, backupPolicy.Database),
		TargetDatabase:          targetDatabase,
		Collection:              collection,
		RestoreID:               libs.RandomString("restore_", 12),
		RestoreToDiffConnection: backupPolicy.ConnectionID != connectionID,
	}

	_, err := Collection.InsertOne(
		context.TODO(),
		bson.M{
			"connectionID":            restoreParams.ConnectionID,
			"restoreConnectionID":     restoreParams.RestoreConnectionID,
			"backupID":                restoreParams.BackupID,
			"database":                restoreParams.Database,
			"targetDatabase":          restoreParams.TargetDatabase,
			"collection":              restoreParams.Collection,
			"timestamp":               restoreParams.Timestamp,
			"status":                  restoreParams.Status,
			"logs":                    restoreParams.Logs,
			"duration":                restoreParams.Duration,
			"restoreID":               restoreParams.RestoreID,
			"restoreToDiffConnection": restoreParams.RestoreToDiffConnection,
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

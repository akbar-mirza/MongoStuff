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

// BackUp Policy CRUD
func CreateBackUpPolicy(
	params interfaces.BackupPolicy,
) (interfaces.BackupPolicy, error) {

	var Collection = global.GetCollection(global.BackupPoliciesCollection)

	params.BackupPolicyID = libs.RandomString("backup_pol_", 12)

	_, err := Collection.InsertOne(
		context.TODO(),
		bson.M{
			"name":            params.Name,
			"interval":        params.Interval,
			"timeUnit":        params.TimeUnit,
			"keep":            params.Keep,
			"retention":       params.Retention,
			"status":          params.Status,
			"compression":     params.Compression,
			"connectionID":    params.ConnectionID,
			"storageID":       params.StorageID,
			"backupPolicyID":  params.BackupPolicyID,
			"isClusterBackup": params.IsClusterBackup,
			"database":        params.Database,
			"collection":      params.Collection,
		},
	)

	if err != nil {
		return interfaces.BackupPolicy{}, err
	}

	return params, nil
}

func GetBackUpPolicy(
	backupPolicyID string,
	connectionID *string,
) (
	interfaces.BackupPolicy,
	error,
) {
	var Collection = global.GetCollection(global.BackupPoliciesCollection)

	filter := bson.M{
		"backupPolicyID": backupPolicyID,
	}
	if connectionID != nil {
		filter["connectionID"] = *connectionID
	}

	backupPolicy := interfaces.BackupPolicy{}
	err := Collection.FindOne(
		context.TODO(),
		filter,
	).Decode(&backupPolicy)

	if err != nil {
		return interfaces.BackupPolicy{}, err
	}

	return backupPolicy, nil
}

type GetBackUpPoliciesParams struct {
	ConnectionID *string
	Status       *string
}

func GetBackUpPolicies(params GetBackUpPoliciesParams) (
	[]interfaces.BackupPolicy,
	error,
) {
	filter := bson.M{}
	if params.ConnectionID != nil {
		filter["connectionID"] = *params.ConnectionID
	}
	if params.Status != nil {
		filter["status"] = *params.Status
	}
	var Collection = global.GetCollection(global.BackupPoliciesCollection)

	backupPolicies := []interfaces.BackupPolicy{}
	cursor, err := Collection.Find(
		context.TODO(),
		filter,
	)
	if err != nil {
		return []interfaces.BackupPolicy{}, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var backupPolicy interfaces.BackupPolicy
		err := cursor.Decode(&backupPolicy)
		if err != nil {
			return []interfaces.BackupPolicy{}, err
		}
		backupPolicies = append(backupPolicies, backupPolicy)
	}

	return backupPolicies, nil
}

func UpdateBackUpPolicy(
	backupPolicyID string,
	params interfaces.BackupPolicy,
) (
	interfaces.BackupPolicy,
	error,
) {
	var Collection = global.GetCollection(global.BackupPoliciesCollection)

	// Use custom marshaler
	updateParams, err := libs.MarshalWithJSONTags(params)

	backupPolicy := interfaces.BackupPolicy{}
	err = Collection.FindOneAndUpdate(
		context.TODO(),
		bson.M{
			"backupPolicyID": backupPolicyID,
		},
		bson.M{
			"$set": updateParams,
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&backupPolicy)

	if err != nil {
		return interfaces.BackupPolicy{}, err
	}

	return backupPolicy, nil
}

func UpdateBackUpPolicyNextRun(backupPolicyID string) {
	var Collection = global.GetCollection(global.BackupPoliciesCollection)

	// First, get the backup policy to access its interval and timeUnit
	backupPolicy, err := GetBackUpPolicy(backupPolicyID, nil)
	if err != nil {
		fmt.Println("Error getting backup policy for next run calculation")
		fmt.Println(err)
		return
	}

	// Calculate next run time using the actual backup policy data
	nextRun := time.Now().UnixMilli() + int64(backupPolicy.Interval)*libs.ParseTimeUnitToMilli(libs.TimeUnit(backupPolicy.TimeUnit))

	// Update the next run time
	err = Collection.FindOneAndUpdate(
		context.TODO(),
		bson.M{
			"backupPolicyID": backupPolicyID,
		},
		bson.M{
			"$set": bson.M{
				"nextRun": nextRun,
			},
		},
	).Err()
	if err != nil {
		fmt.Println("Error updating backup policy next run")
		fmt.Println(err)
		return
	}
}

func DeleteBackUpPolicy(
	backupPolicyID string,
	forceDelete *bool,
) (
	interfaces.BackupPolicy,
	error,
) {
	var Collection = global.GetCollection(global.BackupPoliciesCollection)

	if forceDelete != nil && *forceDelete {
		err := Collection.FindOneAndDelete(
			context.TODO(),
			bson.M{
				"backupPolicyID": backupPolicyID,
			},
		).Err()
		if err != nil {
			return interfaces.BackupPolicy{}, err
		}
	}

	backupPolicy := interfaces.BackupPolicy{}
	err := Collection.FindOneAndUpdate(
		context.TODO(),
		bson.M{
			"backupPolicyID": backupPolicyID,
		},
		bson.M{
			"$set": bson.M{
				"isDeleted": true,
				"Status":    "Inactive",
			},
		},
	).Decode(&backupPolicy)

	if err != nil {
		return interfaces.BackupPolicy{}, err
	}

	return backupPolicy, nil
}

// BackUp Retrieval Logs
func GetBackUpLogs(
	connectionID string,
	backupPolicyID string,
) (
	[]interfaces.Backup,
	error,
) {
	var Collection = global.GetCollection(global.BackupsCollection)

	_, err := GetBackUpPolicy(backupPolicyID, &connectionID)
	if err != nil {
		return []interfaces.Backup{}, err
	}

	backups := []interfaces.Backup{}
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{
			"backupPolicyID": backupPolicyID,
		},
	)
	if err != nil {
		return []interfaces.Backup{}, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var backup interfaces.Backup
		err := cursor.Decode(&backup)
		if err != nil {
			return []interfaces.Backup{}, err
		}
		backups = append(backups, backup)
	}

	return backups, nil
}

func GetAllLogs(
	connectionID string,
	limit *int,
	skip *int,
) (
	[]interfaces.BackupWithPolicyName,
	int64,
	error,
) {
	var Collection = global.GetCollection(global.BackupsCollection)
	var BackupPolicyCollection = global.GetCollection(global.BackupPoliciesCollection)

	// policyid for connectionID
	backupPolicyIDs, err := BackupPolicyCollection.Distinct(
		context.TODO(),
		"backupPolicyID",
		bson.M{
			"connectionID": connectionID,
		},
	)
	if err != nil {
		return []interfaces.BackupWithPolicyName{}, 0, err
	}

	matchFilter := bson.M{
		"backupPolicyID": bson.M{"$in": backupPolicyIDs},
	}

	total, err := Collection.CountDocuments(context.TODO(), matchFilter)
	if err != nil {
		return []interfaces.BackupWithPolicyName{}, 0, err
	}

	pipeline := []bson.M{
		{"$match": matchFilter},
		{
			"$lookup": bson.M{
				"from":         global.BackupPoliciesCollection,
				"localField":   "backupPolicyID",
				"foreignField": "backupPolicyID",
				"as":           "backupPolicy",
			},
		},
		{
			"$addFields": bson.M{
				"policyName": bson.M{"$arrayElemAt": bson.A{"$backupPolicy.name", 0}},
			},
		},
		{"$unset": "logs"},
		{
			"$sort": bson.M{
				"timestamp": -1,
			},
		},
	}

	if *skip > 0 {
		pipeline = append(pipeline, bson.M{"$skip": int64(*skip)})
	}
	if *limit > 0 {
		pipeline = append(pipeline, bson.M{"$limit": int64(*limit)})
	}

	backups := []interfaces.BackupWithPolicyName{}
	cursor, err := Collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return []interfaces.BackupWithPolicyName{}, 0, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var backup interfaces.BackupWithPolicyName
		err := cursor.Decode(&backup)
		if err != nil {
			return []interfaces.BackupWithPolicyName{}, 0, err
		}
		backups = append(backups, backup)
	}

	return backups, total, nil
}

func GetBackup(backupID string) (interfaces.Backup, error) {
	var Collection = global.GetCollection(global.BackupsCollection)
	backup := interfaces.Backup{}
	err := Collection.FindOne(
		context.TODO(),
		bson.M{"backupID": backupID},
	).Decode(&backup)
	if err != nil {
		return interfaces.Backup{}, err
	}
	return backup, nil
}

func GetBackupForConnection(connectionID string, backupID string) (interfaces.Backup, error) {
	backup, err := GetBackup(backupID)
	if err != nil {
		return interfaces.Backup{}, err
	}

	backupPolicy, err := GetBackUpPolicy(backup.BackupPolicyID, &connectionID)
	if err != nil {
		return interfaces.Backup{}, err
	}

	if backupPolicy.ConnectionID != connectionID {
		return interfaces.Backup{}, fmt.Errorf("backup not found")
	}

	return backup, nil
}

// BackUp CRON & Process
func AddBackupToCron(backupPolicyID string) {
	fmt.Println("Adding backup policy to cron", backupPolicyID)
	backupPolicy, err := GetBackUpPolicy(backupPolicyID, nil)
	if err != nil {
		fmt.Println("Error getting backup policy")
		fmt.Println(err)
		return
	}

	cronExpr, err := libs.UnitToCron(backupPolicy.Interval, libs.TimeUnit(backupPolicy.TimeUnit))
	fmt.Printf("Cron Expression: %s\n", cronExpr)
	if err != nil {
		fmt.Println("Error converting time unit to cron expression")
		fmt.Println(err)
		return
	}

	fmt.Printf("Cron Expression: %s\n", cronExpr)
	// add backup policy to cron
	SCHEDULER.AddJob(backupPolicyID, cronExpr, func() {
		fmt.Println("Running backup policy", backupPolicyID)
		ProcessBackUp(backupPolicyID, nil)
	})
	if err != nil {
		fmt.Println("Error adding backup policy to cron")
		fmt.Println(err)
		return
	}
}

func RemoveBackupFromCron(backupPolicyID string) {
	fmt.Println("Removing backup policy from cron", backupPolicyID)
	// remove backup policy from cron
	SCHEDULER.RemoveJob(backupPolicyID)
}

func InitCron() {
	fmt.Println("Initializing cron")
	// get all backup policies
	backupPolicies, err := GetBackUpPolicies(GetBackUpPoliciesParams{
		ConnectionID: nil,
		Status:       nil,
	})
	if err != nil {
		fmt.Println("Error getting backup policies")
		fmt.Println(err)
		return
	}

	// add backup policy to cron
	for _, backupPolicy := range backupPolicies {
		if backupPolicy.Status == "Active" {
			AddBackupToCron(backupPolicy.BackupPolicyID)
		}
	}

	fmt.Printf("Added %d backup policies to cron\n", len(backupPolicies))

	// start cron
	SCHEDULER.Start()

	deleteCronExp, err := libs.UnitToCron(1, libs.Hour)
	// add delete old backups to every hour
	SCHEDULER.AddJob("delete_old_backups", deleteCronExp,
		func() {
			DeleteBackupsByRetention(nil)
		},
	)
}

func ProcessBackUp(backupPolicyID string, isTriggered *bool) {
	backupPolicy, err := GetBackUpPolicy(backupPolicyID, nil)
	if err != nil {
		return
	}
	outputFile := "./_stuffs/backups" + "/" + backupPolicy.BackupPolicyID + "_" + strconv.FormatInt(time.Now().Unix(), 10)

	connection, err := GetConnection(backupPolicy.ConnectionID)

	if err != nil {
		fmt.Println("Error getting connection")
		fmt.Println(err)
		return
	}

	var BackUpCollection = global.GetCollection(global.BackupsCollection)

	backupID := libs.RandomString("backup_", 16)

	// Insert backup record
	_, err = BackUpCollection.InsertOne(
		context.TODO(),
		bson.M{
			"backupID":       backupID,
			"backupPolicyID": backupPolicy.BackupPolicyID,
			"timestamp":      time.Now().UnixMilli(),
			"status":         "Running",
			"logs":           "Backup process started",
			"duration":       0,
			"size":           0,
			"artifact":       interfaces.Artifact{},
			"storageID":      backupPolicy.StorageID,
			"isTriggered":    isTriggered,
		},
	)

	startTime := time.Now()

	dumpRes := sdk.Dump(
		sdk.MongoDump{
			URI:         connection.URI,
			Database:    backupPolicy.Database,
			Collection:  backupPolicy.Collection,
			OutputDir:   outputFile,
			Compression: backupPolicy.Compression,
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
	var storageConfig interfaces.Storage

	// When connection has DefaultStorageID, use it
	if connection.DefaultStorageID != "" {
		fmt.Println("Default storage ID:", connection.DefaultStorageID)
		getStorage, err := GetStorage(
			GetStorageParams{
				StorageID: connection.DefaultStorageID,
				UserID:    connection.UserID,
			},
		)
		fmt.Println("Storage:==>", getStorage)
		if err != nil {
			fmt.Println("Error getting storage")
			fmt.Println(err)
			return
		}
		storageConfig = getStorage
	}

	//	If connection has no default storage ID, use the global default storage
	if connection.DefaultStorageID == "" {
		fmt.Println("No default storage ID")
		defaultStorage, err := GetDefaultStorage(
			GetDefaultStorageParams{
				UserID: connection.UserID,
			},
		)
		if err != nil {
			fmt.Println("Error getting default storage")
			fmt.Println(err)
			return
		}
		storageConfig = defaultStorage
	}

	if err != nil {
		fmt.Println("Error getting storage")
		fmt.Println(err)
		return
	}

	storageInstance := interfaces.Storage{
		Type:      storageConfig.Type,
		StorageID: storageConfig.StorageID,
		Storage:   storageConfig.Storage,
	}

	fileBtes, err := os.ReadFile(outputFile)
	if err != nil {
		fmt.Println("Error reading file")
		fmt.Println(err)
		return
	}

	var ArtifactUnion interfaces.Artifact
	if storageInstance.StorageID != "" {
		artifact, err := storageInstance.UploadFile(
			backupPolicy.BackupPolicyID+"_"+strconv.FormatInt(time.Now().Unix(), 10),
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

	// Calculate to be deleted at Rentention is N of Days
	toBeDeletedAt := time.Now().UnixMilli() + int64(backupPolicy.Retention)*24*60*60*1000 // Retention in milliseconds
	if backupPolicy.Retention == 0 {
		toBeDeletedAt = 0
	}
	// Save backup to DB
	backup := interfaces.Backup{
		BackupID:       backupID,
		Timestamp:      time.Now().UnixMilli(),
		Status:         status,
		BackupPolicyID: backupPolicy.BackupPolicyID,
		Logs:           libs.FallBackString(dumpRes.ErrorStr, dumpRes.Output),
		Duration:       duration.Milliseconds(), // Duration in milliseconds,
		Size:           size,
		Artifact:       ArtifactUnion,
		StorageID:      storageInstance.StorageID,
		IsDeleted:      false,
		ToBeDeletedAt:  toBeDeletedAt, // Retention in seconds
	}

	_, err = BackUpCollection.UpdateOne(
		context.TODO(),
		bson.M{
			"backupID": backupID,
		},
		bson.M{
			"$set": bson.M{
				"status":        backup.Status,
				"logs":          backup.Logs,
				"duration":      backup.Duration,
				"size":          backup.Size,
				"artifact":      backup.Artifact,
				"storageID":     backup.StorageID,
				"toBeDeletedAt": backup.ToBeDeletedAt,
			},
		},
	)
	if err != nil {
		fmt.Println("Error saving backup to DB")
		fmt.Println(err)
		return
	}

	if isTriggered == nil {
		go UpdateBackUpPolicyNextRun(backupPolicyID)
	}
}

func DeleteBackupByKeep(backupPolicyID string) {
	var Collection = global.GetCollection(global.BackupsCollection)

	policy, err := GetBackUpPolicy(backupPolicyID, nil)
	if err != nil {
		fmt.Println("Error getting backup policy")
		fmt.Println(err)
		return
	}

	// get all the backups for the policy
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{"backupPolicyID": backupPolicyID},
		&options.FindOptions{
			Projection: bson.M{"backupID": 1, "timestamp": 1},
			Sort:       bson.M{"timestamp": 1},
		},
	)

	if err != nil {
		fmt.Println("Error getting backups")
		fmt.Println(err)
		return
	}

	// Get all the backups
	var backups []bson.M
	if err = cursor.All(context.TODO(), &backups); err != nil {
		fmt.Println("Error getting backups")
		fmt.Println(err)
		return
	}

	// Delete all backups except the last N
	for i := 0; i < len(backups)-policy.Keep; i++ {
		backupID := backups[i]["backupID"].(string)
		fmt.Println("Deleting backup", backupID)
		DeleteBackup(backupID)
	}

}

func DeleteBackup(backupID string) {
	var Collection = global.GetCollection(global.BackupsCollection)
	// Get Backup
	backup, err := GetBackup(backupID)
	if err != nil {
		fmt.Println("Error getting backup")
		fmt.Println(err)
		return
	}

	// Delete snapshot from storage
	if backup.Artifact.Key != "" {
		storage, err := GetStorageByID(
			GetStorageByIDParams{
				StorageID: backup.StorageID,
			},
		)
		if err != nil {
			fmt.Println("Error getting storage")
			fmt.Println(err)
			return
		}
		err = storage.DeleteFile(backup.Artifact.Key)
		if err != nil {
			fmt.Println("Error deleting file")
			fmt.Println(err)
			return
		}
	}

	// Delete backup from DB
	_, err = Collection.DeleteOne(
		context.TODO(),
		bson.M{
			"backupID": backupID,
		},
	)
	if err != nil {
		fmt.Println("Error deleting backup")
		fmt.Println(err)
		return
	}
	fmt.Println("Backup deleted", backupID)
}

func DeleteBackupsByRetention(
	connectionID *string,
) ([]string, error) {
	var BackUpCollection = global.GetCollection(global.BackupsCollection)
	var BackUpPolicyCollection = global.GetCollection(global.BackupPoliciesCollection)

	filter := bson.M{
		"toBeDeletedAt": bson.M{
			"$ne": 0,
			"$lt": time.Now().UnixMilli(),
		},
	}

	if connectionID == nil {
		// get all the backupPolicy ids in BackUpPolicyCollection
		backupPoliciesIDs, err := BackUpPolicyCollection.Distinct(
			context.TODO(),
			"backupPolicyID",
			bson.M{
				"connectionID": connectionID,
			},
		)

		if err != nil {
			fmt.Println("Error getting backup policies")
			fmt.Println(err)
			return []string{}, err
		}

		filter["backupPolicyID"] = bson.M{"$in": backupPoliciesIDs}

	}

	// Only get backups that are past the retention date and select backupId
	cursor, err := BackUpCollection.Find(
		context.TODO(),
		filter,
		&options.FindOptions{
			Projection: bson.M{"backupID": 1},
		},
	)

	if err != nil {
		fmt.Println("Error getting backups")
		fmt.Println("Error:", err)
		return []string{}, err
	}
	backupIds := []string{}
	for cursor.Next(context.TODO()) {
		var backup interfaces.Backup
		err := cursor.Decode(&backup)
		if err != nil {
			fmt.Println("Error decoding backup")
			fmt.Println(err)
			return []string{}, err
		}
		fmt.Println("Deleting backup", backup.BackupID)
		backupIds = append(backupIds, backup.BackupID)
		go DeleteBackup(backup.BackupID)
	}

	return backupIds, nil
}

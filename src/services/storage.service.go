package services

import (
	"context"
	"fmt"
	"log/slog"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CreateStorageParams struct {
	Name    string
	Type    interfaces.StorageType
	Storage interfaces.StorageUnion
	UserID  string
}

func CreateStorage(params CreateStorageParams) (interfaces.Storage, error) {
	var Collection = global.GetCollection(global.StoragesCollection)

	var storageParams = interfaces.Storage{
		Name:      params.Name,
		Type:      params.Type,
		Storage:   params.Storage,
		CreatedAt: time.Now(),
		StorageID: libs.RandomString("storage_", 12),
		UserID:    params.UserID,
	}

	_, err := Collection.InsertOne(
		context.TODO(),
		bson.M{
			"name":      storageParams.Name,
			"type":      storageParams.Type,
			"storageID": storageParams.StorageID,
			"createdAt": storageParams.CreatedAt,
			"storage":   storageParams.Storage,
			"userID":    storageParams.UserID,
		},
	)

	if err != nil {
		fmt.Println("Error creating storage")
		fmt.Println(err)
		return interfaces.Storage{}, err
	}

	return storageParams, nil
}

type UpdateStorageParams struct {
	StorageID string
	Name      string
	Type      interfaces.StorageType
	Storage   interface{}
	UserID    string
}

func UpdateStorage(params UpdateStorageParams) (interfaces.Storage, error) {
	slog.Info("Updating storage", "params", fmt.Sprintf("%+v", params))
	var Collection = global.GetCollection(global.StoragesCollection)
	var storage interfaces.Storage
	err := Collection.FindOneAndUpdate(
		context.TODO(),
		bson.M{
			"storageID": params.StorageID,
			"userID":    params.UserID,
		},
		bson.M{
			"$set": bson.M{
				"name":      params.Name,
				"type":      params.Type,
				"storageID": params.StorageID,
				"storage":   params.Storage,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&storage)

	if err != nil {
		return interfaces.Storage{}, err
	}

	return storage, nil
}

type GetStorageParams struct {
	StorageID string
	UserID    string
}

func GetStorage(params GetStorageParams) (interfaces.Storage, error) {
	var Collection = global.GetCollection(global.StoragesCollection)
	var storage interfaces.Storage
	err := Collection.FindOne(
		context.TODO(),
		bson.M{
			"storageID": params.StorageID,
		},
	).Decode(&storage)
	if err != nil {
		return interfaces.Storage{}, err
	}

	return storage, nil
}

type GetStorageByIDParams struct {
	StorageID string
}

// Internal Service Use Only
func GetStorageByID(params GetStorageByIDParams) (interfaces.Storage, error) {
	var Collection = global.GetCollection(global.StoragesCollection)
	var storage interfaces.Storage
	err := Collection.FindOne(
		context.TODO(),
		bson.M{
			"storageID": params.StorageID,
		},
	).Decode(&storage)
	if err != nil {
		return interfaces.Storage{}, err
	}
	return storage, nil
}

type ListStoragesParams struct {
	UserID string
}

func ListStorages(params ListStoragesParams) ([]interfaces.Storage, error) {
	var Collection = global.GetCollection(global.StoragesCollection)
	var storages []interfaces.Storage
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{
			"userID": params.UserID,
		},
	)
	if err != nil {
		return []interfaces.Storage{}, err
	}
	for cursor.Next(context.TODO()) {
		var storage interfaces.Storage
		err := cursor.Decode(&storage)
		if err != nil {
			return []interfaces.Storage{}, err
		}
		storages = append(storages, storage)
	}
	return storages, nil
}

type DeleteStorageParams struct {
	StorageID string
	UserID    string
}

func DeleteStorage(params DeleteStorageParams) error {
	var Collection = global.GetCollection(global.StoragesCollection)
	_, err := Collection.DeleteOne(
		context.TODO(),
		bson.M{
			"storageID": params.StorageID,
			"userID":    params.UserID,
		},
	)
	if err != nil {
		return err
	}
	return nil
}

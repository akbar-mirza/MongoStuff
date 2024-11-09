package global

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	ConnectionsCollection = "connections"
	SnapshotsCollection   = "snapshots"
	UsersCollection       = "users"
)

// Replace the placeholder with your Atlas connection string
var DBClient *mongo.Database

func MongoConnect(
	uri string,
	database string,
) {

	// Use the SetServerAPIOptions() method to set the Stable API version to 1
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)
	// Create a new client and connect to the server
	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		panic(err)
	}

	// Send a ping to confirm a successful connection
	var result bson.M
	if err := client.Database(database).RunCommand(context.TODO(), bson.D{{"ping", 1}}).Decode(&result); err != nil {
		panic(err)
	}
	fmt.Println("Pinged your deployment. You successfully connected to MongoDB!")
	DBClient = client.Database(database)
}

func GetCollection(
	collectionName string,
) *mongo.Collection {
	if DBClient == nil {
		panic("DBClient is not initialized")
	}
	return DBClient.Collection(collectionName)
}

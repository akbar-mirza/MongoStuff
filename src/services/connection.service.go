package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func AddConnection(
	params interfaces.Connection,
) interface{} {

	var Collection = global.GetCollection("connections")

	// parse uri
	parsedURI := libs.URIParser(params.URI)


	if parsedURI.Port == "" {
		parsedURI.Port = "27017"
	}

	connectionID := libs.RandomString("conn_", 12)

	var doc = bson.D{
		{Key: "uri", Value: parsedURI.URI},
		{Key: "host", Value: parsedURI.Host},
		{Key: "scheme", Value: parsedURI.Scheme},
		{Key: "port", Value: parsedURI.Port},
		{Key: "username", Value: parsedURI.Username},
		{Key: "password", Value: parsedURI.Password},
		{Key: "connectionID", Value: connectionID},
		{Key: "name", Value: params.Name},
		{Key: "userID", Value: params.UserID},
	}

	_, err := Collection.InsertOne(
		context.TODO(),
		doc,
	)

	if err != nil {
		fmt.Println("Error adding connection")
		fmt.Println(err)
		return err
	}
	SyncConnectionDatabases(connectionID)

	return doc
}

func GetConnections(
	userID string,
) interface{} {
	var Collection = global.GetCollection("connections")
	var connections []bson.M
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{"userID": userID},
	)
	if err != nil {
		fmt.Println("Error getting connections")
		fmt.Println(err)
		return err
	}
	if err = cursor.All(context.TODO(), &connections); err != nil {
		fmt.Println("Error getting connections")
		fmt.Println(err)
		return err
	}
	return connections
}

func GetConnection(
	connectionID string,
) (
	interfaces.Connection,
	error,
) {
	var Collection = global.GetCollection("connections")
	var connection interfaces.Connection
	err := Collection.FindOne(
		context.TODO(),
		bson.M{"connectionID": connectionID},
	).Decode(&connection)
	if err != nil {
		fmt.Println("Error getting connection")
		fmt.Println(err)
		return connection, err
	}

	return connection, nil
}

func ConnectionConnect(
	URI string,
) *mongo.Client {
	// Use the SetServerAPIOptions() method to set the Stable API version to 1
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(URI).SetServerAPIOptions(serverAPI)
	// Create a new client and connect to the server
	client, err := mongo.Connect(context.TODO(), opts)

	if err != nil {
		fmt.Println(":: [Connection] :: Error connecting to database")
		panic(err)
	}

	return client

}

func getDiskUsage(client *mongo.Client) interface{} {
	var result map[string]interface{}
	err := client.Database("admin").RunCommand(context.TODO(), map[string]interface{}{
		"serverStatus": 1,
	}).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Host Info: %v\n", result)

	// parse the result into json
	jsonResult, err := json.MarshalIndent(result, "", "  ")

	// Extract specific information, e.g., RAM and CPU
	// if system, ok := result["system"].(map[string]interface{}); ok {
	// 	if memSizeMB, exists := system["memSizeMB"]; exists {
	// 		fmt.Printf("Total RAM (MB): %v\n", memSizeMB)
	// 	}
	// 	if cpuCount, exists := system["numCores"]; exists {
	// 		fmt.Printf("CPU Cores: %v\n", cpuCount)
	// 	}
	// }

	fmt.Println(string(jsonResult))

	// return json response
	jsonStr := string(jsonResult)
	// parse json
	return jsonStr
}

func GetURIByConnectionID(
	connectionID string,
) string {
	var Collection = global.GetCollection("connections")
	var connection bson.M
	err := Collection.FindOne(
		context.TODO(),
		bson.M{"connectionID": connectionID},
		// select only the connectionID field
		options.FindOne().SetProjection(bson.M{"uri": 1}),
	).Decode(&connection)

	if err != nil {
		fmt.Println("Error getting connection")
		fmt.Println(err)
		return ""
	}
	return connection["uri"].(string)
}

func GetClusterStatus(
	connectionID string,
) interface{} {
	URI := GetURIByConnectionID(connectionID)
	client := ConnectionConnect(URI)
	status := getDiskUsage(client)
	client.Disconnect(context.Background())

	return status
}

func SyncConnectionDatabases(
	connectionID string,
) interface{} {

	var Collection = global.GetCollection("connections")
	var URI = GetURIByConnectionID(connectionID)

	client := ConnectionConnect(URI)

	databases, err := client.ListDatabaseNames(context.Background(), bson.M{})

	type DBCollection struct {
		Database    string
		Collections []string
	}
	dbCollections := []DBCollection{}

	for _, database := range databases {
		collections, err := client.Database(database).ListCollectionNames(context.Background(), bson.M{})
		if err != nil {
			fmt.Println("Error getting collections")
			fmt.Println(err)
			return err
		}
		dbCollections = append(dbCollections, struct {
			Database    string
			Collections []string
		}{database, collections})
	}

	if err != nil {
		fmt.Println("Error getting databases")
		fmt.Println(err)
		return err
	}
	client.Disconnect(context.Background())

	_, err = Collection.UpdateOne(
		context.TODO(),
		bson.M{"connectionID": connectionID},
		bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "databases", Value: databases},
				{Key: "collections", Value: dbCollections},
			}},
		},
	)
	if err != nil {
		fmt.Println("Error updating connection")
		fmt.Println(err)
		return err
	}
	return databases
	// return connection
}

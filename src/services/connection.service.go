package services

import (
	"context"
	"fmt"
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

	var doc = bson.D{
		{Key: "uri", Value: parsedURI.URI},
		{Key: "host", Value: parsedURI.Host},
		{Key: "scheme", Value: parsedURI.Scheme},
		{Key: "port", Value: parsedURI.Port},
		{Key: "username", Value: parsedURI.Username},
		{Key: "password", Value: parsedURI.Password},
		{Key:"connectionID", Value: libs.RandomString("conn_",12)},
		{Key: "name", Value: params.Name},
		{Key: "userID", Value: params.UserID},

	}

	_, err := Collection.InsertOne(
		context.TODO(),
		doc,
	)


	if(err != nil) {
		fmt.Println("Error adding connection")
		fmt.Println(err)
		return err
	}

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


func SyncConnectionDatabases(
	connectionID string,
) interface{} {
	var Collection = global.GetCollection("connections")
	var connection bson.M
	err := Collection.FindOne(
		context.TODO(),
		bson.M{"connectionID": connectionID},
	).Decode(&connection)
	if err != nil {
		fmt.Println("Error getting connection")
		fmt.Println(err)
		return err
	}

	client := ConnectionConnect(connection["uri"].(string))
	client.ListDatabaseNames(context.Background(), bson.M{})
	databases, err := client.ListDatabaseNames(context.Background(), bson.M{})
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
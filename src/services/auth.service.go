package services

import (
	"context"
	"errors"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func FindUserByUsername(
	username string,
) (
	interfaces.User,
	error,
) {
	var Collection = global.GetCollection("users")

	user := interfaces.User{}
	err := Collection.FindOne(
		context.TODO(),
		bson.M{
			"username": username,
		},
	).Decode(&user)

	if err != nil {
		return interfaces.User{}, err
	}

	return user, nil

}

func Register(
	params interfaces.CreateUser,
) (
	interfaces.User,
	error,
) {
	var Collection = global.GetCollection("users")

	getUser, _ := FindUserByUsername(params.Username) // check if username exists

	if getUser.Username != "" {
		return interfaces.User{}, errors.New("username already exists")
	}

	passwordHash, _ := libs.HashPassword(params.Password)
	newUser := interfaces.User{
		Username:     params.Username,
		Password:     passwordHash,
		SessionToken: libs.RandomString("sess_", 24),
		CSRFToken:    libs.RandomString("csrf_", 24),
		UserID:       libs.RandomString("user_", 24),
	}
	_, err := Collection.InsertOne(
		context.TODO(),
		bson.M{
			"username":     newUser.Username,
			"password":     newUser.Password,
			"sessionToken": newUser.SessionToken,
			"csrfToken":    newUser.CSRFToken,
			"userID":       newUser.UserID,
		},
	)

	if err != nil {
		return interfaces.User{}, errors.New("error inserting user into the database")
	}

	return newUser, nil
}

func Login(
	username string,
	password string,
) (
	interfaces.User,
	error,
) {
	var Collection = global.GetCollection("users")
	var user interfaces.User
	err := Collection.FindOne(
		context.TODO(),
		bson.M{
			"username": username,
		},
	).Decode(&user)

	user.SessionToken = libs.RandomString("sess_", 24)
	user.CSRFToken = libs.RandomString("csrf_", 24)

	if err != nil {
		return interfaces.User{}, errors.New("user not found")
	}

	if libs.ComparePassword(user.Password, password) {
		user.Password = ""
		_ = Collection.FindOneAndUpdate(
			context.TODO(),
			bson.M{"userID": user.UserID},
			bson.M{"$set": bson.M{"sessionToken": user.SessionToken, "csrfToken": user.CSRFToken}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		)

		return user, nil
	}

	return interfaces.User{}, errors.New("invalid username or password")
}

func GetCurrentUser(
	sessionToken string,
	csrfToken string,
) (interfaces.User, error) {
	var Collection = global.GetCollection("users")

	var user interfaces.User
	err := Collection.FindOne(
		context.TODO(),
		bson.M{
			"sessionToken": sessionToken,
			"csrfToken":    csrfToken,
		},
	).Decode(&user)

	if err != nil {
		return interfaces.User{}, errors.New("no user found")
	}

	return user, nil
}

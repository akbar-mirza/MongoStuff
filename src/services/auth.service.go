package services

import (
	"context"
	"errors"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const sessionLifetime = 24 * time.Hour

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

	passwordHash, err := libs.HashPassword(params.Password)
	if err != nil {
		return interfaces.User{}, errors.New("error hashing password")
	}

	sessionExpiresAt := time.Now().Add(sessionLifetime).Unix()
	newUser := interfaces.User{
		Username:         params.Username,
		Password:         passwordHash,
		SessionToken:     libs.RandomString("sess_", 32),
		CSRFToken:        libs.RandomString("csrf_", 32),
		UserID:           libs.RandomString("user_", 24),
		LastLogin:        time.Now().Unix(),
		SessionExpiresAt: sessionExpiresAt,
	}
	_, err = Collection.InsertOne(
		context.TODO(),
		bson.M{
			"username":         newUser.Username,
			"password":         newUser.Password,
			"sessionToken":     newUser.SessionToken,
			"csrfToken":        newUser.CSRFToken,
			"userID":           newUser.UserID,
			"lastLogin":        newUser.LastLogin,
			"sessionExpiresAt": newUser.SessionExpiresAt,
		},
	)

	if err != nil {
		return interfaces.User{}, errors.New("error inserting user into the database")
	}

	newUser.Password = ""
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

	if err != nil {
		return interfaces.User{}, errors.New("user not found")
	}

	if libs.ComparePassword(user.Password, password) {
		user.SessionToken = libs.RandomString("sess_", 32)
		user.CSRFToken = libs.RandomString("csrf_", 32)
		user.LastLogin = time.Now().Unix()
		user.SessionExpiresAt = time.Now().Add(sessionLifetime).Unix()
		user.Password = ""
		updateErr := Collection.FindOneAndUpdate(
			context.TODO(),
			bson.M{"userID": user.UserID},
			bson.M{"$set": bson.M{"sessionToken": user.SessionToken, "csrfToken": user.CSRFToken,
				"lastLogin":        user.LastLogin,
				"sessionExpiresAt": user.SessionExpiresAt,
			}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		).Err()
		if updateErr != nil {
			return interfaces.User{}, errors.New("failed to update user session")
		}

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

	if user.SessionExpiresAt != 0 && time.Now().Unix() > user.SessionExpiresAt {
		_ = RevokeSession(sessionToken)
		return interfaces.User{}, errors.New("session expired")
	}

	user.Password = ""
	return user, nil
}

func RevokeSession(sessionToken string) error {
	var Collection = global.GetCollection("users")

	if sessionToken == "" {
		return nil
	}

	return Collection.FindOneAndUpdate(
		context.TODO(),
		bson.M{"sessionToken": sessionToken},
		bson.M{"$set": bson.M{
			"sessionToken":     "",
			"csrfToken":        "",
			"sessionExpiresAt": 0,
		}},
	).Err()
}

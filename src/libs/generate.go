package libs

import (
	"crypto/rand"
	"encoding/base64"

	"golang.org/x/crypto/bcrypt"
)

// RandomString generates a random string of a specified length
func RandomString(prefix string,
	length int) string {
	if length <= 0 {
		return prefix
	}

	byteLen := (length*3 + 3) / 4
	b := make([]byte, byteLen)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}

	token := base64.RawURLEncoding.EncodeToString(b)
	if len(token) > length {
		token = token[:length]
	}

	return prefix + token
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

// ComparePassword compares a hashed password with a plain-text password
func ComparePassword(hashedPwd, plainPwd string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPwd), []byte(plainPwd))
	return err == nil
}

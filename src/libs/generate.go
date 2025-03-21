package libs

import (
	"log/slog"
	"math/rand"

	"golang.org/x/crypto/bcrypt"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// RandomString generates a random string of a specified length
func RandomString(prefix string,
	length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return prefix + string(b)
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
	slog.Info("Comparing passwords", "hashedPwd", hashedPwd, "plainPwd", plainPwd)
	err := bcrypt.CompareHashAndPassword([]byte(hashedPwd), []byte(plainPwd))
	return err == nil
}

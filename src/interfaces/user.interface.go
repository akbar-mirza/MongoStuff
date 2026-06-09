package interfaces

type User struct {
	Username         string `json:"username" bson:"username"`
	Password         string `json:"-" bson:"password"`
	SessionToken     string `json:"-" bson:"sessionToken"`
	CSRFToken        string `json:"-" bson:"csrfToken"`
	UserID           string `json:"userID" bson:"userID"`
	LastLogin        int64  `json:"lastLogin" bson:"lastLogin"`
	SessionExpiresAt int64  `json:"-" bson:"sessionExpiresAt"`
}

type CreateUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

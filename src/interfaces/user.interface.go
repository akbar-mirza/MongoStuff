package interfaces

type User struct {
	Username     string `json:"username" bson:"username"`
	Password     string `json:"password" bson:"password"`
	SessionToken string `json:"sessionToken" bson:"sessionToken"`
	CSRFToken    string `json:"csrfToken" bson:"csrfToken"`
	UserID       string `json:"userID" bson:"userID"`
	LastLogin    int64  `json:"lastLogin" bson:"lastLogin"`
}

type CreateUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

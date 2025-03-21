package interfaces

type User struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	SessionToken string `json:"sessionToken"`
	CSRFToken    string `json:"csrfToken"`
	UserID       string `json:"userID"`
}

type CreateUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

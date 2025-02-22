package interfaces

// Struct type for connection
type Connection struct {
	Scheme       string   `json:"scheme"`
	Host         string   `json:"host"`
	Port         string   `json:"port"`
	Username     string   `json:"username"`
	Password     string   `json:"password"`
	URI          string   `json:"uri"`
	Name         string   `json:"name"`
	ConnectionID string   `json:"connectionID"`
	UserID       string   `json:"userID"`
	Databases    []string `json:"databases"`
	Collections  []struct {
		Database    string   `json:"database"`
		Collections []string `json:"collections"`
	} `json:"collections"`
}

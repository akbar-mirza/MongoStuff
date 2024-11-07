package libs

import (
	"fmt"
	"net/url"
)

type ParsedURI struct {
	URI      string
	Host     string
	Scheme   string
	Port     string
	Username string
	Password string
}
func URIParser(
	URI string,
) ParsedURI {
		// Parse the URI
		parsedURL, err := url.Parse(URI)
		if err != nil {
			fmt.Println("Error parsing URI:", err)
			return ParsedURI{}
		}
	


	var username string
	var password string
	// Accessing the username and password
	if parsedURL.User != nil {
		username = parsedURL.User.Username()
		password, _ = parsedURL.User.Password()
	}


	

	return ParsedURI{
		URI:      URI,
		Host:     parsedURL.Host,
		Scheme:   parsedURL.Scheme,
		Port:     parsedURL.Port(),
		Username: username,
		Password: password,
	}

}
package libs

import (
	"encoding/json"

	"go.mongodb.org/mongo-driver/bson"
)



func MarshalWithJSONTags(v interface{}) (bson.M, error) {
    // Convert to JSON first
    jsonData, err := json.Marshal(v)
    if err != nil {
        return nil, err
    }
    
    // Convert JSON to bson.M
    var result bson.M
    err = json.Unmarshal(jsonData, &result)
    return result, err
}
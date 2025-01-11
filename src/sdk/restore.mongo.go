package sdk

import (
	"fmt"
	"os"
	"os/exec"
)

type MongoRestore struct {
	URI        string
	Database   string
	BackupPath string
	IsCompress bool
}

type MongoRestoreResponse struct {
	ErrorStr string
	Output   string
}

func Restore(
	params MongoRestore,
) MongoRestoreResponse {
	// PATH TO MONGO-TOOLS
	PATH := os.Getenv("MONGODB_TOOLS_PATH")
	fmt.Println("PATH:", PATH)
	fmt.Println("Restoring Database:", params.Database)
	var command = PATH + "mongorestore" + " --uri=" + params.URI

	if params.Database != "" {
		command += " --db=" + params.Database
	}

	if params.IsCompress {
		command += " --gzip" + " --archive=" + params.BackupPath + ".gz"
	}

	if !params.IsCompress {
		if params.Database != "" {
			command += " " + params.BackupPath + "/" + params.Database
		} else {
			command += " " + params.BackupPath
		}
	}

	output, err := exec.Command("bash", "-c", command).CombinedOutput()

	fmt.Println("Command:", command)
	fmt.Println("Output:", string(output))

	if err != nil {
		fmt.Println("Errors", string(output))
		return MongoRestoreResponse{
			ErrorStr: string(output),
			Output:   "",
		}
	}

	return MongoRestoreResponse{
		ErrorStr: "",
		Output:   string(output),
	}
}

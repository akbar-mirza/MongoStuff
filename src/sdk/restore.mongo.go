package sdk

import (
	"fmt"
	"os"
	"os/exec"
)

type MongoRestore struct {
	URI            string
	SourceDatabase string
	TargetDatabase string
	Collection     string
	BackupPath     string
	IsCompress     bool
	Update         bool
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
	fmt.Println("Restoring Database:", params.SourceDatabase)
	var command = PATH + "mongorestore" + " --uri=" + params.URI

	if params.SourceDatabase != "" && params.TargetDatabase != "" {
		if params.SourceDatabase != "" {
			command += " --nsFrom=" + params.SourceDatabase
			command += ".*"
		}

		if params.TargetDatabase != "" {
			command += " --nsTo=" + params.TargetDatabase
			command += ".*"
		}
	}

	if params.SourceDatabase != "" {
		command += " --nsInclude=" + params.SourceDatabase
		if params.Collection != "" {
			command += "." + params.Collection
		} else {
			command += ".*"
		}
	}

	if params.IsCompress {
		command += " --gzip" + " --archive=" + params.BackupPath + ".gz"
	}

	if !params.IsCompress {
		if params.SourceDatabase != "" {
			command += " " + params.BackupPath + "/" + params.SourceDatabase
		} else {
			command += " " + params.BackupPath
		}
	}

	// For Updating with Snapshot Version
	if params.Update {
		command += " --drop"
	}

	output, err := exec.Command("bash", "-c", command).CombinedOutput()

	fmt.Println("Command:", command)
	// fmt.Println("Output:", string(output))

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

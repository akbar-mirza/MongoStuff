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
	args := []string{"--uri", params.URI}

	if params.SourceDatabase != "" && params.TargetDatabase != "" {
		if params.SourceDatabase != "" {
			args = append(args, "--nsFrom", params.SourceDatabase+".*")
		}

		if params.TargetDatabase != "" {
			args = append(args, "--nsTo", params.TargetDatabase+".*")
		}
	}

	if params.SourceDatabase != "" {
		nsInclude := params.SourceDatabase
		if params.Collection != "" {
			nsInclude += "." + params.Collection
		} else {
			nsInclude += ".*"
		}
		args = append(args, "--nsInclude", nsInclude)
	}

	if params.IsCompress {
		args = append(args, "--gzip", "--archive", params.BackupPath+".gz")
	}

	if !params.IsCompress {
		if params.SourceDatabase != "" {
			args = append(args, params.BackupPath+"/"+params.SourceDatabase)
		} else {
			args = append(args, params.BackupPath)
		}
	}

	// For Updating with Snapshot Version
	if params.Update {
		args = append(args, "--drop")
	}

	command := exec.Command(PATH+"mongorestore", args...)
	output, err := command.CombinedOutput()

	fmt.Println("Command:", command.String())
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

package sdk

import (
	"fmt"
	"os"
	"os/exec"
)

type MongoDump struct {
	Database    string
	URI         string
	Collection  string
	OutputDir   string
	Compression bool
}

type MongoDumpResponse struct {
	ErrorStr string
	Output   string
}

func Dump(
	params MongoDump,
) MongoDumpResponse {

	// PATH TO MONGO-TOOLS
	PATH := os.Getenv("MONGODB_TOOLS_PATH")
	fmt.Println("PATH:", PATH)
	fmt.Println("Dumping Database:", params.Database)
	args := []string{"--uri", params.URI}

	// Entire Cluster Dump
	if params.Database != "" {
		args = append(args, "--db", params.Database)
	}

	if params.OutputDir != "" && !params.Compression {
		args = append(args, "--out", params.OutputDir)
	}

	if params.Compression {
		args = append(args, "--archive", params.OutputDir, "--gzip")
	}

	if params.Collection != "" {
		args = append(args, "--collection", params.Collection)
	}

	if params.Collection == "" {
		args = append(args, "--numParallelCollections=8")
	}

	args = append(args, "--forceTableScan")

	command := exec.Command(PATH+"mongodump", args...)
	fmt.Println("Command:", command.String())
	output, err := command.CombinedOutput()
	if err != nil {
		fmt.Println("Errors", string(output))
		return MongoDumpResponse{
			ErrorStr: string(output),
			Output:   "",
		}
	}

	// Print the command output
	return MongoDumpResponse{
		ErrorStr: "",
		Output:   string(output),
	}
}

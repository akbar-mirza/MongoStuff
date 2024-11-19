package sdk

import (
	"fmt"
	"os"
	"os/exec"
)

type MongoDump struct {
	Database    string
	URI         string
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
	var command = PATH + "mongodump" + " --uri=" + params.URI

	// Entire Cluster Dump
	if params.Database != "" {
		command += " --db=" + params.Database
	}

	if params.OutputDir != "" && !params.Compression {
		command += " --out=" + params.OutputDir
	}

	if params.Compression {
		command += " --archive=" + params.OutputDir + " --gzip"
	}

	fmt.Println("Command:", command)
	output, err := exec.Command("bash", "-c", command).CombinedOutput()
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

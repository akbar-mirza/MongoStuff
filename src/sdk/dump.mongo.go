package sdk

import (
	"fmt"
	"os/exec"
)

// PATH TO MONGO-TOOLS
var PATH = "bin"

// const DB =
//   "mongodb+srv://ashmirza:gaXxxzkAt9QwVo5P@opensourceworkspace.mpvkox0.mongodb.net/?retryWrites=true&w=majority&appName=OpenSourceWorkspace";

// const cammand = `bin/mongodump ${DB} --db clikclick`;

// const bsonDump = `bin/bsondump --outFile=links.json dump/clikclick/links.bson`;

// const restore = `bin/mongorestore --db restore --uri 'mongodb+srv://ashmirza:gaXxxzkAt9QwVo5P@opensourceworkspace.mpvkox0.mongodb.net/restore'  dump/clikclick`;

// const { exec } = require("child_process");

// exec(cammand, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout}`);
//   console.error(`stderr: ${stderr}`);
// });

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

	fmt.Println("Dumping Database:", params.Database)
	var command = PATH + "/mongodump" + " --uri=" + params.URI

	// Entire Cluster Dump
	if params.Database != "" {
		command += " --db " + params.Database
	}

	if params.OutputDir != "" {
		command += " --out " + params.OutputDir
	}

	if params.Compression {
		command += " --gzip"
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

package libs

import (
	"fmt"
	"os"
)

type File struct {
	Name     string
	Size     int64
	SizeInKB int64
	SizeInMB int64
}

func CalDirSize(
	dirPath string,
) (File, error) {
	// Calculate the size of a directory
	// and return the size in KB

	stats, err := os.Stat(dirPath)

	Size := stats.Size()

	// print all the stats
	fmt.Println("Directory Name: ", stats.Name())
	fmt.Println("Size: ", stats.Size())
	fmt.Println("Size in KB: ", stats.Size()/1024)
	fmt.Println("Size in MB: ", stats.Size()/1024/1024)

	if err != nil {
		return File{}, err
	}

	return File{
		Name:     stats.Name(),
		Size:     stats.Size(),
		SizeInKB: Size / 1024,
		SizeInMB: Size / 1024 / 1024,
	}, nil

}

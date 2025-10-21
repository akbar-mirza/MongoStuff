package libs

import (
	"fmt"
	"strings"
)

type TimeUnit string

const (
	Second TimeUnit = "seconds"
	Minute TimeUnit = "minutes"
	Hour   TimeUnit = "hours"
	Day    TimeUnit = "days"
)

func UnitToCron(value int, unit TimeUnit) (string, error) {
	if value <= 0 {
		return "", fmt.Errorf("value must be greater than 0")
	}

	unit = TimeUnit(strings.ToLower(string(unit)))

	switch unit {
	case Second:
		// 6-field cron (requires scheduler with seconds support)
		return fmt.Sprintf("*/%d * * * * *", value), nil
	case Minute:
		return fmt.Sprintf("0 */%d * * * *", value), nil
	case Hour:
		return fmt.Sprintf("0 */%d * * *", value), nil
	case Day:
		return fmt.Sprintf("0 0 */%d * *", value), nil
	default:
		return "", fmt.Errorf("unsupported time unit: %s", unit)
	}
}


func ParseTimeUnitToMilli(unit TimeUnit) int64 {
	switch unit {
	case Second:
		return 1_000
	case Minute:
		return 60 * 1_000
	case Hour:
		return 60 * 60 * 1_000
	case Day:
		return 24 * 60 * 60 * 1_000
	default:
		return 1_000 // Default to seconds
	}
}
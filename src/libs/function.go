package libs

func FallBack(
	Value interface{},
	DefaultValue interface{},
) interface{} {
	if Value == "" || Value == nil || Value == 0 || Value == false || Value == "false" {
		return DefaultValue
	}
	return Value
}

func FallBackString(
	Value string,
	DefaultValue string,
) string {
	if Value == "" {
		return DefaultValue
	}
	return Value
}

func If[T any](condition bool, a, b T) T {
	if condition {
		return a
	}
	return b
}

package jsonic

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"
)

// Deep performs a recursive deep merge of multiple values.
// Objects (map[string]any) are merged recursively.
// Arrays are merged element-by-element (over array values replace base at same index).
// Primitive values and nil replace the base.
// The function takes a base value and any number of overlay values.
func Deep(base any, rest ...any) any {
	for _, over := range rest {
		base = deepMerge(base, over)
	}
	return base
}

func deepMerge(base, over any) any {
	baseMap, baseIsMap := base.(map[string]any)
	overMap, overIsMap := over.(map[string]any)

	baseArr, baseIsArr := base.([]any)
	overArr, overIsArr := over.([]any)

	if baseIsMap && overIsMap {
		// Both maps: recursively merge
		result := make(map[string]any)
		for k, v := range baseMap {
			result[k] = v
		}
		for k, v := range overMap {
			if existing, ok := result[k]; ok {
				result[k] = deepMerge(existing, v)
			} else {
				result[k] = deepClone(v)
			}
		}
		return result
	}

	if baseIsArr && overIsArr {
		// Both arrays: recursively merge elements at same index
		maxLen := len(baseArr)
		if len(overArr) > maxLen {
			maxLen = len(overArr)
		}
		result := make([]any, maxLen)
		for i := 0; i < maxLen; i++ {
			if i < len(baseArr) && i < len(overArr) {
				result[i] = deepMerge(deepClone(baseArr[i]), overArr[i])
			} else if i < len(overArr) {
				result[i] = deepClone(overArr[i])
			} else if i < len(baseArr) {
				result[i] = deepClone(baseArr[i])
			}
		}
		return result
	}

	// Type mismatch or non-container: over wins
	if over == nil {
		return nil
	}
	return deepClone(over)
}

// deepClone creates a deep copy of a value.
func deepClone(val any) any {
	if val == nil {
		return nil
	}
	switch v := val.(type) {
	case map[string]any:
		result := make(map[string]any)
		for k, val := range v {
			result[k] = deepClone(val)
		}
		return result
	case []any:
		result := make([]any, len(v))
		for i, val := range v {
			result[i] = deepClone(val)
		}
		return result
	default:
		return v
	}
}

// Str converts a value to a truncated string representation.
// If maxlen is <= 0, returns empty string.
// If the string representation exceeds maxlen, it is truncated with "..." appended.
// Default maxlen is 44 if not specified (pass 0 or negative to get empty string).
func Str(val any, maxlen int) string {
	if maxlen < 0 {
		return ""
	}
	if maxlen == 0 {
		return ""
	}

	var s string
	switch v := val.(type) {
	case string:
		s = v
	case float64:
		if v == float64(int64(v)) {
			s = strconv.FormatInt(int64(v), 10)
		} else {
			s = strconv.FormatFloat(v, 'f', -1, 64)
		}
	case bool:
		if v {
			s = "true"
		} else {
			s = "false"
		}
	case nil:
		s = ""
	default:
		b, err := json.Marshal(val)
		if err != nil {
			s = fmt.Sprintf("%v", val)
		} else {
			s = string(b)
		}
	}

	if len(s) > maxlen {
		if maxlen >= 4 {
			s = s[:maxlen-3] + "..."
		} else {
			// For very small maxlen, just use dots
			s = "..."[:maxlen]
		}
	}

	return s
}

// StrInject replaces template placeholders like {key} or {key.subkey} in a
// template string with values from a map or array.
// Returns the template unchanged if vals is not a map or array.
func StrInject(template string, vals any) string {
	if template == "" {
		return ""
	}

	valsMap, isMap := vals.(map[string]any)
	valsArr, isArr := vals.([]any)

	if !isMap && !isArr {
		return template
	}

	var result strings.Builder
	runes := []rune(template)
	i := 0
	for i < len(runes) {
		if runes[i] == '{' {
			// Find closing brace
			j := i + 1
			for j < len(runes) && runes[j] != '}' {
				j++
			}
			if j < len(runes) {
				path := string(runes[i+1 : j])
				// Resolve path
				resolved, ok := resolvePath(path, valsMap, valsArr, isMap)
				if ok {
					result.WriteString(formatInjectValue(resolved))
				} else {
					// Keep original placeholder
					result.WriteString(string(runes[i : j+1]))
				}
				i = j + 1
			} else {
				result.WriteRune(runes[i])
				i++
			}
		} else {
			result.WriteRune(runes[i])
			i++
		}
	}
	return result.String()
}

// resolvePath resolves a dotted path like "a.b.0" against a map or array.
func resolvePath(path string, valsMap map[string]any, valsArr []any, isMap bool) (any, bool) {
	parts := strings.Split(path, ".")
	var current any
	if isMap {
		current = any(valsMap)
	} else {
		current = any(valsArr)
	}

	for _, part := range parts {
		switch c := current.(type) {
		case map[string]any:
			v, ok := c[part]
			if !ok {
				return nil, false
			}
			current = v
		case []any:
			idx, err := strconv.Atoi(part)
			if err != nil || idx < 0 || idx >= len(c) {
				return nil, false
			}
			current = c[idx]
		default:
			return nil, false
		}
	}
	return current, true
}

// formatInjectValue formats a value for injection into a template.
func formatInjectValue(val any) string {
	switch v := val.(type) {
	case string:
		return v
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10)
		}
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		if v {
			return "true"
		}
		return "false"
	case nil:
		return "null"
	case map[string]any:
		return formatCompactValue(v)
	case []any:
		return formatCompactValue(v)
	default:
		return fmt.Sprintf("%v", v)
	}
}

// formatCompactValue formats maps/arrays in a compact non-JSON format
// similar to jsonic's output: {key:value} instead of {"key":"value"}.
func formatCompactValue(val any) string {
	switch v := val.(type) {
	case map[string]any:
		var sb strings.Builder
		sb.WriteRune('{')
		first := true
		for k, v := range v {
			if !first {
				sb.WriteRune(',')
			}
			first = false
			sb.WriteString(k)
			sb.WriteRune(':')
			sb.WriteString(formatCompactValue(v))
		}
		sb.WriteRune('}')
		return sb.String()
	case []any:
		var sb strings.Builder
		sb.WriteRune('[')
		for i, v := range v {
			if i > 0 {
				sb.WriteRune(',')
			}
			sb.WriteString(formatCompactValue(v))
		}
		sb.WriteRune(']')
		return sb.String()
	case string:
		return v
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10)
		}
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		if v {
			return "true"
		}
		return "false"
	case nil:
		return "null"
	default:
		return fmt.Sprintf("%v", v)
	}
}

// ModList modifies an array by applying delete and move operations.
// opts is a map with optional keys:
//   - "delete": []any of indices (float64) to delete
//   - "move": []any of index pairs [from, to, from, to, ...]
type ModListOpts struct {
	Delete []int
	Move   []int // pairs: [from, to, from, to, ...]
}

// ModList modifies a list by applying delete and move operations.
func ModList(list []any, opts *ModListOpts) []any {
	if opts == nil || list == nil {
		return list
	}

	if len(list) > 0 {
		// Phase 1: Mark elements for deletion
		if len(opts.Delete) > 0 {
			type sentinel struct{}
			deleteMarker := sentinel{}
			for _, idx := range opts.Delete {
				// Support negative indices
				n := len(list)
				if idx < 0 {
					if -idx <= n {
						dI := (n + idx) % n
						list[dI] = deleteMarker
					}
				} else {
					if idx < n {
						list[idx] = deleteMarker
					}
				}
			}

			// Phase 3: Filter out deleted entries
			filtered := make([]any, 0, len(list))
			for _, v := range list {
				if _, ok := v.(sentinel); !ok {
					filtered = append(filtered, v)
				}
			}
			// Replace list contents
			list = filtered
		}

		// Phase 2: Move operations
		if len(opts.Move) >= 2 {
			for i := 0; i+1 < len(opts.Move); i += 2 {
				n := len(list)
				if n == 0 {
					break
				}
				fromI := ((opts.Move[i] % n) + n) % n
				toI := ((opts.Move[i+1] % n) + n) % n
				entry := list[fromI]
				// Remove from source
				list = append(list[:fromI], list[fromI+1:]...)
				// Insert at destination
				newList := make([]any, len(list)+1)
				copy(newList, list[:toI])
				newList[toI] = entry
				copy(newList[toI+1:], list[toI:])
				list = newList
			}
		}
	}

	return list
}

// deepEqual compares two values for deep equality.
// Used internally for testing.
func deepEqual(a, b any) bool {
	return reflect.DeepEqual(a, b)
}

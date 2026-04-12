package jsonic

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"
)

// Deep performs a recursive deep merge of multiple values.
// Works on map[string]any, []any, and Go structs (via reflection),
// matching the TypeScript deep() utility.
// Zero/nil values in the overlay do not overwrite base values.
func Deep(base any, rest ...any) any {
	for _, over := range rest {
		base = deepMerge(base, over)
	}
	return base
}

func deepMerge(base, over any) any {
	// Match TS: undefined and Skip preserve base.
	if IsUndefined(over) || IsSkip(over) {
		return base
	}

	// Extract maps from MapRef if present.
	baseMap, baseIsMap := base.(map[string]any)
	baseMR, baseIsMR := base.(MapRef)
	if baseIsMR {
		baseMap = baseMR.Val
		baseIsMap = true
	}
	overMap, overIsMap := over.(map[string]any)
	overMR, overIsMR := over.(MapRef)
	if overIsMR {
		overMap = overMR.Val
		overIsMap = true
	}

	// Extract arrays from ListRef if present.
	baseArr, baseIsArr := base.([]any)
	baseLR, baseIsLR := base.(ListRef)
	if baseIsLR {
		baseArr = baseLR.Val
		baseIsArr = true
	}
	overArr, overIsArr := over.([]any)
	overLR, overIsLR := over.(ListRef)
	if overIsLR {
		overArr = overLR.Val
		overIsArr = true
	}

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
		// Preserve MapRef wrapper if the over value was a MapRef.
		if overIsMR {
			meta := mergeMeta(baseMR.Meta, overMR.Meta)
			return MapRef{Val: result, Implicit: overMR.Implicit, Meta: meta}
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
		// Preserve ListRef wrapper if the over value was a ListRef.
		if overIsLR {
			// Merge Child fields if both are ListRef.
			var child any
			if baseIsLR && baseLR.Child != nil && overLR.Child != nil {
				child = deepMerge(baseLR.Child, overLR.Child)
			} else if overLR.Child != nil {
				child = deepClone(overLR.Child)
			} else if baseIsLR {
				child = deepClone(baseLR.Child)
			}
			meta := mergeMeta(baseLR.Meta, overLR.Meta)
			return ListRef{Val: result, Implicit: overLR.Implicit, Child: child, Meta: meta}
		}
		return result
	}

	// Struct handling via reflection — matches TS deep() on plain objects.
	if merged, ok := deepMergeStruct(base, over); ok {
		return merged
	}

	// Type mismatch or non-container: over wins
	// Match TS: undefined preserves base, null replaces.
	if IsUndefined(over) {
		return base
	}
	if over == nil {
		return nil
	}
	return deepClone(over)
}

// deepMergeStruct merges two struct values field-by-field via reflection.
// Zero-value fields in over do not overwrite base, matching TS deep() where
// undefined properties are skipped. Returns (merged, true) if both values
// are structs of the same type, or (nil, false) if not applicable.
func deepMergeStruct(base, over any) (any, bool) {
	if base == nil || over == nil {
		return nil, false
	}

	bv := reflect.ValueOf(base)
	ov := reflect.ValueOf(over)

	// Unwrap pointers.
	bIsPtr := bv.Kind() == reflect.Ptr
	oIsPtr := ov.Kind() == reflect.Ptr

	if bIsPtr && bv.IsNil() {
		if oIsPtr || ov.Kind() == reflect.Struct {
			return over, true
		}
		return nil, false
	}
	if oIsPtr && ov.IsNil() {
		if bIsPtr || bv.Kind() == reflect.Struct {
			return base, true
		}
		return nil, false
	}

	bElem := bv
	oElem := ov
	if bIsPtr {
		bElem = bv.Elem()
	}
	if oIsPtr {
		oElem = ov.Elem()
	}

	if bElem.Kind() != reflect.Struct || oElem.Kind() != reflect.Struct {
		return nil, false
	}
	if bElem.Type() != oElem.Type() {
		return nil, false
	}

	result := reflect.New(bElem.Type()).Elem()
	for i := 0; i < bElem.NumField(); i++ {
		bf := bElem.Field(i)
		of := oElem.Field(i)

		if !bf.CanInterface() {
			// Unexported field: keep base.
			continue
		}

		if of.IsZero() {
			result.Field(i).Set(bf)
			continue
		}
		if bf.IsZero() {
			result.Field(i).Set(of)
			continue
		}

		// Both non-zero: merge based on kind.
		switch of.Kind() {
		case reflect.Ptr:
			if of.Elem().Kind() == reflect.Struct {
				// Pointer to struct: recurse.
				merged, ok := deepMergeStruct(bf.Interface(), of.Interface())
				if ok {
					result.Field(i).Set(reflect.ValueOf(merged))
				} else {
					result.Field(i).Set(of)
				}
			} else {
				// Pointer to primitive (*bool, *int): over wins.
				result.Field(i).Set(of)
			}
		case reflect.Map:
			// Merge map entries: base first, then over overwrites.
			merged := reflect.MakeMap(bf.Type())
			for _, k := range bf.MapKeys() {
				merged.SetMapIndex(k, bf.MapIndex(k))
			}
			for _, k := range of.MapKeys() {
				merged.SetMapIndex(k, of.MapIndex(k))
			}
			result.Field(i).Set(merged)
		default:
			// String, slice, func, etc.: over wins.
			result.Field(i).Set(of)
		}
	}

	// Return with same pointer wrapping as inputs.
	if bIsPtr || oIsPtr {
		ptr := reflect.New(result.Type())
		ptr.Elem().Set(result)
		return ptr.Interface(), true
	}
	return result.Interface(), true
}

// cloneMeta creates a shallow copy of a Meta map.
func cloneMeta(meta map[string]any) map[string]any {
	if meta == nil {
		return nil
	}
	result := make(map[string]any, len(meta))
	for k, v := range meta {
		result[k] = v
	}
	return result
}

// mergeMeta merges two Meta maps. The over map's values take precedence.
func mergeMeta(base, over map[string]any) map[string]any {
	if base == nil && over == nil {
		return nil
	}
	result := make(map[string]any)
	for k, v := range base {
		result[k] = v
	}
	for k, v := range over {
		result[k] = v
	}
	return result
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
	case ListRef:
		result := make([]any, len(v.Val))
		for i, val := range v.Val {
			result[i] = deepClone(val)
		}
		return ListRef{Val: result, Implicit: v.Implicit, Child: deepClone(v.Child), Meta: cloneMeta(v.Meta)}
	case MapRef:
		result := make(map[string]any)
		for k, val := range v.Val {
			result[k] = deepClone(val)
		}
		return MapRef{Val: result, Implicit: v.Implicit, Meta: cloneMeta(v.Meta)}
	default:
		return v
	}
}

// Snip returns the first maxlen characters of s, replacing \r, \n, \t with '.'.
// Matches the TypeScript snip() utility used for debug/display output.
func Snip(s string, maxlen int) string {
	if maxlen <= 0 {
		return ""
	}
	if len(s) > maxlen {
		s = s[:maxlen]
	}
	return strings.NewReplacer("\r", ".", "\n", ".", "\t", ".").Replace(s)
}

// Str converts a value to a truncated string representation.
// If maxlen is <= 0, returns empty string.
// If the string representation exceeds maxlen, it is truncated with "..." appended.
// Matches the TypeScript str() + snip() pipeline: converts to string, truncates,
// then replaces \r\n\t with '.'.
func Str(val any, maxlen int) string {
	if maxlen <= 0 {
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
		// Match TS: JSON.stringify(null) === "null"
		s = "null"
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
			s = "..."[:maxlen]
		}
	}

	// Match TS: str() calls snip() which replaces \r\n\t with '.'
	return Snip(s, maxlen)
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

// ModListOpts configures list modifications for ModList.
// Matches the TypeScript ListMods type.
type ModListOpts struct {
	Delete []int                   // Indices to delete (supports negative indices).
	Move   []int                   // Pairs: [from, to, from, to, ...].
	Custom func(list []any) []any  // Custom modification callback, applied last.
}

// ModList modifies a list by applying delete, move, and custom operations.
// Matches the TypeScript modlist() utility.
func ModList(list []any, opts *ModListOpts) []any {
	if opts == nil || list == nil {
		return list
	}

	if len(list) > 0 {
		type sentinel struct{}
		deleteMarker := sentinel{}

		// Phase 1: Mark elements for deletion (before move so indexes still make sense).
		if len(opts.Delete) > 0 {
			for _, idx := range opts.Delete {
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
		}

		// Phase 2: Move operations (on array with markers still present).
		if len(opts.Move) >= 2 {
			for i := 0; i+1 < len(opts.Move); i += 2 {
				n := len(list)
				if n == 0 {
					break
				}
				fromI := ((opts.Move[i] % n) + n) % n
				toI := ((opts.Move[i+1] % n) + n) % n
				entry := list[fromI]
				list = append(list[:fromI], list[fromI+1:]...)
				newList := make([]any, len(list)+1)
				copy(newList, list[:toI])
				newList[toI] = entry
				copy(newList[toI+1:], list[toI:])
				list = newList
			}
		}

		// Phase 3: Filter out deleted entries.
		if len(opts.Delete) > 0 {
			filtered := make([]any, 0, len(list))
			for _, v := range list {
				if _, ok := v.(sentinel); !ok {
					filtered = append(filtered, v)
				}
			}
			list = filtered
		}
	}

	// Phase 4: Custom modification (matches TS mods.custom).
	if opts.Custom != nil {
		if newList := opts.Custom(list); newList != nil {
			list = newList
		}
	}

	return list
}

// deepEqual compares two values for deep equality.
// Used internally for testing.
func deepEqual(a, b any) bool {
	return reflect.DeepEqual(a, b)
}

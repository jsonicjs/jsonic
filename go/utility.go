package jsonic

import (
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
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

// IsFuncRef checks if a string is a function reference (starts with "@").
func IsFuncRef(s string) bool {
	return len(s) > 0 && s[0] == '@'
}

// RequireRef looks up a FuncRef in the ref map and returns an error if not found.
func RequireRef(ref map[FuncRef]any, name string, kind string) (any, error) {
	if ref == nil {
		return nil, fmt.Errorf("Grammar: unknown %s function reference: %s (no ref map)", kind, name)
	}
	fn, ok := ref[name]
	if !ok {
		return nil, fmt.Errorf("Grammar: unknown %s function reference: %s", kind, name)
	}
	return fn, nil
}

// LookupRef looks up a FuncRef in the ref map. Returns nil if not found.
func LookupRef(ref map[FuncRef]any, name string) any {
	if ref == nil {
		return nil
	}
	return ref[name]
}

// MapToOptions converts a map[string]any (with resolved FuncRefs) to an Options struct.
// Only handles fields that are commonly set via grammar options.
func MapToOptions(m map[string]any) Options {
	var opts Options

	if v, ok := m["tag"].(string); ok {
		opts.Tag = v
	}

	// safe
	if safe, ok := m["safe"].(map[string]any); ok {
		opts.Safe = &SafeOptions{}
		if key, ok := safe["key"].(bool); ok {
			opts.Safe.Key = &key
		}
	}

	// fixed
	if fm, ok := m["fixed"].(map[string]any); ok {
		opts.Fixed = &FixedOptions{}
		if lex, ok := fm["lex"].(bool); ok {
			opts.Fixed.Lex = &lex
		}
	}

	// space
	if sp, ok := m["space"].(map[string]any); ok {
		opts.Space = &SpaceOptions{}
		if lex, ok := sp["lex"].(bool); ok {
			opts.Space.Lex = &lex
		}
		if chars, ok := sp["chars"].(string); ok {
			opts.Space.Chars = chars
		}
	}

	// line
	if ln, ok := m["line"].(map[string]any); ok {
		opts.Line = &LineOptions{}
		if lex, ok := ln["lex"].(bool); ok {
			opts.Line.Lex = &lex
		}
		if chars, ok := ln["chars"].(string); ok {
			opts.Line.Chars = chars
		}
		if rowChars, ok := ln["rowChars"].(string); ok {
			opts.Line.RowChars = rowChars
		}
		if single, ok := ln["single"].(bool); ok {
			opts.Line.Single = &single
		}
	}

	// text
	if tm, ok := m["text"].(map[string]any); ok {
		opts.Text = &TextOptions{}
		if lex, ok := tm["lex"].(bool); ok {
			opts.Text.Lex = &lex
		}
	}

	// number
	if nm, ok := m["number"].(map[string]any); ok {
		opts.Number = &NumberOptions{}
		if lex, ok := nm["lex"].(bool); ok {
			opts.Number.Lex = &lex
		}
		if hex, ok := nm["hex"].(bool); ok {
			opts.Number.Hex = &hex
		}
		if oct, ok := nm["oct"].(bool); ok {
			opts.Number.Oct = &oct
		}
		if bin, ok := nm["bin"].(bool); ok {
			opts.Number.Bin = &bin
		}
		if sep, ok := nm["sep"].(string); ok {
			opts.Number.Sep = sep
		}
		if fn, ok := nm["exclude"].(func(string) bool); ok {
			opts.Number.Exclude = fn
		} else if re, ok := nm["exclude"].(*regexp.Regexp); ok {
			opts.Number.Exclude = func(s string) bool {
				return re.MatchString(s)
			}
		}
	}

	// comment
	if cm, ok := m["comment"].(map[string]any); ok {
		opts.Comment = &CommentOptions{}
		if lex, ok := cm["lex"].(bool); ok {
			opts.Comment.Lex = &lex
		}
		if defm, ok := cm["def"].(map[string]any); ok {
			opts.Comment.Def = make(map[string]*CommentDef, len(defm))
			for k, v := range defm {
				dm, ok := v.(map[string]any)
				if !ok {
					continue
				}
				cd := &CommentDef{}
				if line, ok := dm["line"].(bool); ok {
					cd.Line = line
				}
				if start, ok := dm["start"].(string); ok {
					cd.Start = start
				}
				if end, ok := dm["end"].(string); ok {
					cd.End = end
				}
				if lex, ok := dm["lex"].(bool); ok {
					cd.Lex = &lex
				}
				if eatline, ok := dm["eatline"].(bool); ok {
					cd.EatLine = &eatline
				}
				// Suffix round-trip via text: accept string or array.
				// The LexMatcher form requires the typed Go API.
				if suffix, ok := dm["suffix"]; ok {
					switch v := suffix.(type) {
					case string:
						cd.Suffix = v
					case []any:
						strs := make([]string, 0, len(v))
						for _, el := range v {
							if s, ok := el.(string); ok {
								strs = append(strs, s)
							}
						}
						cd.Suffix = strs
					case []string:
						cd.Suffix = v
					}
				}
				opts.Comment.Def[k] = cd
			}
		}
	}

	// string
	if sm, ok := m["string"].(map[string]any); ok {
		opts.String = &StringOptions{}
		if lex, ok := sm["lex"].(bool); ok {
			opts.String.Lex = &lex
		}
		if chars, ok := sm["chars"].(string); ok {
			opts.String.Chars = chars
		}
		if multiChars, ok := sm["multiChars"].(string); ok {
			opts.String.MultiChars = multiChars
		}
		if escapeChar, ok := sm["escapeChar"].(string); ok {
			opts.String.EscapeChar = escapeChar
		}
		if allowUnknown, ok := sm["allowUnknown"].(bool); ok {
			opts.String.AllowUnknown = &allowUnknown
		}
		if abandon, ok := sm["abandon"].(bool); ok {
			opts.String.Abandon = &abandon
		}
		if esc, ok := sm["escape"].(map[string]any); ok {
			opts.String.Escape = make(map[string]string, len(esc))
			for k, v := range esc {
				if s, ok := v.(string); ok {
					opts.String.Escape[k] = s
				}
			}
		}
		if rep, ok := sm["replace"].(map[string]any); ok {
			opts.String.Replace = make(map[rune]string, len(rep))
			for k, v := range rep {
				if len(k) > 0 {
					if s, ok := v.(string); ok {
						opts.String.Replace[rune(k[0])] = s
					}
				}
			}
		}
	}

	// map
	if mm, ok := m["map"].(map[string]any); ok {
		opts.Map = &MapOptions{}
		if ext, ok := mm["extend"].(bool); ok {
			opts.Map.Extend = &ext
		}
		if child, ok := mm["child"].(bool); ok {
			opts.Map.Child = &child
		}
		if fn, ok := mm["merge"].(func(any, any, *Rule, *Context) any); ok {
			opts.Map.Merge = fn
		}
	}

	// list
	if lm, ok := m["list"].(map[string]any); ok {
		opts.List = &ListOptions{}
		if prop, ok := lm["property"].(bool); ok {
			opts.List.Property = &prop
		}
		if pair, ok := lm["pair"].(bool); ok {
			opts.List.Pair = &pair
		}
		if child, ok := lm["child"].(bool); ok {
			opts.List.Child = &child
		}
	}

	// value
	if vm, ok := m["value"].(map[string]any); ok {
		opts.Value = &ValueOptions{}
		if lex, ok := vm["lex"].(bool); ok {
			opts.Value.Lex = &lex
		}
		if defm, ok := vm["def"].(map[string]any); ok {
			opts.Value.Def = make(map[string]*ValueDef, len(defm))
			for k, v := range defm {
				switch vv := v.(type) {
				case map[string]any:
					vd := &ValueDef{}
					if val, ok := vv["val"]; ok {
						vd.Val = val
						if fn, ok := val.(func([]string) any); ok {
							vd.ValFunc = fn
						}
					}
					if m, ok := vv["match"].(*regexp.Regexp); ok {
						vd.Match = m
					}
					if c, ok := vv["consume"].(bool); ok {
						vd.Consume = c
					}
					opts.Value.Def[k] = vd
				case nil, bool:
					// nil or false removes the value def
				}
			}
		}
	}

	// ender
	if ender, ok := m["ender"]; ok {
		switch v := ender.(type) {
		case string:
			opts.Ender = []string{v}
		case []any:
			for _, item := range v {
				if s, ok := item.(string); ok {
					opts.Ender = append(opts.Ender, s)
				}
			}
		}
	}

	// rule
	if rm, ok := m["rule"].(map[string]any); ok {
		opts.Rule = &RuleOptions{}
		if start, ok := rm["start"].(string); ok {
			opts.Rule.Start = start
		}
		if finish, ok := rm["finish"].(bool); ok {
			opts.Rule.Finish = &finish
		}
		if include, ok := rm["include"].(string); ok {
			opts.Rule.Include = include
		}
		if exclude, ok := rm["exclude"].(string); ok {
			opts.Rule.Exclude = exclude
		}
	}

	// lex
	if lx, ok := m["lex"].(map[string]any); ok {
		opts.Lex = &LexOptions{}
		if empty, ok := lx["empty"].(bool); ok {
			opts.Lex.Empty = &empty
		}
		if emptyResult, ok := lx["emptyResult"]; ok {
			opts.Lex.EmptyResult = emptyResult
		}
	}

	// error
	if em, ok := m["error"].(map[string]any); ok {
		opts.Error = make(map[string]string, len(em))
		for k, v := range em {
			if s, ok := v.(string); ok {
				opts.Error[k] = s
			}
		}
	}

	// hint
	if hm, ok := m["hint"].(map[string]any); ok {
		opts.Hint = make(map[string]string, len(hm))
		for k, v := range hm {
			if s, ok := v.(string); ok {
				opts.Hint[k] = s
			}
		}
	}

	// errmsg
	if em, ok := m["errmsg"].(map[string]any); ok {
		opts.ErrMsg = &ErrMsgOptions{}
		if name, ok := em["name"].(string); ok {
			opts.ErrMsg.Name = name
		}
		if suffix, ok := em["suffix"]; ok {
			// TS accepts bool | string | function; only the JSON-serialisable
			// subset round-trips through a jsonic text source, so we only
			// pass those along. Functions need the typed API.
			switch v := suffix.(type) {
			case bool, string:
				opts.ErrMsg.Suffix = v
			}
		}
	}

	// match
	if mm, ok := m["match"].(map[string]any); ok {
		opts.Match = &MatchOptions{}
		if lex, ok := mm["lex"].(bool); ok {
			opts.Match.Lex = &lex
		}
		if tok, ok := mm["token"].(map[string]any); ok {
			opts.Match.Token = make(map[string]*regexp.Regexp, len(tok))
			for name, v := range tok {
				if re, ok := v.(*regexp.Regexp); ok {
					opts.Match.Token[name] = re
				}
			}
		}
		if val, ok := mm["value"].(map[string]any); ok {
			opts.Match.Value = make(map[string]*MatchValueSpec, len(val))
			for name, v := range val {
				if spec, ok := v.(map[string]any); ok {
					mvs := &MatchValueSpec{}
					if re, ok := spec["match"].(*regexp.Regexp); ok {
						mvs.Match = re
					}
					if fn, ok := spec["val"].(func([]string) any); ok {
						mvs.Val = fn
					}
					opts.Match.Value[name] = mvs
				}
			}
		}
	}

	// tokenSet
	if ts, ok := m["tokenSet"].(map[string]any); ok {
		opts.TokenSet = make(map[string][]string, len(ts))
		for name, v := range ts {
			switch arr := v.(type) {
			case []any:
				var names []string
				for _, item := range arr {
					if s, ok := item.(string); ok {
						names = append(names, s)
					}
				}
				opts.TokenSet[name] = names
			case []string:
				opts.TokenSet[name] = arr
			}
		}
	}

	// info
	if im, ok := m["info"].(map[string]any); ok {
		opts.Info = &InfoOptions{}
		if v, ok := im["map"].(bool); ok {
			opts.Info.Map = &v
		}
		if v, ok := im["list"].(bool); ok {
			opts.Info.List = &v
		}
		if v, ok := im["text"].(bool); ok {
			opts.Info.Text = &v
		}
		if v, ok := im["marker"].(string); ok {
			opts.Info.Marker = v
		}
	}

	// color
	if cm, ok := m["color"].(map[string]any); ok {
		opts.Color = &ColorOptions{}
		if v, ok := cm["active"].(bool); ok {
			opts.Color.Active = &v
		}
		if v, ok := cm["reset"].(string); ok {
			opts.Color.Reset = v
		}
		if v, ok := cm["hi"].(string); ok {
			opts.Color.Hi = v
		}
		if v, ok := cm["lo"].(string); ok {
			opts.Color.Lo = v
		}
		if v, ok := cm["line"].(string); ok {
			opts.Color.Line = v
		}
	}

	return opts
}

// ResolveFuncRefs recursively resolves FuncRef strings in a map[string]any:
//   - "@@prefix" → literal "@prefix"
//   - "@SKIP" → Skip sentinel
//   - "@/pattern/flags" → *regexp.Regexp
//   - "@name" → function from ref map
func ResolveFuncRefs(obj any, ref map[FuncRef]any) any {
	if obj == nil {
		return nil
	}
	if s, ok := obj.(string); ok && len(s) > 0 && s[0] == '@' {
		// Escape: @@ → literal @-prefixed string
		if len(s) > 1 && s[1] == '@' {
			return s[1:]
		}
		// Sentinel: @SKIP → Skip
		if s == "@SKIP" {
			return Skip
		}
		// Regex: @/pattern/flags → *regexp.Regexp
		if len(s) > 2 && s[1] == '/' {
			if idx := strings.LastIndex(s, "/"); idx > 1 {
				pattern := s[2:idx]
				flags := s[idx+1:]
				if flags != "" {
					pattern = "(?" + flags + ")" + pattern
				}
				re, err := regexp.Compile(pattern)
				if err == nil {
					return re
				}
			}
		}
		// FuncRef: @name → function from ref
		if ref != nil {
			if fn, ok := ref[s]; ok {
				return fn
			}
		}
		return obj
	}

	// Recurse into maps
	if m, ok := obj.(map[string]any); ok {
		out := make(map[string]any, len(m))
		for k, v := range m {
			out[k] = ResolveFuncRefs(v, ref)
		}
		return out
	}

	// Recurse into slices
	if arr, ok := obj.([]any); ok {
		out := make([]any, len(arr))
		for i, v := range arr {
			out[i] = ResolveFuncRefs(v, ref)
		}
		return out
	}

	return obj
}

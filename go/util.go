package jsonic

import "sort"

// Util exposes helper functions that plugins commonly need, mirroring
// TS jsonic.util (src/jsonic.ts:109). The fields point at package-level
// functions so plugin authors porting from TS can keep calls shaped like
// `j.Util().Deep(a, b)` instead of re-importing each helper.
type UtilBag struct {
	Deep       func(base any, rest ...any) any
	Keys       func(m map[string]any) []string
	Values     func(m map[string]any) []any
	Entries    func(m map[string]any) []Entry
	Omap       func(m map[string]any, fn func(Entry) []any) map[string]any
	Str        func(val any, maxlen int) string
	StrInject  func(template string, vals any) string
}

// Entry is a (key, value) pair returned by Entries. Matches the 2-tuple
// shape of TS Object.entries(), but as a struct for Go ergonomics.
type Entry struct {
	Key   string
	Value any
}

// Keys returns the map's keys in sorted order. Matches TS Object.keys()
// with null-safety — a nil map returns an empty slice.
func Keys(m map[string]any) []string {
	if m == nil {
		return []string{}
	}
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

// Values returns the map's values in key-sorted order. Matches TS
// Object.values() with null-safety.
func Values(m map[string]any) []any {
	if m == nil {
		return []any{}
	}
	out := make([]any, 0, len(m))
	for _, k := range Keys(m) {
		out = append(out, m[k])
	}
	return out
}

// Entries returns (key, value) pairs in key-sorted order. Matches TS
// Object.entries() with null-safety.
func Entries(m map[string]any) []Entry {
	if m == nil {
		return []Entry{}
	}
	out := make([]Entry, 0, len(m))
	for _, k := range Keys(m) {
		out = append(out, Entry{Key: k, Value: m[k]})
	}
	return out
}

// Omap maps over an object's entries. For each entry, fn returns a slice
// of alternating key/value items: `[k, v]` renames/rewrites the pair;
// `[k, v, k2, v2, ...]` adds extra keys; `[nil, _]` drops the entry.
// Mirrors TS omap (src/utility.ts:44).
func Omap(m map[string]any, fn func(Entry) []any) map[string]any {
	out := map[string]any{}
	if m == nil {
		return out
	}
	for _, e := range Entries(m) {
		var me []any
		if fn != nil {
			me = fn(e)
		} else {
			me = []any{e.Key, e.Value}
		}
		if len(me) < 2 || me[0] == nil {
			// drop
		} else if k, ok := me[0].(string); ok {
			out[k] = me[1]
		}
		i := 2
		for i+1 < len(me) && me[i] != nil {
			if k, ok := me[i].(string); ok {
				out[k] = me[i+1]
			}
			i += 2
		}
	}
	return out
}

// Util returns a UtilBag of helper functions. Matches TS jsonic.util.
// The returned bag is a thin pointer wrapper over the package-level
// helpers — safe to cache and call from any goroutine.
func (j *Jsonic) Util() UtilBag {
	return UtilBag{
		Deep:      Deep,
		Keys:      Keys,
		Values:    Values,
		Entries:   Entries,
		Omap:      Omap,
		Str:       Str,
		StrInject: StrInject,
	}
}

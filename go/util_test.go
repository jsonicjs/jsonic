package jsonic

import (
	"reflect"
	"testing"
)

// Tests for the Util bag and its helpers. Mirrors the TS util functions
// (src/utility.ts: keys, values, entries, omap) under TS jsonic.util.

func TestKeys_NilMapReturnsEmpty(t *testing.T) {
	if got := Keys(nil); !reflect.DeepEqual(got, []string{}) {
		t.Errorf("expected [], got %v", got)
	}
}

func TestKeys_Sorted(t *testing.T) {
	m := map[string]any{"b": 2, "a": 1, "c": 3}
	if got := Keys(m); !reflect.DeepEqual(got, []string{"a", "b", "c"}) {
		t.Errorf("expected sorted, got %v", got)
	}
}

func TestValues_NilMapReturnsEmpty(t *testing.T) {
	if got := Values(nil); !reflect.DeepEqual(got, []any{}) {
		t.Errorf("expected [], got %v", got)
	}
}

func TestValues_KeySortedOrder(t *testing.T) {
	m := map[string]any{"b": 2, "a": 1, "c": 3}
	if got := Values(m); !reflect.DeepEqual(got, []any{1, 2, 3}) {
		t.Errorf("expected [1 2 3], got %v", got)
	}
}

func TestEntries_NilMapReturnsEmpty(t *testing.T) {
	if got := Entries(nil); !reflect.DeepEqual(got, []Entry{}) {
		t.Errorf("expected [], got %v", got)
	}
}

func TestEntries_KeySortedOrder(t *testing.T) {
	m := map[string]any{"b": 2, "a": 1}
	got := Entries(m)
	want := []Entry{{Key: "a", Value: 1}, {Key: "b", Value: 2}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("expected %v, got %v", want, got)
	}
}

func TestOmap_Identity(t *testing.T) {
	m := map[string]any{"a": 1, "b": 2}
	got := Omap(m, nil)
	if !reflect.DeepEqual(got, m) {
		t.Errorf("identity omap: expected %v, got %v", m, got)
	}
}

func TestOmap_Rewrite(t *testing.T) {
	m := map[string]any{"a": 1}
	got := Omap(m, func(e Entry) []any {
		return []any{e.Key + "X", e.Value.(int) * 10}
	})
	if !reflect.DeepEqual(got, map[string]any{"aX": 10}) {
		t.Errorf("expected rewritten map, got %v", got)
	}
}

func TestOmap_Drop(t *testing.T) {
	m := map[string]any{"a": 1, "b": 2}
	got := Omap(m, func(e Entry) []any {
		if e.Key == "a" {
			return []any{nil, nil}
		}
		return []any{e.Key, e.Value}
	})
	if !reflect.DeepEqual(got, map[string]any{"b": 2}) {
		t.Errorf("expected b-only map, got %v", got)
	}
}

func TestOmap_ExtraPairs(t *testing.T) {
	m := map[string]any{"a": 1}
	got := Omap(m, func(e Entry) []any {
		return []any{e.Key, e.Value, "extra", 99}
	})
	want := map[string]any{"a": 1, "extra": 99}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("expected %v, got %v", want, got)
	}
}

func TestJsonic_Util_ExposesHelpers(t *testing.T) {
	j := Make()
	u := j.Util()

	if u.Deep == nil || u.Keys == nil || u.Values == nil ||
		u.Entries == nil || u.Omap == nil || u.Str == nil || u.StrInject == nil {
		t.Fatalf("Util bag has nil helper fields: %+v", u)
	}

	// Sanity-check one of each, to ensure they're wired to the real functions.
	merged := u.Deep(map[string]any{"a": 1}, map[string]any{"b": 2}).(map[string]any)
	if merged["a"] != 1 || merged["b"] != 2 {
		t.Errorf("Util().Deep failed: %v", merged)
	}
	if ks := u.Keys(map[string]any{"x": 1}); !reflect.DeepEqual(ks, []string{"x"}) {
		t.Errorf("Util().Keys failed: %v", ks)
	}
}

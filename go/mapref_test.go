package jsonic

import (
	"testing"
)

// expectMapRef parses input with MapRef enabled and checks the result.
func expectMapRef(t *testing.T, input string, expected any) {
	t.Helper()
	j := Make(Options{MapRef: boolPtr(true)})
	got, err := j.Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	if !mapRefEqual(got, expected) {
		t.Errorf("Parse(%q)\n  got:      %#v\n  expected: %#v",
			input, got, expected)
	}
}

// mapRefEqual compares values including MapRef structs.
func mapRefEqual(a, b any) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	switch av := a.(type) {
	case MapRef:
		bv, ok := b.(MapRef)
		if !ok {
			return false
		}
		if av.Implicit != bv.Implicit {
			return false
		}
		if len(av.Val) != len(bv.Val) {
			return false
		}
		for k, v := range av.Val {
			bval, exists := bv.Val[k]
			if !exists || !mapRefEqual(v, bval) {
				return false
			}
		}
		// Meta: treat nil and empty map as equal
		if len(av.Meta) != 0 || len(bv.Meta) != 0 {
			if len(av.Meta) != len(bv.Meta) {
				return false
			}
			for k, v := range av.Meta {
				bval, exists := bv.Meta[k]
				if !exists || !mapRefEqual(v, bval) {
					return false
				}
			}
		}
		return true
	case map[string]any:
		bv, ok := b.(map[string]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for k, v := range av {
			bval, exists := bv[k]
			if !exists || !mapRefEqual(v, bval) {
				return false
			}
		}
		return true
	case []any:
		bv, ok := b.([]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for i := range av {
			if !mapRefEqual(av[i], bv[i]) {
				return false
			}
		}
		return true
	case float64:
		bv, ok := b.(float64)
		return ok && av == bv
	case bool:
		bv, ok := b.(bool)
		return ok && av == bv
	case string:
		bv, ok := b.(string)
		return ok && av == bv
	default:
		return false
	}
}

// mr is shorthand to create a MapRef value.
func mr(implicit bool, pairs ...any) MapRef {
	m := make(map[string]any)
	for i := 0; i+1 < len(pairs); i += 2 {
		k, _ := pairs[i].(string)
		m[k] = pairs[i+1]
	}
	return MapRef{Val: m, Implicit: implicit}
}

func TestMapRefOff(t *testing.T) {
	// Default (MapRef off) - plain map[string]any in output.
	j := Make()
	got, err := j.Parse("{a:1}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(map[string]any); !ok {
		t.Errorf("expected map[string]any, got %T: %#v", got, got)
	}
}

func TestMapRefExplicitOff(t *testing.T) {
	// Explicitly setting MapRef to false.
	j := Make(Options{MapRef: boolPtr(false)})
	got, err := j.Parse("{a:1}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(map[string]any); !ok {
		t.Errorf("expected map[string]any, got %T: %#v", got, got)
	}
}

func TestMapRefExplicitMap(t *testing.T) {
	// Explicit map with braces: not implicit.
	expectMapRef(t, "{a:1,b:2}", mr(false, "a", 1.0, "b", 2.0))
}

func TestMapRefExplicitEmpty(t *testing.T) {
	// Empty explicit map.
	expectMapRef(t, "{}", mr(false))
}

func TestMapRefImplicitMap(t *testing.T) {
	// Implicit map via key:value without braces.
	expectMapRef(t, "a:1", mr(true, "a", 1.0))
}

func TestMapRefImplicitMultipleKeys(t *testing.T) {
	// Implicit map with multiple keys.
	expectMapRef(t, "a:1,b:2", mr(true, "a", 1.0, "b", 2.0))
}

func TestMapRefImplicitSpaceSeparated(t *testing.T) {
	// Implicit map with space-separated pairs.
	expectMapRef(t, "a:1 b:2", mr(true, "a", 1.0, "b", 2.0))
}

func TestMapRefNestedExplicit(t *testing.T) {
	// Nested explicit maps.
	expectMapRef(t, "{a:{b:1}}", mr(false, "a", mr(false, "b", 1.0)))
}

func TestMapRefNestedImplicitInExplicit(t *testing.T) {
	// Implicit map nested inside explicit map value (via pair dive).
	expectMapRef(t, "{a:b:1}", mr(false, "a", mr(true, "b", 1.0)))
}

func TestMapRefListsUnaffected(t *testing.T) {
	// Lists should not be wrapped in MapRef.
	j := Make(Options{MapRef: boolPtr(true)})
	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.([]any); !ok {
		t.Errorf("expected []any, got %T: %#v", got, got)
	}
}

func TestMapRefScalarsUnaffected(t *testing.T) {
	// Scalars should not be affected.
	j := Make(Options{MapRef: boolPtr(true)})

	got, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f, ok := got.(float64); !ok || f != 42.0 {
		t.Errorf("expected 42.0, got %#v", got)
	}

	got, err = j.Parse("true")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if b, ok := got.(bool); !ok || b != true {
		t.Errorf("expected true, got %#v", got)
	}
}

func TestMapRefDeepMerge(t *testing.T) {
	// Extension (deep merge) with MapRef enabled.
	expectMapRef(t, "a:{b:1},a:{c:2}", mr(true, "a", mr(false, "b", 1.0, "c", 2.0)))
}

func TestMapRefMapInList(t *testing.T) {
	// MapRef inside a list.
	j := Make(Options{MapRef: boolPtr(true)})
	got, err := j.Parse("[{a:1},{b:2}]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	arr, ok := got.([]any)
	if !ok {
		t.Fatalf("expected []any, got %T: %#v", got, got)
	}
	if len(arr) != 2 {
		t.Fatalf("expected 2 elements, got %d", len(arr))
	}
	m0, ok := arr[0].(MapRef)
	if !ok {
		t.Errorf("expected MapRef for element 0, got %T: %#v", arr[0], arr[0])
	} else if m0.Implicit || len(m0.Val) != 1 || m0.Val["a"] != 1.0 {
		t.Errorf("element 0: expected {a:1} explicit, got %#v", m0)
	}
	m1, ok := arr[1].(MapRef)
	if !ok {
		t.Errorf("expected MapRef for element 1, got %T: %#v", arr[1], arr[1])
	} else if m1.Implicit || len(m1.Val) != 1 || m1.Val["b"] != 2.0 {
		t.Errorf("element 1: expected {b:2} explicit, got %#v", m1)
	}
}

func TestMapRefWithStringValues(t *testing.T) {
	expectMapRef(t, `{a:"hello",b:"world"}`, mr(false, "a", "hello", "b", "world"))
}

func TestMapRefCombinedWithListRef(t *testing.T) {
	// Both MapRef and ListRef enabled.
	j := Make(Options{MapRef: boolPtr(true), ListRef: boolPtr(true)})
	got, err := j.Parse("{a:[1,2]}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T: %#v", got, got)
	}
	if m.Implicit {
		t.Errorf("expected Implicit=false for braced map")
	}
	listVal, ok := m.Val["a"].(ListRef)
	if !ok {
		t.Fatalf("expected ListRef for key 'a', got %T: %#v", m.Val["a"], m.Val["a"])
	}
	if listVal.Implicit {
		t.Errorf("expected Implicit=false for bracketed list")
	}
	if len(listVal.Val) != 2 {
		t.Fatalf("expected 2 elements, got %d", len(listVal.Val))
	}
}

func TestMapRefCombinedWithTextInfo(t *testing.T) {
	// Both MapRef and TextInfo enabled.
	j := Make(Options{MapRef: boolPtr(true), TextInfo: boolPtr(true)})
	got, err := j.Parse(`{"a":1}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T: %#v", got, got)
	}
	if m.Implicit {
		t.Errorf("expected Implicit=false for braced map")
	}
}

func TestMapRefSingleKey(t *testing.T) {
	// Single key explicit map.
	expectMapRef(t, "{a:1}", mr(false, "a", 1.0))
}

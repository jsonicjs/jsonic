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
func mr(implicit bool, args ...any) MapRef {
	result := make(map[string]any)
	for i := 0; i+1 < len(args); i += 2 {
		key, _ := args[i].(string)
		result[key] = args[i+1]
	}
	return MapRef{Val: result, Implicit: implicit}
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
	// Implicit map (no braces): a:1
	expectMapRef(t, "a:1", mr(true, "a", 1.0))
}

func TestMapRefImplicitMultipleKeys(t *testing.T) {
	// Implicit map with multiple keys.
	expectMapRef(t, "a:1,b:2", mr(true, "a", 1.0, "b", 2.0))
}

func TestMapRefImplicitNewlineSep(t *testing.T) {
	// Implicit map with newline-separated pairs.
	expectMapRef(t, "a:1\nb:2", mr(true, "a", 1.0, "b", 2.0))
}

func TestMapRefNestedExplicit(t *testing.T) {
	// Nested explicit maps.
	expectMapRef(t, "{a:{b:1}}", mr(false, "a", mr(false, "b", 1.0)))
}

func TestMapRefNestedImplicit(t *testing.T) {
	// Implicit outer, explicit inner.
	expectMapRef(t, "a:{b:1}", mr(true, "a", mr(false, "b", 1.0)))
}

func TestMapRefPathDive(t *testing.T) {
	// Path dive creates nested implicit maps.
	expectMapRef(t, "a:b:c", mr(true, "a", mr(true, "b", "c")))
}

func TestMapRefInList(t *testing.T) {
	// Maps inside a list.
	expectMapRef(t, "[{a:1},{b:2}]", []any{
		mr(false, "a", 1.0),
		mr(false, "b", 2.0),
	})
}

func TestMapRefListsUnaffected(t *testing.T) {
	// Lists remain []any when only MapRef is enabled.
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
	j := Make(Options{MapRef: boolPtr(true)})
	got, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f, ok := got.(float64); !ok || f != 42.0 {
		t.Errorf("expected 42.0, got %#v", got)
	}
}

func TestMapRefDeepMerge(t *testing.T) {
	// Extension (deep merge) with MapRef.
	expectMapRef(t, "a:{b:1,c:2},a:{c:3,e:4}",
		mr(true, "a", mr(false, "b", 1.0, "c", 3.0, "e", 4.0)))
}

func TestMapRefNullValue(t *testing.T) {
	expectMapRef(t, "a:", mr(true, "a", nil))
}

func TestMapRefExplicitNullValue(t *testing.T) {
	expectMapRef(t, "{a:}", mr(false, "a", nil))
}

func TestMapRefWithListValue(t *testing.T) {
	expectMapRef(t, "a:[1,2]", mr(true, "a", []any{1.0, 2.0}))
}

func TestMapRefExplicitWithListValue(t *testing.T) {
	expectMapRef(t, "{a:[1,2]}", mr(false, "a", []any{1.0, 2.0}))
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
	l, ok := m.Val["a"].(ListRef)
	if !ok {
		t.Fatalf("expected ListRef for value, got %T: %#v", m.Val["a"], m.Val["a"])
	}
	if l.Implicit {
		t.Errorf("expected Implicit=false for bracketed list")
	}
	if len(l.Val) != 2 || l.Val[0] != 1.0 || l.Val[1] != 2.0 {
		t.Errorf("expected [1.0, 2.0], got %#v", l.Val)
	}
}

func TestMapRefCombinedWithTextInfo(t *testing.T) {
	// Both MapRef and TextInfo enabled.
	j := Make(Options{MapRef: boolPtr(true), TextInfo: boolPtr(true)})
	got, err := j.Parse(`a:"hello"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T: %#v", got, got)
	}
	if !m.Implicit {
		t.Errorf("expected Implicit=true for unbraced map")
	}
	txt, ok := m.Val["a"].(Text)
	if !ok {
		t.Fatalf("expected Text value, got %T: %#v", m.Val["a"], m.Val["a"])
	}
	if txt.Quote != `"` || txt.Str != "hello" {
		t.Errorf("expected Text{Quote:`\"`, Str:\"hello\"}, got %#v", txt)
	}
}

func TestMapRefSpaceSeparatedMaps(t *testing.T) {
	// Space-separated maps create a list of maps.
	j := Make(Options{MapRef: boolPtr(true)})
	got, err := j.Parse("{a:1} {b:2}")
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
	for i, expected := range []MapRef{
		mr(false, "a", 1.0),
		mr(false, "b", 2.0),
	} {
		m, ok := arr[i].(MapRef)
		if !ok {
			t.Errorf("element %d: expected MapRef, got %T", i, arr[i])
			continue
		}
		if m.Implicit != expected.Implicit {
			t.Errorf("element %d: Implicit=%v, want %v", i, m.Implicit, expected.Implicit)
		}
		if !mapRefEqual(m, expected) {
			t.Errorf("element %d: got %#v, want %#v", i, m, expected)
		}
	}
}

func TestMapRefAllThreeOptions(t *testing.T) {
	// All three options enabled together.
	j := Make(Options{MapRef: boolPtr(true), ListRef: boolPtr(true), TextInfo: boolPtr(true)})
	got, err := j.Parse(`{a:["hello",'world']}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T", got)
	}
	if m.Implicit {
		t.Errorf("expected Implicit=false")
	}
	l, ok := m.Val["a"].(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T", m.Val["a"])
	}
	if l.Implicit {
		t.Errorf("expected list Implicit=false")
	}
	if len(l.Val) != 2 {
		t.Fatalf("expected 2 elements, got %d", len(l.Val))
	}
	t1, ok := l.Val[0].(Text)
	if !ok || t1.Quote != `"` || t1.Str != "hello" {
		t.Errorf("element 0: expected Text{`\"`,\"hello\"}, got %#v", l.Val[0])
	}
	t2, ok := l.Val[1].(Text)
	if !ok || t2.Quote != "'" || t2.Str != "world" {
		t.Errorf("element 1: expected Text{\"'\",\"world\"}, got %#v", l.Val[1])
	}
}

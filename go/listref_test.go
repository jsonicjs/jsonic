package jsonic

import (
	"testing"
)

// expectListRef parses input with ListRef enabled and checks the result.
func expectListRef(t *testing.T, input string, expected any) {
	t.Helper()
	j := Make(Options{ListRef: boolPtr(true)})
	got, err := j.Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	if !listRefEqual(got, expected) {
		t.Errorf("Parse(%q)\n  got:      %#v\n  expected: %#v",
			input, got, expected)
	}
}

// listRefEqual compares values including ListRef structs.
func listRefEqual(a, b any) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	switch av := a.(type) {
	case ListRef:
		bv, ok := b.(ListRef)
		if !ok {
			return false
		}
		if av.Implicit != bv.Implicit {
			return false
		}
		if len(av.Val) != len(bv.Val) {
			return false
		}
		for i := range av.Val {
			if !listRefEqual(av.Val[i], bv.Val[i]) {
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
			if !exists || !listRefEqual(v, bval) {
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
			if !listRefEqual(av[i], bv[i]) {
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

// lr is shorthand to create a ListRef value.
func lr(implicit bool, vals ...any) ListRef {
	if vals == nil {
		vals = []any{}
	}
	return ListRef{Val: vals, Implicit: implicit}
}

func TestListRefOff(t *testing.T) {
	// Default (ListRef off) - plain []any in output.
	j := Make()
	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.([]any); !ok {
		t.Errorf("expected []any, got %T: %#v", got, got)
	}
}

func TestListRefExplicitOff(t *testing.T) {
	// Explicitly setting ListRef to false.
	j := Make(Options{ListRef: boolPtr(false)})
	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.([]any); !ok {
		t.Errorf("expected []any, got %T: %#v", got, got)
	}
}

func TestListRefExplicitList(t *testing.T) {
	// Explicit list with brackets: not implicit.
	expectListRef(t, "[1,2,3]", lr(false, 1.0, 2.0, 3.0))
}

func TestListRefExplicitEmpty(t *testing.T) {
	// Empty explicit list.
	expectListRef(t, "[]", lr(false))
}

func TestListRefImplicitComma(t *testing.T) {
	// Implicit list via trailing comma: a,b
	expectListRef(t, "a,b", lr(true, "a", "b"))
}

func TestListRefImplicitTrailingComma(t *testing.T) {
	// Trailing comma creates implicit list.
	expectListRef(t, "a,", lr(true, "a"))
}

func TestListRefImplicitSpace(t *testing.T) {
	// Implicit list via space separation: a b c
	expectListRef(t, "a b c", lr(true, "a", "b", "c"))
}

func TestListRefImplicitLeadingComma(t *testing.T) {
	// Leading comma creates implicit list with null first element.
	expectListRef(t, ",a", lr(true, nil, "a"))
}

func TestListRefImplicitCommaOnly(t *testing.T) {
	// Single comma creates implicit list with null element.
	expectListRef(t, ",", lr(true, nil))
}

func TestListRefNestedExplicit(t *testing.T) {
	// Nested explicit lists.
	expectListRef(t, "[[1],[2]]", lr(false,
		lr(false, 1.0),
		lr(false, 2.0),
	))
}

func TestListRefExplicitInMap(t *testing.T) {
	// Explicit list as map value.
	expectListRef(t, "a:[1,2]", map[string]any{
		"a": lr(false, 1.0, 2.0),
	})
}

func TestListRefMixedImplicitExplicit(t *testing.T) {
	// Implicit list of explicit lists.
	expectListRef(t, "[a],[b]", lr(true,
		lr(false, "a"),
		lr(false, "b"),
	))
}

func TestListRefSpaceSeparatedLists(t *testing.T) {
	// Space-separated explicit lists.
	expectListRef(t, "[a] [b]", lr(true,
		lr(false, "a"),
		lr(false, "b"),
	))
}

func TestListRefMapsUnaffected(t *testing.T) {
	// Maps should not be wrapped in ListRef.
	j := Make(Options{ListRef: boolPtr(true)})
	got, err := j.Parse("a:1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(map[string]any); !ok {
		t.Errorf("expected map[string]any, got %T: %#v", got, got)
	}
}

func TestListRefScalarsUnaffected(t *testing.T) {
	// Scalars should not be affected.
	j := Make(Options{ListRef: boolPtr(true)})

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

func TestListRefDeepMerge(t *testing.T) {
	// Extension (deep merge) with ListRef enabled.
	// a:[{b:1}],a:[{b:2}] merges the arrays.
	expectListRef(t, "a:[{b:1}],a:[{b:2}]", map[string]any{
		"a": lr(false, map[string]any{"b": 2.0}),
	})
}

func TestListRefSpaceSeparatedMaps(t *testing.T) {
	// Space-separated maps create implicit list.
	expectListRef(t, "{a:1} {b:2}", lr(true,
		map[string]any{"a": 1.0},
		map[string]any{"b": 2.0},
	))
}

func TestListRefWithNumbers(t *testing.T) {
	expectListRef(t, "[1,2,3]", lr(false, 1.0, 2.0, 3.0))
	expectListRef(t, "1,2,3", lr(true, 1.0, 2.0, 3.0))
}

func TestListRefImplicitNullCommas(t *testing.T) {
	// Double comma creates null element.
	expectListRef(t, "1,,", lr(true, 1.0, nil))
	expectListRef(t, "1,,,", lr(true, 1.0, nil, nil))
}

func TestListRefSingleElement(t *testing.T) {
	// Single element in brackets.
	expectListRef(t, "[a]", lr(false, "a"))
}

func TestListRefCombinedWithTextInfo(t *testing.T) {
	// Both ListRef and TextInfo enabled.
	j := Make(Options{ListRef: boolPtr(true), TextInfo: boolPtr(true)})
	got, err := j.Parse(`["a",'b',c]`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	if lr.Implicit {
		t.Errorf("expected Implicit=false for bracketed list")
	}
	if len(lr.Val) != 3 {
		t.Fatalf("expected 3 elements, got %d", len(lr.Val))
	}
	// Check elements are Text structs.
	for i, expected := range []Text{
		{Quote: `"`, Str: "a"},
		{Quote: "'", Str: "b"},
		{Quote: "", Str: "c"},
	} {
		if txt, ok := lr.Val[i].(Text); !ok || txt != expected {
			t.Errorf("element %d: expected %#v, got %#v", i, expected, lr.Val[i])
		}
	}
}

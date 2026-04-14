package jsonic

import (
	"testing"
)

// expectBothRef parses input with both MapRef and ListRef enabled and checks the result.
func expectBothRef(t *testing.T, input string, expected any) {
	t.Helper()
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	if !bothRefEqual(got, expected) {
		t.Errorf("Parse(%q)\n  got:      %#v\n  expected: %#v",
			input, got, expected)
	}
}

// bothRefEqual compares values including both ListRef and MapRef structs.
func bothRefEqual(a, b any) bool {
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
			if !exists || !bothRefEqual(v, bval) {
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
				if !exists || !bothRefEqual(v, bval) {
					return false
				}
			}
		}
		return true
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
			if !bothRefEqual(av.Val[i], bv.Val[i]) {
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
				if !exists || !bothRefEqual(v, bval) {
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
			if !exists || !bothRefEqual(v, bval) {
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
			if !bothRefEqual(av[i], bv[i]) {
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

// Shorthand helpers for combined tests.
// blr creates a ListRef (reuses lr name pattern).
func blr(implicit bool, vals ...any) ListRef {
	if vals == nil {
		vals = []any{}
	}
	return ListRef{Val: vals, Implicit: implicit}
}

// bmr creates a MapRef from key-value pairs.
func bmr(implicit bool, pairs ...any) MapRef {
	m := make(map[string]any)
	for i := 0; i+1 < len(pairs); i += 2 {
		k, _ := pairs[i].(string)
		m[k] = pairs[i+1]
	}
	return MapRef{Val: m, Implicit: implicit}
}

// --- Basic combined wrapping ---

func TestBothRefExplicitMapExplicitList(t *testing.T) {
	// {a:[1,2]} → explicit MapRef wrapping explicit ListRef
	expectBothRef(t, "{a:[1,2]}", bmr(false, "a", blr(false, 1.0, 2.0)))
}

func TestBothRefImplicitMapExplicitList(t *testing.T) {
	// a:[1,2] → implicit MapRef wrapping explicit ListRef
	expectBothRef(t, "a:[1,2]", bmr(true, "a", blr(false, 1.0, 2.0)))
}

func TestBothRefExplicitListExplicitMaps(t *testing.T) {
	// [{a:1},{b:2}] → explicit ListRef of explicit MapRefs
	expectBothRef(t, "[{a:1},{b:2}]", blr(false,
		bmr(false, "a", 1.0),
		bmr(false, "b", 2.0),
	))
}

func TestBothRefImplicitListExplicitMaps(t *testing.T) {
	// {a:1},{b:2} → comma creates implicit ListRef of explicit MapRefs
	expectBothRef(t, "{a:1},{b:2}", blr(true,
		bmr(false, "a", 1.0),
		bmr(false, "b", 2.0),
	))
}

func TestBothRefSpaceSeparatedMaps(t *testing.T) {
	// {a:1} {b:2} → space creates implicit ListRef of explicit MapRefs
	expectBothRef(t, "{a:1} {b:2}", blr(true,
		bmr(false, "a", 1.0),
		bmr(false, "b", 2.0),
	))
}

// --- Empty structures ---

func TestBothRefEmptyMapInList(t *testing.T) {
	// [{}] → explicit ListRef containing empty explicit MapRef
	expectBothRef(t, "[{}]", blr(false, bmr(false)))
}

func TestBothRefEmptyListInMap(t *testing.T) {
	// {a:[]} → explicit MapRef containing empty explicit ListRef
	expectBothRef(t, "{a:[]}", bmr(false, "a", blr(false)))
}

func TestBothRefEmptyMapAndListValues(t *testing.T) {
	// {a:[],b:{}} → explicit MapRef with mixed empty values
	expectBothRef(t, "{a:[],b:{}}", bmr(false, "a", blr(false), "b", bmr(false)))
}

// --- Deep nesting ---

func TestBothRefTripleNestingMapListMap(t *testing.T) {
	// {a:[{b:1}]} → MapRef > ListRef > MapRef
	expectBothRef(t, "{a:[{b:1}]}", bmr(false,
		"a", blr(false, bmr(false, "b", 1.0)),
	))
}

func TestBothRefTripleNestingListMapList(t *testing.T) {
	// [{a:[1,2]}] → ListRef > MapRef > ListRef
	expectBothRef(t, "[{a:[1,2]}]", blr(false,
		bmr(false, "a", blr(false, 1.0, 2.0)),
	))
}

func TestBothRefQuadNesting(t *testing.T) {
	// {a:[{b:[1]}]} → MapRef > ListRef > MapRef > ListRef
	expectBothRef(t, "{a:[{b:[1]}]}", bmr(false,
		"a", blr(false,
			bmr(false, "b", blr(false, 1.0)),
		),
	))
}

// --- Path dive ---

func TestBothRefPathDive(t *testing.T) {
	// a:b:1 → implicit MapRef(a: implicit MapRef(b: 1))
	expectBothRef(t, "a:b:1", bmr(true, "a", bmr(true, "b", 1.0)))
}

func TestBothRefPathDiveWithList(t *testing.T) {
	// a:b:[1,2] → implicit MapRef(a: implicit MapRef(b: explicit ListRef))
	expectBothRef(t, "a:b:[1,2]", bmr(true, "a", bmr(true, "b", blr(false, 1.0, 2.0))))
}

func TestBothRefExplicitPathDive(t *testing.T) {
	// {a:b:1} → explicit MapRef(a: implicit MapRef(b: 1))
	expectBothRef(t, "{a:b:1}", bmr(false, "a", bmr(true, "b", 1.0)))
}

// --- Deep merge with both ---

func TestBothRefDeepMergeNestedMapLists(t *testing.T) {
	// a:[{b:1}],a:[{b:2}] → deep merge: ListRef arrays merge, inner MapRef maps merge
	expectBothRef(t, "a:[{b:1}],a:[{b:2}]", bmr(true,
		"a", blr(false, bmr(false, "b", 2.0)),
	))
}

func TestBothRefDeepMergeNestedMaps(t *testing.T) {
	// a:{b:1},a:{c:2} → deep merge: inner MapRefs merge
	expectBothRef(t, "a:{b:1},a:{c:2}", bmr(true,
		"a", bmr(false, "b", 1.0, "c", 2.0),
	))
}

func TestBothRefDeepMergeMapsWithListValues(t *testing.T) {
	// a:{b:[1]},a:{b:[2]} → deep merge: maps merge, then list values merge
	expectBothRef(t, "a:{b:[1]},a:{b:[2]}", bmr(true,
		"a", bmr(false, "b", blr(false, 2.0)),
	))
}

// --- Mixed content in same structure ---

func TestBothRefMapWithMixedValues(t *testing.T) {
	// {a:{x:1},b:[1,2],c:3} → MapRef with MapRef, ListRef, and scalar values
	expectBothRef(t, "{a:{x:1},b:[1,2],c:3}", bmr(false,
		"a", bmr(false, "x", 1.0),
		"b", blr(false, 1.0, 2.0),
		"c", 3.0,
	))
}

func TestBothRefListWithMixedValues(t *testing.T) {
	// [{a:1},[1,2],3] → ListRef with MapRef, ListRef, and scalar values
	expectBothRef(t, "[{a:1},[1,2],3]", blr(false,
		bmr(false, "a", 1.0),
		blr(false, 1.0, 2.0),
		3.0,
	))
}

// --- Implicit structures combined ---

func TestBothRefImplicitListOfImplicitListsInMaps(t *testing.T) {
	// {a:1} {b:2} → implicit ListRef of explicit MapRefs (already tested above, but
	// verify types more explicitly)
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse("{a:1} {b:2}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	outerList, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef at top level, got %T: %#v", got, got)
	}
	if !outerList.Implicit {
		t.Errorf("expected top-level ListRef to be implicit")
	}
	if len(outerList.Val) != 2 {
		t.Fatalf("expected 2 elements, got %d", len(outerList.Val))
	}
	for i, expectedKey := range []string{"a", "b"} {
		m, ok := outerList.Val[i].(MapRef)
		if !ok {
			t.Errorf("element %d: expected MapRef, got %T", i, outerList.Val[i])
			continue
		}
		if m.Implicit {
			t.Errorf("element %d: expected explicit MapRef (braces)", i)
		}
		if _, exists := m.Val[expectedKey]; !exists {
			t.Errorf("element %d: expected key %q", i, expectedKey)
		}
	}
}

// --- Scalars still pass through unchanged ---

func TestBothRefScalarNumber(t *testing.T) {
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f, ok := got.(float64); !ok || f != 42.0 {
		t.Errorf("expected 42.0, got %T: %#v", got, got)
	}
}

func TestBothRefScalarString(t *testing.T) {
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse(`"hello"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s, ok := got.(string); !ok || s != "hello" {
		t.Errorf("expected \"hello\", got %T: %#v", got, got)
	}
}

func TestBothRefScalarBool(t *testing.T) {
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse("true")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if b, ok := got.(bool); !ok || b != true {
		t.Errorf("expected true, got %T: %#v", got, got)
	}
}

func TestBothRefScalarNull(t *testing.T) {
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse("null")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil, got %T: %#v", got, got)
	}
}

// --- Pair in list ---

func TestBothRefPairInList(t *testing.T) {
	// [a:1,b:2] → explicit ListRef with key-value properties
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true), List: boolPtr(true)}})
	got, err := j.Parse("[a:1,b:2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	outerList, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	if outerList.Implicit {
		t.Errorf("expected explicit ListRef (brackets)")
	}
}

// --- JSON compat with both ---

func TestBothRefStrictJSON(t *testing.T) {
	// Standard JSON: {"a": [1, 2], "b": {"c": true}}
	expectBothRef(t, `{"a": [1, 2], "b": {"c": true}}`, bmr(false,
		"a", blr(false, 1.0, 2.0),
		"b", bmr(false, "c", true),
	))
}

func TestBothRefNestedJSONArrays(t *testing.T) {
	// {"a": [[1], [2]]} → nested ListRefs inside MapRef
	expectBothRef(t, `{"a": [[1], [2]]}`, bmr(false,
		"a", blr(false, blr(false, 1.0), blr(false, 2.0)),
	))
}

// --- Implicit list containing maps with list values ---

func TestBothRefImplicitListMapsWithLists(t *testing.T) {
	// {a:[1]} {b:[2]} → implicit ListRef of explicit MapRefs with ListRef values
	expectBothRef(t, "{a:[1]} {b:[2]}", blr(true,
		bmr(false, "a", blr(false, 1.0)),
		bmr(false, "b", blr(false, 2.0)),
	))
}

// --- Deep merge preserves Ref wrappers through merge ---

func TestBothRefDeepMergePreservesMapRef(t *testing.T) {
	// {a:{x:1}},{a:{y:2}} → implicit list but deep merge combines the maps
	// Actually this is an implicit list of two maps, deep merge happens on dup keys inside each
	// Let me use explicit map: {a:{x:1},a:{y:2}}
	expectBothRef(t, "{a:{x:1},a:{y:2}}", bmr(false,
		"a", bmr(false, "x", 1.0, "y", 2.0),
	))
}

func TestBothRefDeepMergePreservesListRef(t *testing.T) {
	// {a:[1,2],a:[3]} → deep merge of ListRef values inside MapRef
	expectBothRef(t, "{a:[1,2],a:[3]}", bmr(false,
		"a", blr(false, 3.0, 2.0),
	))
}

// --- All three options combined ---

func TestBothRefWithTextInfo(t *testing.T) {
	// All three options: MapRef + ListRef + TextInfo
	j := Make(Options{Info: &InfoOptions{
		Map:  boolPtr(true),
		List: boolPtr(true),
		Text: boolPtr(true),
	}})
	got, err := j.Parse(`{a:["x"]}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T: %#v", got, got)
	}
	if m.Implicit {
		t.Errorf("expected explicit MapRef")
	}
	listVal, ok := m.Val["a"].(ListRef)
	if !ok {
		t.Fatalf("expected ListRef for key 'a', got %T: %#v", m.Val["a"], m.Val["a"])
	}
	if listVal.Implicit {
		t.Errorf("expected explicit ListRef")
	}
	if len(listVal.Val) != 1 {
		t.Fatalf("expected 1 element, got %d", len(listVal.Val))
	}
	txt, ok := listVal.Val[0].(Text)
	if !ok {
		t.Fatalf("expected Text, got %T: %#v", listVal.Val[0], listVal.Val[0])
	}
	if txt.Str != "x" || txt.Quote != `"` {
		t.Errorf("expected Text{Quote:`\"`, Str:\"x\"}, got %#v", txt)
	}
}

// --- Comma-separated explicit lists create implicit outer list ---

func TestBothRefCommaSeparatedLists(t *testing.T) {
	// [1],[2] → implicit ListRef of explicit ListRefs
	expectBothRef(t, "[1],[2]", blr(true,
		blr(false, 1.0),
		blr(false, 2.0),
	))
}

// --- Null values in combined structures ---

func TestBothRefNullMapValue(t *testing.T) {
	// {a:null} → explicit MapRef with null value
	expectBothRef(t, "{a:null}", bmr(false, "a", nil))
}

func TestBothRefNullListElements(t *testing.T) {
	// [null,{a:1}] → ListRef with null and MapRef
	expectBothRef(t, "[null,{a:1}]", blr(false, nil, bmr(false, "a", 1.0)))
}

func TestBothRefMapWithNullAndList(t *testing.T) {
	// {a:null,b:[1]} → MapRef with null value and ListRef value
	expectBothRef(t, "{a:null,b:[1]}", bmr(false, "a", nil, "b", blr(false, 1.0)))
}

// --- Meta map ---

func TestMapRefMetaInitialized(t *testing.T) {
	// MapRef.Meta should be initialized as an empty map when MapRef is enabled.
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true)}})
	got, err := j.Parse("{a:1}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T: %#v", got, got)
	}
	if m.Meta == nil {
		t.Errorf("expected Meta to be initialized (non-nil), got nil")
	}
	if len(m.Meta) != 0 {
		t.Errorf("expected Meta to be empty, got %#v", m.Meta)
	}
}

func TestListRefMetaInitialized(t *testing.T) {
	// ListRef.Meta should be initialized as an empty map when ListRef is enabled.
	j := Make(Options{Info: &InfoOptions{List: boolPtr(true)}})
	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	if lr.Meta == nil {
		t.Errorf("expected Meta to be initialized (non-nil), got nil")
	}
	if len(lr.Meta) != 0 {
		t.Errorf("expected Meta to be empty, got %#v", lr.Meta)
	}
}

func TestMapRefMetaAvailableInBOPhase(t *testing.T) {
	// Verify that Meta is available during parsing (set in BO, accessible in BC).
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true)}})

	// Add a custom BO action that writes to Meta
	j.Rule("map", func(rs *RuleSpec) {
		rs.AddBO(func(r *Rule, ctx *Context) {
			if mr, ok := r.Node.(MapRef); ok {
				mr.Meta["created_in"] = "bo"
				r.Node = mr
			}
		})
	})

	got, err := j.Parse("{a:1}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(MapRef)
	if !ok {
		t.Fatalf("expected MapRef, got %T: %#v", got, got)
	}
	if m.Meta["created_in"] != "bo" {
		t.Errorf("expected Meta[\"created_in\"] = \"bo\", got %#v", m.Meta)
	}
}

func TestListRefMetaAvailableInBOPhase(t *testing.T) {
	// Verify that Meta is available during parsing (set in BO, accessible in BC).
	j := Make(Options{Info: &InfoOptions{List: boolPtr(true)}})

	// Add a custom BO action that writes to Meta
	j.Rule("list", func(rs *RuleSpec) {
		rs.AddBO(func(r *Rule, ctx *Context) {
			if lr, ok := r.Node.(ListRef); ok {
				lr.Meta["created_in"] = "bo"
				r.Node = lr
			}
		})
	})

	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	if lr.Meta["created_in"] != "bo" {
		t.Errorf("expected Meta[\"created_in\"] = \"bo\", got %#v", lr.Meta)
	}
}

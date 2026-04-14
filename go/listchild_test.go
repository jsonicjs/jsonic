package jsonic

import (
	"testing"
)

// makeChildParser creates a parser with List.Child enabled.
// ListRef is automatically enabled by list.child.
func makeChildParser() *Jsonic {
	return Make(Options{List: &ListOptions{Child: boolPtr(true)}})
}

// expectChild parses input with list.child enabled and checks Val and Child.
func expectChild(t *testing.T, input string, expectedVal []any, expectedChild any) {
	t.Helper()
	j := makeChildParser()
	got, err := j.Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Errorf("Parse(%q) expected ListRef, got %T: %#v", input, got, got)
		return
	}
	if !bothRefEqual(lr.Val, expectedVal) {
		t.Errorf("Parse(%q) Val\n  got:      %#v\n  expected: %#v", input, lr.Val, expectedVal)
	}
	if !bothRefEqual(lr.Child, expectedChild) {
		t.Errorf("Parse(%q) Child\n  got:      %#v\n  expected: %#v", input, lr.Child, expectedChild)
	}
}

// --- Basic child values ---

func TestListChildNumber(t *testing.T) {
	// [:1] → empty list with child=1
	expectChild(t, "[:1]", []any{}, 1.0)
}

func TestListChildString(t *testing.T) {
	// [:a] → empty list with child="a"
	expectChild(t, "[:a]", []any{}, "a")
}

func TestListChildQuotedString(t *testing.T) {
	// [:"hello"] → empty list with child="hello"
	expectChild(t, `[:"hello"]`, []any{}, "hello")
}

func TestListChildTrue(t *testing.T) {
	expectChild(t, "[:true]", []any{}, true)
}

func TestListChildFalse(t *testing.T) {
	expectChild(t, "[:false]", []any{}, false)
}

func TestListChildNull(t *testing.T) {
	expectChild(t, "[:null]", []any{}, nil)
}

func TestListChildBareColon(t *testing.T) {
	// [:] → empty list with child=null (bare colon, no value)
	expectChild(t, "[:]", []any{}, nil)
}

func TestListChildMap(t *testing.T) {
	// [:{a:1}] → empty list with child={a:1}
	expectChild(t, "[:{a:1}]", []any{}, map[string]any{"a": 1.0})
}

func TestListChildMapMultiKey(t *testing.T) {
	// [:{a:1,b:2}] → empty list with child={a:1,b:2}
	expectChild(t, "[:{a:1,b:2}]", []any{}, map[string]any{"a": 1.0, "b": 2.0})
}

func TestListChildEmptyMap(t *testing.T) {
	expectChild(t, "[:{}]", []any{}, map[string]any{})
}

func TestListChildNestedMap(t *testing.T) {
	expectChild(t, "[:{a:{b:1}}]", []any{}, map[string]any{"a": map[string]any{"b": 1.0}})
}

func TestListChildList(t *testing.T) {
	// [:[1,2]] → empty list with child=ListRef([1,2])
	// ListRef is auto-enabled, so inner lists are also wrapped.
	expectChild(t, "[:[1,2]]", []any{}, ListRef{Val: []any{1.0, 2.0}, Implicit: false})
}

func TestListChildEmptyList(t *testing.T) {
	expectChild(t, "[:[]]", []any{}, ListRef{Val: []any{}, Implicit: false})
}

func TestListChildNestedList(t *testing.T) {
	expectChild(t, "[:[[1],[2]]]", []any{},
		ListRef{Val: []any{
			ListRef{Val: []any{1.0}, Implicit: false},
			ListRef{Val: []any{2.0}, Implicit: false},
		}, Implicit: false})
}

// --- Mixed child and regular elements ---

func TestListChildAfterElement(t *testing.T) {
	// [1,:2] → [1] with child=2
	expectChild(t, "[1,:2]", []any{1.0}, 2.0)
}

func TestListChildBeforeElement(t *testing.T) {
	// [:1,2] → [2] with child=1
	expectChild(t, "[:1,2]", []any{2.0}, 1.0)
}

func TestListChildMiddle(t *testing.T) {
	// [1,:2,3] → [1,3] with child=2
	expectChild(t, "[1,:2,3]", []any{1.0, 3.0}, 2.0)
}

func TestListChildAtEnd(t *testing.T) {
	// [1,2,:3] → [1,2] with child=3
	expectChild(t, "[1,2,:3]", []any{1.0, 2.0}, 3.0)
}

func TestListChildAtStartMultiple(t *testing.T) {
	// [:1,2,3] → [2,3] with child=1
	expectChild(t, "[:1,2,3]", []any{2.0, 3.0}, 1.0)
}

// --- Multiple child values (last wins for scalars, deep merge for maps) ---

func TestListChildMultipleScalars(t *testing.T) {
	// [:1,:2] → [] with child=2 (last scalar wins)
	expectChild(t, "[:1,:2]", []any{}, 2.0)
}

func TestListChildTripleScalars(t *testing.T) {
	// [:1,:2,:3] → [] with child=3
	expectChild(t, "[:1,:2,:3]", []any{}, 3.0)
}

func TestListChildMergeMaps(t *testing.T) {
	// [:{a:1},:{b:2}] → [] with child={a:1,b:2} (deep merge)
	expectChild(t, "[:{a:1},:{b:2}]", []any{}, map[string]any{"a": 1.0, "b": 2.0})
}

func TestListChildMergeThreeMaps(t *testing.T) {
	// [:{a:1},:{b:2},:{c:3}] → [] with child={a:1,b:2,c:3}
	expectChild(t, "[:{a:1},:{b:2},:{c:3}]", []any{}, map[string]any{"a": 1.0, "b": 2.0, "c": 3.0})
}

func TestListChildDeepMergeMaps(t *testing.T) {
	// [:{a:{x:1}},:{a:{y:2}}] → [] with child={a:{x:1,y:2}}
	expectChild(t, "[:{a:{x:1}},:{a:{y:2}}]", []any{}, map[string]any{
		"a": map[string]any{"x": 1.0, "y": 2.0},
	})
}

func TestListChildMergeDupKey(t *testing.T) {
	// [:{a:1},:{a:2}] → [] with child={a:2} (dup key, over wins)
	expectChild(t, "[:{a:1},:{a:2}]", []any{}, map[string]any{"a": 2.0})
}

// --- Pair in list with child ---

func TestListChildWithPairProperty(t *testing.T) {
	// [a:1,:2] → list with property a=1 and child=2
	j := makeChildParser()
	got, err := j.Parse("[a:1,:2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	if !bothRefEqual(lr.Child, 2.0) {
		t.Errorf("Child: got %#v, expected 2.0", lr.Child)
	}
}

// --- Child path dive ---

func TestListChildPathDive(t *testing.T) {
	// [:a:b] → [] with child={a:"b"} (path dive from child)
	expectChild(t, "[:a:b]", []any{}, map[string]any{"a": "b"})
}

func TestListChildDeepPathDive(t *testing.T) {
	// [:a:b:1] → [] with child={a:{b:1}}
	expectChild(t, "[:a:b:1]", []any{}, map[string]any{"a": map[string]any{"b": 1.0}})
}

// --- Trailing comma ---

func TestListChildTrailingComma(t *testing.T) {
	// [:1,] → [] with child=1
	expectChild(t, "[:1,]", []any{}, 1.0)
}

func TestListChildElementThenChildTrailing(t *testing.T) {
	// [1,:2,] → [1] with child=2
	expectChild(t, "[1,:2,]", []any{1.0}, 2.0)
}

func TestListChildMultipleTrailing(t *testing.T) {
	// [:1,:2,] → [] with child=2
	expectChild(t, "[:1,:2,]", []any{}, 2.0)
}

// --- Leading comma (null element) ---

func TestListChildLeadingCommaNull(t *testing.T) {
	// [,:1] → [null] with child=1
	expectChild(t, "[,:1]", []any{nil}, 1.0)
}

func TestListChildDoubleLeadingComma(t *testing.T) {
	// [,,:1] → [null,null] with child=1
	expectChild(t, "[,,:1]", []any{nil, nil}, 1.0)
}

// --- No child (regular lists unchanged) ---

func TestListChildNone(t *testing.T) {
	// [1,2,3] → [1,2,3] with child=nil (no child set)
	expectChild(t, "[1,2,3]", []any{1.0, 2.0, 3.0}, nil)
}

func TestListChildEmptyBrackets(t *testing.T) {
	// [] → [] with child=nil
	expectChild(t, "[]", []any{}, nil)
}

// --- Mixed maps and child ---

func TestListChildMapElementThenChild(t *testing.T) {
	// [{a:1},:2] → [{a:1}] with child=2
	expectChild(t, "[{a:1},:2]", []any{map[string]any{"a": 1.0}}, 2.0)
}

func TestListChildBeforeMapElement(t *testing.T) {
	// [:1,{a:2}] → [{a:2}] with child=1
	expectChild(t, "[:1,{a:2}]", []any{map[string]any{"a": 2.0}}, 1.0)
}

func TestListChildListElement(t *testing.T) {
	// [[1,2],:3] → [ListRef([1,2])] with child=3
	expectChild(t, "[[1,2],:3]", []any{ListRef{Val: []any{1.0, 2.0}, Implicit: false}}, 3.0)
}

func TestListChildBeforeListElement(t *testing.T) {
	// [:1,[2,3]] → [ListRef([2,3])] with child=1
	expectChild(t, "[:1,[2,3]]", []any{ListRef{Val: []any{2.0, 3.0}, Implicit: false}}, 1.0)
}

func TestListChildMapAroundChild(t *testing.T) {
	// [{a:1},:2,{b:3}] → [{a:1},{b:3}] with child=2
	expectChild(t, "[{a:1},:2,{b:3}]", []any{map[string]any{"a": 1.0}, map[string]any{"b": 3.0}}, 2.0)
}

// --- Bare colon creates null child ---

func TestListChildBareColonThenElement(t *testing.T) {
	// [:,1] → [1] with child=null
	expectChild(t, "[:,1]", []any{1.0}, nil)
}

func TestListChildElementThenBareColon(t *testing.T) {
	// [1,:] → [1] with child=null
	expectChild(t, "[1,:]", []any{1.0}, nil)
}

// --- Multiple children interleaved with elements ---

func TestListChildInterleaved(t *testing.T) {
	// [:1,:2,3,:4] → [3] with child=4
	expectChild(t, "[:1,:2,3,:4]", []any{3.0}, 4.0)
}

func TestListChildMultiInterleaved(t *testing.T) {
	// [1,:2,3,:4,5] → [1,3,5] with child=4
	expectChild(t, "[1,:2,3,:4,5]", []any{1.0, 3.0, 5.0}, 4.0)
}

// --- list.child auto-enables ListRef ---

func TestListChildAutoEnablesListRef(t *testing.T) {
	// Enabling list.child should auto-enable ListRef wrapping.
	j := Make(Options{List: &ListOptions{Child: boolPtr(true)}})
	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(ListRef); !ok {
		t.Errorf("expected ListRef (auto-enabled by list.child), got %T: %#v", got, got)
	}
}

// --- list.child disabled (default) ---

func TestListChildDisabledDefault(t *testing.T) {
	// Default: list.child disabled, bare colon is not special.
	j := Make()
	got, err := j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.([]any); !ok {
		t.Errorf("expected []any, got %T: %#v", got, got)
	}
}

// --- list.child with MapRef ---

func TestListChildWithMapRef(t *testing.T) {
	// list.child + MapRef: child map should be MapRef
	j := Make(Options{
		List:     &ListOptions{Child: boolPtr(true)},
		Info: &InfoOptions{Map: boolPtr(true)},
	})
	got, err := j.Parse("[:{a:1}]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	child, ok := lr.Child.(MapRef)
	if !ok {
		t.Fatalf("expected child to be MapRef, got %T: %#v", lr.Child, lr.Child)
	}
	if child.Val["a"] != 1.0 {
		t.Errorf("expected child.Val[a]=1, got %#v", child.Val)
	}
}

// --- list.child with TextInfo ---

func TestListChildWithTextInfo(t *testing.T) {
	// list.child + TextInfo: child text should be Text struct
	j := Make(Options{
		List:     &ListOptions{Child: boolPtr(true)},
		Info: &InfoOptions{Text: boolPtr(true)},
	})
	got, err := j.Parse(`[:"hello"]`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T: %#v", got, got)
	}
	child, ok := lr.Child.(Text)
	if !ok {
		t.Fatalf("expected child to be Text, got %T: %#v", lr.Child, lr.Child)
	}
	if child.Str != "hello" || child.Quote != `"` {
		t.Errorf("expected Text{Str:hello, Quote:\"}, got %#v", child)
	}
}

// --- Implicit flag ---

func TestListChildExplicitBrackets(t *testing.T) {
	j := makeChildParser()
	got, err := j.Parse("[:1]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr := got.(ListRef)
	if lr.Implicit {
		t.Error("expected Implicit=false for bracketed list")
	}
}

// --- Deep merge disabled ---

func TestListChildNoExtend(t *testing.T) {
	// With map.extend=false, multiple child values → last wins (no deep merge)
	j := Make(Options{
		List: &ListOptions{Child: boolPtr(true)},
		Map:  &MapOptions{Extend: boolPtr(false)},
	})
	got, err := j.Parse("[:{a:1},:{b:2}]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	lr, ok := got.(ListRef)
	if !ok {
		t.Fatalf("expected ListRef, got %T", got)
	}
	// Without extend, last child value wins entirely
	child, ok := lr.Child.(map[string]any)
	if !ok {
		t.Fatalf("expected child to be map, got %T: %#v", lr.Child, lr.Child)
	}
	if _, hasA := child["a"]; hasA {
		t.Errorf("expected child to only have key 'b' (last wins), got %#v", child)
	}
	if child["b"] != 2.0 {
		t.Errorf("expected child[b]=2, got %#v", child)
	}
}

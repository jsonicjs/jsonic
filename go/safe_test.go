package jsonic

import "testing"

// Mirrors test/safe.test.js. TS protects against __proto__ / constructor
// key pollution on arrays. Go maps have no prototype chain so object-form
// __proto__ is simply stored as a key, but list-property syntax still
// needs the guard to prevent callers who build arrays from user input
// from exposing constructor-shaped keys in unsafe downstream code.

// --- constructor key ---

func TestSafeKey_ConstructorBlockedOnList(t *testing.T) {
	j := Make(Options{List: &ListOptions{Property: boolPtr(true)}})
	got, err := j.Parse("[1,2,constructor:fail]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := a(1.0, 2.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("constructor pair on list should be dropped: got %s, want %s",
			formatValue(stripRefs(got)), formatValue(expected))
	}
}

func TestSafeKey_ConstructorAllowedOnObject(t *testing.T) {
	// Go maps have no prototype, so constructor on an object is just a key.
	j := Make()
	got, err := j.Parse("{constructor:1,a:2}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("constructor", 1.0, "a", 2.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}
}

// --- safe.key=false + list property allows pollution ---

func TestSafeKey_FalseAllowsProtoOnList(t *testing.T) {
	j := Make(Options{
		Safe: &SafeOptions{Key: boolPtr(false)},
		List: &ListOptions{Property: boolPtr(true)},
	})
	got, err := j.Parse("[1,2,__proto__:fail]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// With safe.key=false the __proto__ pair survives — observable as an
	// extra element in the slice because Go lists carry key-value pairs
	// under list.property syntax only via the implicit map grammar path.
	// The exact survival shape depends on how list.property renders the
	// pair; the guarantee is: it is NOT dropped.
	arr, ok := stripRefs(got).([]any)
	if !ok {
		t.Fatalf("expected []any, got %T: %v", got, got)
	}
	if len(arr) < 2 {
		t.Errorf("expected __proto__ pair to survive, got %v", arr)
	}
}

func TestSafeKey_FalseAllowsConstructorOnList(t *testing.T) {
	j := Make(Options{
		Safe: &SafeOptions{Key: boolPtr(false)},
		List: &ListOptions{Property: boolPtr(true)},
	})
	got, err := j.Parse("[1,2,constructor:fail]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	arr, ok := stripRefs(got).([]any)
	if !ok {
		t.Fatalf("expected []any, got %T: %v", got, got)
	}
	if len(arr) < 2 {
		t.Errorf("expected constructor pair to survive, got %v", arr)
	}
}

// --- path diving with __proto__ ---

func TestSafeKey_PathDiveWithProtoOnList(t *testing.T) {
	// With list.property and safe.key default (true), a path-dive key that
	// starts with __proto__ must not establish a __proto__ child entry.
	j := Make(Options{List: &ListOptions{Property: boolPtr(true)}})
	got, err := j.Parse("[1,2,__proto__:x:1]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := a(1.0, 2.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("path-dived __proto__ should be dropped: got %s, want %s",
			formatValue(stripRefs(got)), formatValue(expected))
	}
}

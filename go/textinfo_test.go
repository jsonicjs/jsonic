package jsonic

import (
	"testing"
)

// expectTextInfo parses input with TextInfo enabled and checks the result.
func expectTextInfo(t *testing.T, input string, expected any) {
	t.Helper()
	j := Make(Options{TextInfo: boolPtr(true)})
	got, err := j.Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	if !textInfoEqual(got, expected) {
		t.Errorf("Parse(%q)\n  got:      %#v\n  expected: %#v",
			input, got, expected)
	}
}

// textInfoEqual compares values including Text structs.
func textInfoEqual(a, b any) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	switch av := a.(type) {
	case Text:
		bv, ok := b.(Text)
		if !ok {
			return false
		}
		return av.Quote == bv.Quote && av.Str == bv.Str
	case map[string]any:
		bv, ok := b.(map[string]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for k, v := range av {
			bval, exists := bv[k]
			if !exists || !textInfoEqual(v, bval) {
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
			if !textInfoEqual(av[i], bv[i]) {
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

// tx is shorthand to create a Text value.
func tx(quote, str string) Text {
	return Text{Quote: quote, Str: str}
}

func TestTextInfoOff(t *testing.T) {
	// Default (TextInfo off) - plain strings in output, no wrapping.
	j := Make()
	got, err := j.Parse(`"hello"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s, ok := got.(string); !ok || s != "hello" {
		t.Errorf("expected plain string \"hello\", got %#v", got)
	}

	got, err = j.Parse("hello")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s, ok := got.(string); !ok || s != "hello" {
		t.Errorf("expected plain string \"hello\", got %#v", got)
	}
}

func TestTextInfoDoubleQuote(t *testing.T) {
	expectTextInfo(t, `"hello"`, tx(`"`, "hello"))
}

func TestTextInfoSingleQuote(t *testing.T) {
	expectTextInfo(t, `'hello'`, tx("'", "hello"))
}

func TestTextInfoBacktickQuote(t *testing.T) {
	expectTextInfo(t, "`hello`", tx("`", "hello"))
}

func TestTextInfoUnquotedText(t *testing.T) {
	// Unquoted text has empty quote.
	expectTextInfo(t, "hello", tx("", "hello"))
}

func TestTextInfoEmptyStrings(t *testing.T) {
	expectTextInfo(t, `""`, tx(`"`, ""))
	expectTextInfo(t, `''`, tx("'", ""))
	expectTextInfo(t, "``", tx("`", ""))
}

func TestTextInfoEscapes(t *testing.T) {
	// Escapes should still be processed; Str holds the processed value.
	expectTextInfo(t, `"a\tb"`, tx(`"`, "a\tb"))
	expectTextInfo(t, `'a\nb'`, tx("'", "a\nb"))
}

func TestTextInfoMapValues(t *testing.T) {
	// Values in maps should be wrapped; keys remain plain strings.
	expectTextInfo(t, `a:"hello"`, map[string]any{
		"a": tx(`"`, "hello"),
	})
	expectTextInfo(t, `a:'hello'`, map[string]any{
		"a": tx("'", "hello"),
	})
	expectTextInfo(t, "a:hello", map[string]any{
		"a": tx("", "hello"),
	})
}

func TestTextInfoMapMultipleKeys(t *testing.T) {
	expectTextInfo(t, `a:"x",b:'y'`, map[string]any{
		"a": tx(`"`, "x"),
		"b": tx("'", "y"),
	})
}

func TestTextInfoArrayValues(t *testing.T) {
	expectTextInfo(t, `["a",'b',c]`, []any{
		tx(`"`, "a"),
		tx("'", "b"),
		tx("", "c"),
	})
}

func TestTextInfoMixedTypes(t *testing.T) {
	// Numbers, booleans, and null should not be wrapped.
	expectTextInfo(t, `["hello",1,true,null]`, []any{
		tx(`"`, "hello"),
		1.0,
		true,
		nil,
	})
}

func TestTextInfoNestedMap(t *testing.T) {
	expectTextInfo(t, `{a:{b:"c"}}`, map[string]any{
		"a": map[string]any{
			"b": tx(`"`, "c"),
		},
	})
}

func TestTextInfoKeysRemainStrings(t *testing.T) {
	// Even with TextInfo on, map keys must be plain strings.
	j := Make(Options{TextInfo: boolPtr(true)})
	got, err := j.Parse(`"k":"v"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %#v", got)
	}
	// Key should be plain string "k".
	if _, exists := m["k"]; !exists {
		t.Errorf("expected key \"k\" in map, got keys: %v", m)
	}
	// Value should be Text.
	val, ok := m["k"].(Text)
	if !ok {
		t.Errorf("expected Text value, got %#v", m["k"])
	} else if val.Quote != `"` || val.Str != "v" {
		t.Errorf("expected Text{Quote:`\"`, Str:\"v\"}, got %#v", val)
	}
}

func TestTextInfoNumbersUnaffected(t *testing.T) {
	j := Make(Options{TextInfo: boolPtr(true)})
	got, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f, ok := got.(float64); !ok || f != 42.0 {
		t.Errorf("expected 42.0, got %#v", got)
	}
}

func TestTextInfoBoolsUnaffected(t *testing.T) {
	j := Make(Options{TextInfo: boolPtr(true)})
	got, err := j.Parse("true")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if b, ok := got.(bool); !ok || b != true {
		t.Errorf("expected true, got %#v", got)
	}
}

func TestTextInfoNullUnaffected(t *testing.T) {
	j := Make(Options{TextInfo: boolPtr(true)})
	got, err := j.Parse("null")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil, got %#v", got)
	}
}

func TestTextInfoExplicitOff(t *testing.T) {
	// Explicitly setting TextInfo to false should behave like default.
	j := Make(Options{TextInfo: boolPtr(false)})
	got, err := j.Parse(`"hello"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s, ok := got.(string); !ok || s != "hello" {
		t.Errorf("expected plain string \"hello\", got %#v", got)
	}
}

func TestTextInfoImplicitList(t *testing.T) {
	// Implicit list (comma-separated values).
	expectTextInfo(t, `"a","b"`, []any{
		tx(`"`, "a"),
		tx(`"`, "b"),
	})
}

func TestTextInfoSpaceSeparatedList(t *testing.T) {
	// Space-separated implicit list.
	expectTextInfo(t, "a b c", []any{
		tx("", "a"),
		tx("", "b"),
		tx("", "c"),
	})
}

func TestTextInfoPathDive(t *testing.T) {
	expectTextInfo(t, `a:b:"c"`, map[string]any{
		"a": map[string]any{
			"b": tx(`"`, "c"),
		},
	})
}

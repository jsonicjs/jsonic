package jsonic

import (
	"encoding/json"
	"testing"
)

func boolp(b bool) *bool { return &b }

// toJSON converts a value to its JSON string for easy comparison.
func toJSON(t *testing.T, v any) string {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("json.Marshal failed: %v", err)
	}
	return string(b)
}

// --- Main README examples ---

func TestReadmeQuickExample(t *testing.T) {
	// The main README shows:
	//   result, err := jsonic.Parse("a:1, b:2")
	result, err := Parse("a:1, b:2")
	if err != nil {
		t.Fatal(err)
	}
	got := toJSON(t, result)
	if got != `{"a":1,"b":2}` {
		t.Errorf("got %s, want %s", got, `{"a":1,"b":2}`)
	}
}

func TestReadmeSyntaxExamples(t *testing.T) {
	// All should parse to {"a": 1, "b": "B"}
	want := `{"a":1,"b":"B"}`

	tests := []struct {
		name  string
		input string
	}{
		{"unquoted", `a:1,b:B`},
		{"newline-separated", "a:1\nb:B"},
		{"with-comments", "a:1\n// a:2\n# a:3\n/* b wants\n * to B\n */\nb:B"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result, err := Parse(tc.input)
			if err != nil {
				t.Fatal(err)
			}
			got := toJSON(t, result)
			if got != want {
				t.Errorf("got %s, want %s", got, want)
			}
		})
	}
}

func TestReadmeRelaxations(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"unquoted-keys", `a:1`, `{"a":1}`},
		{"implicit-object", `a:1,b:2`, `{"a":1,"b":2}`},
		{"implicit-array", `a,b`, `["a","b"]`},
		{"trailing-commas", `{a:1,b:2,}`, `{"a":1,"b":2}`},
		{"single-quoted", `'hello'`, `"hello"`},
		{"backtick", "`hello`", `"hello"`},
		{"object-merging", `a:{b:1},a:{c:2}`, `{"a":{"b":1,"c":2}}`},
		{"path-diving", `a:b:1,a:c:2`, `{"a":{"b":1,"c":2}}`},
		{"number-1e1", `1e1`, `10`},
		{"number-hex", `0xa`, `10`},
		{"number-octal", `0o12`, `10`},
		{"number-binary", `0b1010`, `10`},
		{"number-separator", `1_000`, `1000`},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result, err := Parse(tc.input)
			if err != nil {
				t.Fatal(err)
			}
			got := toJSON(t, result)
			if got != tc.want {
				t.Errorf("got %s, want %s", got, tc.want)
			}
		})
	}
}

// --- Go README examples ---

func TestGoReadmeQuickExample(t *testing.T) {
	result, err := Parse("a:1, b:2")
	if err != nil {
		t.Fatal(err)
	}
	m, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", result)
	}
	if m["a"] != float64(1) {
		t.Errorf("a: got %v, want 1", m["a"])
	}
	if m["b"] != float64(2) {
		t.Errorf("b: got %v, want 2", m["b"])
	}
}

func TestGoReadmeConfiguredInstance(t *testing.T) {
	// Go README shows: disabling numbers makes them strings
	j := Make(Options{
		Number: &NumberOptions{Lex: boolp(false)},
	})

	result, err := j.Parse("a:1, b:2")
	if err != nil {
		t.Fatal(err)
	}

	m, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", result)
	}
	// With numbers disabled, values should be strings
	if m["a"] != "1" {
		t.Errorf("a: got %v (%T), want string \"1\"", m["a"], m["a"])
	}
	if m["b"] != "2" {
		t.Errorf("b: got %v (%T), want string \"2\"", m["b"], m["b"])
	}
}

func TestGoReadmeSyntaxHighlights(t *testing.T) {
	// Go README lists these syntax highlights
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"unquoted-keys", `a:1`, `{"a":1}`},
		{"implicit-objects", `a:1,b:2`, `{"a":1,"b":2}`},
		{"implicit-arrays", `a,b,c`, `["a","b","c"]`},
		{"comments-hash", "a:1\n#ignored\nb:2", `{"a":1,"b":2}`},
		{"comments-line", "a:1\n// ignored\nb:2", `{"a":1,"b":2}`},
		{"comments-block", "a:1\n/* ignored */\nb:2", `{"a":1,"b":2}`},
		{"single-quotes", `'hello'`, `"hello"`},
		{"backtick-quotes", "`hello`", `"hello"`},
		{"path-diving", `a:b:1`, `{"a":{"b":1}}`},
		{"trailing-commas", `{a:1,}`, `{"a":1}`},
		{"hex-number", `0xff`, `255`},
		{"octal-number", `0o12`, `10`},
		{"binary-number", `0b1010`, `10`},
		{"number-separator", `1_000`, `1000`},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result, err := Parse(tc.input)
			if err != nil {
				t.Fatal(err)
			}
			got := toJSON(t, result)
			if got != tc.want {
				t.Errorf("got %s, want %s", got, tc.want)
			}
		})
	}
}

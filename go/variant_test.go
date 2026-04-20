package jsonic

import (
	"reflect"
	"testing"
)

// Port of test/variant.test.js `just-json-happy`. Uses MakeJSON(),
// Go's equivalent of TS Jsonic.make('json').

func TestVariant_StrictJSON_Happy(t *testing.T) {
	j := MakeJSON()

	cases := []struct {
		src  string
		want any
	}{
		{`{"a":1}`, map[string]any{"a": 1.0}},
		{
			`{"a":1,"b":"x","c":true,"d":{"e":[-1.1e2,{"f":null}]}}`,
			map[string]any{
				"a": 1.0,
				"b": "x",
				"c": true,
				"d": map[string]any{
					"e": []any{-110.0, map[string]any{"f": nil}},
				},
			},
		},
		{` "a" `, "a"},
		{"\r\n\t1.0\n", 1.0},
		// NOTE: as per JSON.parse — last-wins on duplicate keys.
		{`{"a":1,"a":2}`, map[string]any{"a": 2.0}},
	}

	for _, c := range cases {
		got, err := j.Parse(c.src)
		if err != nil {
			t.Errorf("parse(%q) error: %v", c.src, err)
			continue
		}
		if !reflect.DeepEqual(got, c.want) {
			t.Errorf("parse(%q)\n  got:  %#v\n  want: %#v", c.src, got, c.want)
		}
	}
}

func TestVariant_StrictJSON_Rejects(t *testing.T) {
	j := MakeJSON()

	// Inputs that are valid jsonic but not strict JSON — must fail under
	// the approximation. Matches the `assert.throws` cases in TS.
	bad := []string{
		`{a:1}`,          // unquoted key
		`{"a":1,}`,       // trailing comma
		`[a]`,            // unquoted value
		`["a",]`,         // trailing comma in array
		"\"a\" # foo",    // comment
		`0xA`,            // hex literal
		"`a`",            // backtick string
		`'a'`,            // single-quoted string
		`{"a":1`,         // unterminated object
		`[,a]`,           // leading comma
		`00`,             // non-standard numeric prefix
	}

	for _, src := range bad {
		if _, err := j.Parse(src); err == nil {
			t.Errorf("parse(%q) expected error, got nil", src)
		}
	}
}

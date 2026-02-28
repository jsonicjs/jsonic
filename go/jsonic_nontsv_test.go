package jsonic

// Non-TSV tests ported from the TypeScript test suite.
// Tests that rely on TS-specific features (plugins, custom config via make(),
// regex-based custom values, error position checking, array named properties)
// are NOT ported. See platform mismatch notes at the bottom.

import (
	"math"
	"strings"
	"testing"
)

// --- helpers ---

// expectParse asserts Parse(input) returns expected with no error.
func expectParse(t *testing.T, input string, expected any) {
	t.Helper()
	got, err := Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	if !valuesEqual(got, expected) {
		t.Errorf("Parse(%q)\n  got:      %s\n  expected: %s",
			input, formatValue(got), formatValue(expected))
	}
}

// expectParseNil asserts Parse(input) returns nil with no error.
func expectParseNil(t *testing.T, input string) {
	t.Helper()
	got, err := Parse(input)
	if err != nil {
		t.Errorf("Parse(%q) unexpected error: %v", input, err)
		return
	}
	if got != nil {
		t.Errorf("Parse(%q)\n  got:      %s\n  expected: nil",
			input, formatValue(got))
	}
}

// expectParseError asserts Parse(input) returns a *JsonicError.
func expectParseError(t *testing.T, input string) {
	t.Helper()
	_, err := Parse(input)
	if err == nil {
		t.Errorf("Parse(%q) should have returned an error but did not", input)
		return
	}
	if _, ok := err.(*JsonicError); !ok {
		t.Errorf("Parse(%q) error should be *JsonicError, got %T: %v", input, err, err)
	}
}

// m is shorthand for map[string]any.
func m(args ...any) map[string]any {
	result := make(map[string]any)
	for i := 0; i+1 < len(args); i += 2 {
		key, _ := args[i].(string)
		result[key] = args[i+1]
	}
	return result
}

// a is shorthand for []any.
func a(args ...any) []any {
	return args
}

// --- Comment tests (from comment.test.js) ---

func TestCommentSingleLine(t *testing.T) {
	// # comment
	expectParse(t, "a#b", "a")
	expectParse(t, "a:1#b", m("a", 1.0))
	expectParseNil(t, "#a:1")
	expectParse(t, "#a:1\nb:2", m("b", 2.0))
	expectParse(t, "b:2\n#a:1", m("b", 2.0))
	expectParse(t, "b:2,\n#a:1\nc:3", m("b", 2.0, "c", 3.0))

	// // comment
	expectParseNil(t, "//a:1")
	expectParse(t, "//a:1\nb:2", m("b", 2.0))
	expectParse(t, "b:2\n//a:1", m("b", 2.0))
	expectParse(t, "b:2,\n//a:1\nc:3", m("b", 2.0, "c", 3.0))
}

func TestCommentMultiLine(t *testing.T) {
	expectParseNil(t, "/*a:1*/")
	expectParse(t, "/*a:1*/\nb:2", m("b", 2.0))
	expectParse(t, "/*a:1\n*/b:2", m("b", 2.0))
	expectParse(t, "b:2\n/*a:1*/", m("b", 2.0))
	expectParse(t, "b:2,\n/*\na:1,\n*/\nc:3", m("b", 2.0, "c", 3.0))

	// Unterminated block comments should panic
	expectParseError(t, "/*")
	expectParseError(t, "\n/*")
	expectParseError(t, "a/*")
	expectParseError(t, "\na/*")
}

// --- Number tests (from feature.test.js) ---

func TestNumberParsing(t *testing.T) {
	// Basic integers
	expectParse(t, "1", 1.0)
	expectParse(t, "-1", -1.0)
	expectParse(t, "+1", 1.0)
	expectParse(t, "0", 0.0)

	// Trailing dot
	expectParse(t, "1.", 1.0)
	expectParse(t, "-1.", -1.0)
	expectParse(t, "+1.", 1.0)
	expectParse(t, "0.", 0.0)

	// Leading dot
	expectParse(t, ".1", 0.1)
	expectParse(t, "-.1", -0.1)
	expectParse(t, "+.1", 0.1)
	expectParse(t, ".0", 0.0)

	// Decimals
	expectParse(t, "0.9", 0.9)
	expectParse(t, "-0.9", -0.9)

	// Floats and scientific notation
	expectParse(t, "1.2", 1.2)
	expectParse(t, "1e2", 100.0)
	expectParse(t, "-1.2", -1.2)
	expectParse(t, "-1e2", -100.0)
	expectParse(t, "1e+2", 100.0)
	expectParse(t, "1e-2", 0.01)

	// Number separators
	expectParse(t, "10_0", 100.0)
	expectParse(t, "-10_0", -100.0)

	// Hex
	expectParse(t, "0xA", 10.0)
	expectParse(t, "0xa", 10.0)
	expectParse(t, "+0xA", 10.0)
	expectParse(t, "+0xa", 10.0)
	expectParse(t, "-0xA", -10.0)
	expectParse(t, "-0xa", -10.0)

	// Octal and binary
	expectParse(t, "0o12", 10.0)
	expectParse(t, "0b1010", 10.0)

	// Hex/octal/binary with underscores
	expectParse(t, "0x_A", 10.0)
	expectParse(t, "0x_a", 10.0)
	expectParse(t, "0o_12", 10.0)
	expectParse(t, "0b_1010", 10.0)

	// Numbers as map keys use source text
	expectParse(t, "1e6:a", m("1e6", "a"))

	// Leading zeros
	expectParse(t, "01", 1.0)
	expectParse(t, "-01", -1.0)
	expectParse(t, "0099", 99.0)
	expectParse(t, "-0099", -99.0)

	// Numbers in context
	expectParse(t, "[1]", a(1.0))
	expectParse(t, "a:1", m("a", 1.0))
	expectParse(t, "1:a", m("1", "a"))
	expectParse(t, "{a:1}", m("a", 1.0))
	expectParse(t, "{1:a}", m("1", "a"))
	expectParse(t, "[1,0]", a(1.0, 0.0))
	expectParse(t, "[1,0.5]", a(1.0, 0.5))

	// Numbers in value position
	expectParse(t, "a:1", m("a", 1.0))
	expectParse(t, "a:-1", m("a", -1.0))
	expectParse(t, "a:+1", m("a", 1.0))
	expectParse(t, "a:0", m("a", 0.0))
	expectParse(t, "a:0.1", m("a", 0.1))
	expectParse(t, "a:[1]", m("a", a(1.0)))
	expectParse(t, "a:a:1", m("a", m("a", 1.0)))
	expectParse(t, "a:1:a", m("a", m("1", "a")))
	expectParse(t, "a:{a:1}", m("a", m("a", 1.0)))
	expectParse(t, "a:{1:a}", m("a", m("1", "a")))
	expectParse(t, "a:1.2", m("a", 1.2))
	expectParse(t, "a:1e2", m("a", 100.0))
	expectParse(t, "a:10_0", m("a", 100.0))
	expectParse(t, "a:-1.2", m("a", -1.2))
	expectParse(t, "a:-1e2", m("a", -100.0))
	expectParse(t, "a:-10_0", m("a", -100.0))
	expectParse(t, "a:1e+2", m("a", 100.0))
	expectParse(t, "a:1e-2", m("a", 0.01))
	expectParse(t, "a:0xA", m("a", 10.0))
	expectParse(t, "a:0xa", m("a", 10.0))
	expectParse(t, "a:0o12", m("a", 10.0))
	expectParse(t, "a:0b1010", m("a", 10.0))
	expectParse(t, "a:0x_A", m("a", 10.0))
	expectParse(t, "a:0x_a", m("a", 10.0))
	expectParse(t, "a:0o_12", m("a", 10.0))
	expectParse(t, "a:0b_1010", m("a", 10.0))
	expectParse(t, "a:1e6:a", m("a", m("1e6", "a")))

	// text as +- not value enders
	expectParse(t, "1+", "1+")
	expectParse(t, "1-", "1-")
	expectParse(t, "1-+", "1-+")

	// partial numbers become text
	expectParse(t, "-", "-")
	expectParse(t, "+", "+")
	expectParse(t, "1a", "1a")
}

// --- Value standard tests (from feature.test.js) ---

func TestValueStandard(t *testing.T) {
	// Empty input
	expectParseNil(t, "")

	// Boolean and null
	expectParse(t, "true", true)
	expectParse(t, "false", false)
	expectParseNil(t, "null")

	// With trailing newline
	expectParse(t, "true\n", true)
	expectParse(t, "false\n", false)
	expectParseNil(t, "null\n")

	// With trailing hash comment
	expectParse(t, "true#", true)
	expectParse(t, "false#", false)
	expectParseNil(t, "null#")

	// With trailing // comment
	expectParse(t, "true//", true)
	expectParse(t, "false//", false)
	expectParseNil(t, "null//")

	// In maps
	expectParse(t, "{a:true}", m("a", true))
	expectParse(t, "{a:false}", m("a", false))
	expectParse(t, "{a:null}", m("a", nil))

	// Booleans/null as keys
	expectParse(t, "{true:1}", m("true", 1.0))
	expectParse(t, "{false:1}", m("false", 1.0))
	expectParse(t, "{null:1}", m("null", 1.0))

	// Implicit maps
	expectParse(t, "a:true", m("a", true))
	expectParse(t, "a:false", m("a", false))
	expectParse(t, "a:null", m("a", nil))
	expectParse(t, "a:", m("a", nil))

	// Trailing comma creates implicit list
	expectParse(t, "true,", a(true))
	expectParse(t, "false,", a(false))

	// Complex value
	expectParse(t,
		"a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]",
		m("a", true, "b", false, "c", nil,
			"d", m("e", true, "f", false, "g", nil),
			"h", a(true, false, nil)))
}

func TestValueStandardNullInMap(t *testing.T) {
	expectParse(t, "a:null", m("a", nil))
	expectParse(t, "null,", a(nil))
}

// --- Null-or-undefined tests (from feature.test.js) ---

func TestNullOrUndefined(t *testing.T) {
	// All ignored → nil (undefined)
	expectParseNil(t, "")
	expectParseNil(t, " ")
	expectParseNil(t, "\n")
	expectParseNil(t, "#")
	expectParseNil(t, "//")
	expectParseNil(t, "/**/")

	// JSON null
	expectParseNil(t, "null")
	expectParse(t, "a:null", m("a", nil))

	expectParse(t, "[{a:null}]", a(m("a", nil)))

	expectParse(t, "a:null,b:null", m("a", nil, "b", nil))
	expectParse(t, "{a:null,b:null}", m("a", nil, "b", nil))

	expectParse(t, "a:", m("a", nil))
	expectParse(t, "a:,b:", m("a", nil, "b", nil))
	expectParse(t, "a:,b:c:", m("a", nil, "b", m("c", nil)))

	expectParse(t, "{a:}", m("a", nil))
	expectParse(t, "{a:,b:}", m("a", nil, "b", nil))
	expectParse(t, "{a:,b:c:}", m("a", nil, "b", m("c", nil)))
}

// --- Text value tests (from feature.test.js) ---

func TestValueText(t *testing.T) {
	expectParse(t, "a", "a")
	expectParse(t, "1a", "1a") // not a number!
	expectParse(t, "a/b", "a/b")
	expectParse(t, "a#b", "a") // comment cuts text

	expectParse(t, "a//b", "a")     // comment cuts text
	expectParse(t, "a/*b*/", "a")   // comment cuts text
	expectParse(t, `a\n`, `a\n`)    // literal backslash-n in text
	expectParse(t, `\s+`, `\s+`)    // literal regex-like text

	expectParse(t, "x:a", m("x", "a"))
	expectParse(t, "x:a/b", m("x", "a/b"))
	expectParse(t, "x:a#b", m("x", "a"))
	expectParse(t, "x:a//b", m("x", "a"))
	expectParse(t, "x:a/*b*/", m("x", "a"))
	expectParse(t, `x:a\n`, m("x", `a\n`))
	expectParse(t, `x:\s+`, m("x", `\s+`))

	expectParse(t, "[a]", a("a"))
	expectParse(t, "[a/b]", a("a/b"))
	expectParse(t, "[a#b]", a("a"))
	expectParse(t, "[a//b]", a("a"))
	expectParse(t, "[a/*b*/]", a("a"))
	expectParse(t, `[a\n]`, a(`a\n`))
	expectParse(t, `[\s+]`, a(`\s+`))
}

// --- String value tests (from feature.test.js) ---

func TestValueString(t *testing.T) {
	// Empty strings
	expectParse(t, "''", "")
	expectParse(t, `""`, "")
	expectParse(t, "``", "")

	// Simple strings
	expectParse(t, "'a'", "a")
	expectParse(t, `"a"`, "a")
	expectParse(t, "`a`", "a")

	// Strings with spaces
	expectParse(t, "'a b'", "a b")
	expectParse(t, `"a b"`, "a b")
	expectParse(t, "`a b`", "a b")

	// Tab escape
	expectParse(t, `'a\tb'`, "a\tb")
	expectParse(t, `"a\tb"`, "a\tb")
	expectParse(t, "`a\\tb`", "a\tb")

	// Unknown escape → remove backslash
	expectParse(t, "`a\\qb`", "aqb")

	// Escaped quotes within strings
	expectParse(t, `'a\'b"`+"`c'", "a'b\"`c")
	expectParse(t, `"a\"b`+"`'c\"", "a\"b`'c")
	expectParse(t, "`a\\`b\"'c`", "a`b\"'c")

	// Unicode escapes
	expectParse(t, `"\u0061"`, "a")
	expectParse(t, `"\x61"`, "a")

	// Standard escape sequences
	expectParse(t, `"\n"`, "\n")
	expectParse(t, `"\t"`, "\t")
	expectParse(t, `"\f"`, "\f")
	expectParse(t, `"\b"`, "\b")
	expectParse(t, `"\v"`, "\v")
	expectParse(t, `"\""`, "\"")
	expectParse(t, `"\'"`, "'")
	expectParse(t, "\"\\`\"", "`")

	// Unknown escape → char itself
	expectParse(t, `"\w"`, "w")
	expectParse(t, `"\0"`, "0")

	// Unterminated strings should panic
	expectParseError(t, `"x`)
	expectParseError(t, ` "x`)
	expectParseError(t, `  "x`)
	expectParseError(t, `a:"x`)

	expectParseError(t, `'x`)
	expectParseError(t, ` 'x`)
	expectParseError(t, `  'x`)
	expectParseError(t, `a:'x`)

	expectParseError(t, "`x")
	expectParseError(t, " `x")
	expectParseError(t, "  `x")
	expectParseError(t, "a:`x")
}

// --- Multiline string tests (from feature.test.js) ---

func TestMultilineString(t *testing.T) {
	expectParse(t, "`a`", "a")
	expectParse(t, "`\na`", "\na")
	expectParse(t, "`\na\n`", "\na\n")
	expectParse(t, "`a\nb`", "a\nb")
	expectParse(t, "`a\n\nb`", "a\n\nb")
	expectParse(t, "`a\nc\nb`", "a\nc\nb")
	expectParse(t, "`a\r\n\r\nb`", "a\r\n\r\nb")

	// Unterminated multiline strings
	expectParseError(t, "`\n")
	expectParseError(t, " `\n")
}

// --- Single-char tests (from feature.test.js) ---

func TestSingleChar(t *testing.T) {
	expectParseNil(t, "")
	expectParse(t, "a", "a")
	expectParse(t, "{", m())        // auto-close empty map
	expectParse(t, "[", a())        // auto-close empty list
	expectParse(t, ",", a(nil))     // implicit list, null element
	expectParseNil(t, "#")          // comment
	expectParseNil(t, " ")          // space
	expectParseNil(t, "\t")         // tab
	expectParseNil(t, "\n")         // newline
	expectParseNil(t, "\r")         // carriage return

	// Error cases
	expectParseError(t, `"`)       // unterminated string
	expectParseError(t, "'")       // unterminated string
	expectParseError(t, ":")       // unexpected
	expectParseError(t, "]")       // unexpected
	expectParseError(t, "`")       // unterminated string
	expectParseError(t, "}")       // unexpected
}

// --- Implicit list tests (from feature.test.js) ---

func TestImplicitList(t *testing.T) {
	// Comma-prefixed implicit list creates null element
	expectParse(t, ",", a(nil))
	expectParse(t, ",a", a(nil, "a"))
	expectParse(t, `,"a"`, a(nil, "a"))
	expectParse(t, ",1", a(nil, 1.0))
	expectParse(t, ",true", a(nil, true))
	expectParse(t, ",[]", a(nil, a()))
	expectParse(t, ",{}", a(nil, m()))
	expectParse(t, ",[1]", a(nil, a(1.0)))
	expectParse(t, ",{a:1}", a(nil, m("a", 1.0)))

	// Trailing comma creates list; ignore trailing comma
	expectParse(t, "a,", a("a"))
	expectParse(t, `"a",`, a("a"))
	expectParse(t, "1,", a(1.0))
	expectParse(t, "1,,", a(1.0, nil))
	expectParse(t, "1,,,", a(1.0, nil, nil))
	expectParse(t, "1,null", a(1.0, nil))
	expectParse(t, "1,null,", a(1.0, nil))
	expectParse(t, "1,null,null", a(1.0, nil, nil))
	expectParse(t, "1,null,null,", a(1.0, nil, nil))
	expectParse(t, "true,", a(true))
	expectParse(t, "[],", a(a()))
	expectParse(t, "{},", a(m()))
	expectParse(t, "[1],", a(a(1.0)))
	expectParse(t, "{a:1},", a(m("a", 1.0)))

	// Map pair with trailing comma stays a map
	expectParse(t, "a:1,", m("a", 1.0))

	// Comma-separated values
	expectParse(t, "a,1", a("a", 1.0))
	expectParse(t, `"a",1`, a("a", 1.0))
	expectParse(t, "true,1", a(true, 1.0))
	expectParse(t, "1,1", a(1.0, 1.0))

	expectParse(t, "a,b", a("a", "b"))
	expectParse(t, "a,b,c", a("a", "b", "c"))
	expectParse(t, "a,b,c,d", a("a", "b", "c", "d"))

	// Space-separated values (implicit list)
	expectParse(t, "a b", a("a", "b"))
	expectParse(t, "a b c", a("a", "b", "c"))
	expectParse(t, "a b c d", a("a", "b", "c", "d"))

	// Arrays as list elements
	expectParse(t, "[a],[b]", a(a("a"), a("b")))
	expectParse(t, "[a],[b],[c]", a(a("a"), a("b"), a("c")))
	expectParse(t, "[a],[b],[c],[d]", a(a("a"), a("b"), a("c"), a("d")))

	// Space-separated arrays
	expectParse(t, "[a] [b]", a(a("a"), a("b")))
	expectParse(t, "[a] [b] [c]", a(a("a"), a("b"), a("c")))
	expectParse(t, "[a] [b] [c] [d]", a(a("a"), a("b"), a("c"), a("d")))

	// Space-separated maps (useful for JSON log parsing)
	expectParse(t, "{a:1} {b:1}", a(m("a", 1.0), m("b", 1.0)))
	expectParse(t, "{a:1} {b:1} {c:1}", a(m("a", 1.0), m("b", 1.0), m("c", 1.0)))
	expectParse(t, "{a:1} {b:1} {c:1} {d:1}",
		a(m("a", 1.0), m("b", 1.0), m("c", 1.0), m("d", 1.0)))
	expectParse(t, "\n{a:1}\n{b:1}\r\n{c:1}\n{d:1}\r\n",
		a(m("a", 1.0), m("b", 1.0), m("c", 1.0), m("d", 1.0)))

	// Object/list trailing comma
	expectParse(t, "{a:1},", a(m("a", 1.0)))
	expectParse(t, "[1],", a(a(1.0)))
}

// --- Extension (deep merge) tests (from feature.test.js) ---

func TestExtension(t *testing.T) {
	expectParse(t, "a:{b:1,c:2},a:{c:3,e:4}", m("a", m("b", 1.0, "c", 3.0, "e", 4.0)))

	expectParse(t, "a:{b:1,x:1},a:{b:2,y:2},a:{b:3,z:3}",
		m("a", m("b", 3.0, "x", 1.0, "y", 2.0, "z", 3.0)))

	expectParse(t, "a:[{b:1,x:1}],a:[{b:2,y:2}],a:[{b:3,z:3}]",
		m("a", a(m("b", 3.0, "x", 1.0, "y", 2.0, "z", 3.0))))

	expectParse(t, "a:[{b:1},{x:1}],a:[{b:2},{y:2}],a:[{b:3},{z:3}]",
		m("a", a(m("b", 3.0), m("x", 1.0, "y", 2.0, "z", 3.0))))
}

// --- Finish (auto-close) tests (from feature.test.js) ---

func TestFinishAutoClose(t *testing.T) {
	// Unclosed structures are auto-closed with default config
	expectParse(t, "a:{b:", m("a", m("b", nil)))
	expectParse(t, "{a:{b:{c:1}", m("a", m("b", m("c", 1.0))))
	expectParse(t, "[[1", a(a(1.0)))
}

// --- Property-dive tests (from feature.test.js) ---

func TestPropertyDive(t *testing.T) {
	// Standard maps
	expectParse(t, "{a:1,b:2}", m("a", 1.0, "b", 2.0))
	expectParse(t, "{a:1,b:{c:2}}", m("a", 1.0, "b", m("c", 2.0)))
	expectParse(t, "{a:1,b:{c:2},d:3}", m("a", 1.0, "b", m("c", 2.0), "d", 3.0))
	expectParse(t, "{b:{c:2,e:4},d:3}", m("b", m("c", 2.0, "e", 4.0), "d", 3.0))
	expectParse(t, "{a:{b:{c:1,d:2},e:3},f:4}",
		m("a", m("b", m("c", 1.0, "d", 2.0), "e", 3.0), "f", 4.0))

	// Path dive
	expectParse(t, "a:b:c", m("a", m("b", "c")))
	expectParse(t, "a:b:c, d:e:f", m("a", m("b", "c"), "d", m("e", "f")))
	expectParse(t, "a:b:c\nd:e:f", m("a", m("b", "c"), "d", m("e", "f")))

	expectParse(t, "a:b:c,d:e", m("a", m("b", "c"), "d", "e"))
	expectParse(t, "a:b:c:1,d:e", m("a", m("b", m("c", 1.0)), "d", "e"))
	expectParse(t, "a:b:c:f:{g:1},d:e",
		m("a", m("b", m("c", m("f", m("g", 1.0)))), "d", "e"))
	expectParse(t, "c:f:{g:1,h:2},d:e",
		m("c", m("f", m("g", 1.0, "h", 2.0)), "d", "e"))
	expectParse(t, "c:f:[{g:1,h:2}],d:e",
		m("c", m("f", a(m("g", 1.0, "h", 2.0))), "d", "e"))

	expectParse(t, "a:b:c:1\nd:e", m("a", m("b", m("c", 1.0)), "d", "e"))

	// Path dive in arrays
	expectParse(t, "[{a:1,b:2}]", a(m("a", 1.0, "b", 2.0)))
	expectParse(t, "[{a:1,b:{c:2}}]", a(m("a", 1.0, "b", m("c", 2.0))))
	expectParse(t, "[{a:1,b:{c:2},d:3}]", a(m("a", 1.0, "b", m("c", 2.0), "d", 3.0)))
	expectParse(t, "[{b:{c:2,e:4},d:3}]", a(m("b", m("c", 2.0, "e", 4.0), "d", 3.0)))
	expectParse(t, "[{a:{b:{c:1,d:2},e:3},f:4}]",
		a(m("a", m("b", m("c", 1.0, "d", 2.0), "e", 3.0), "f", 4.0)))

	// Path dive with deep merge
	expectParse(t, "a:b:{x:1},a:b:{y:2}", m("a", m("b", m("x", 1.0, "y", 2.0))))
	expectParse(t, "a:b:{x:1},a:b:{y:2},a:b:{z:3}",
		m("a", m("b", m("x", 1.0, "y", 2.0, "z", 3.0))))

	expectParse(t, "a:b:c:{x:1},a:b:c:{y:2}",
		m("a", m("b", m("c", m("x", 1.0, "y", 2.0)))))
	expectParse(t, "a:b:c:{x:1},a:b:c:{y:2},a:b:c:{z:3}",
		m("a", m("b", m("c", m("x", 1.0, "y", 2.0, "z", 3.0)))))
}

// --- Syntax error tests (from jsonic.test.js) ---

func TestSyntaxErrors(t *testing.T) {
	// Bad close
	expectParseError(t, "}")
	expectParseError(t, "]")

	// Top level already is a map
	expectParseError(t, "a:1,2")

	// Values not valid inside map
	expectParseError(t, "x:{1,2}")
}

// --- Process-comment tests (from jsonic.test.js) ---

func TestProcessComment(t *testing.T) {
	expectParse(t, "a:q\nb:w #X\nc:r \n\nd:t\n\n#",
		m("a", "q", "b", "w", "c", "r", "d", "t"))
}

// --- NaN handling ---

func TestNaN(t *testing.T) {
	got, err := Parse("NaN")
	if err != nil {
		t.Fatalf("Parse(\"NaN\") error: %v", err)
	}
	f, ok := got.(float64)
	if !ok || !math.IsNaN(f) {
		t.Errorf("Parse(\"NaN\") expected NaN, got %v", got)
	}
}

// --- Platform mismatch tests ---
// These document behavior differences between Go and TypeScript.

func TestPlatformMismatch_ArrayProperties(t *testing.T) {
	// PLATFORM MISMATCH: Array named properties
	//
	// In TypeScript/JavaScript: [a:1] creates an array with a named property.
	//   JSON.stringify([a:1]) → "[]"
	//   ({...[a:1]}) → {a:1}
	//
	// In Go: []any cannot have named properties.
	// Our parser creates the array but the pair-in-list behavior
	// sets properties on the array node which is a Go map operation
	// that doesn't work on slices. The element is effectively lost.
	//
	// This is a fundamental language platform mismatch.
	// In TS, arrays are objects and can have arbitrary named properties.
	// In Go, slices are strictly ordered collections.

	got, err := Parse("[a:1]")
	if err != nil {
		t.Fatalf("Parse(\"[a:1]\") error: %v", err)
	}
	// In Go we get an empty array (the named property is lost)
	if arr, ok := got.([]any); ok {
		if len(arr) != 0 {
			t.Logf("MISMATCH NOTE: [a:1] produces %s (TS produces [] with .a=1 property)",
				formatValue(got))
		}
	}
}

func TestPlatformMismatch_UndefinedVsNull(t *testing.T) {
	// PLATFORM MISMATCH: undefined vs null
	//
	// In TypeScript: Parse("") returns undefined, Parse("null") returns null.
	// These are distinct values.
	//
	// In Go: Both return nil. There is no Go equivalent of JavaScript's
	// undefined. Internally we use an Undefined sentinel during parsing,
	// but the public API returns nil for both cases.
	//
	// This means consumers cannot distinguish "no value" from "null value"
	// at the API level. For most practical uses this is acceptable.

	emptyResult, err := Parse("")
	if err != nil {
		t.Fatalf("Parse(\"\") error: %v", err)
	}
	nullResult, err := Parse("null")
	if err != nil {
		t.Fatalf("Parse(\"null\") error: %v", err)
	}
	if emptyResult != nil {
		t.Errorf("Parse(\"\") should be nil, got %v", emptyResult)
	}
	if nullResult != nil {
		t.Errorf("Parse(\"null\") should be nil, got %v", nullResult)
	}
	// Both are nil in Go (TS would distinguish undefined from null)
	t.Logf("MISMATCH NOTE: Parse(\"\")=%v and Parse(\"null\")=%v are both nil in Go "+
		"(TS distinguishes undefined from null)", emptyResult, nullResult)
}

func TestPlatformMismatch_NonStringInput(t *testing.T) {
	// PLATFORM MISMATCH: Non-string input
	//
	// In TypeScript: Jsonic({}) returns {}, Jsonic([]) returns [], etc.
	// Non-string inputs are passed through.
	//
	// In Go: Parse() only accepts strings. Non-string inputs require
	// a different API pattern. This is a deliberate design choice
	// since Go is statically typed and the function signature is
	// Parse(string) any.

	t.Logf("MISMATCH NOTE: Go Parse() only accepts strings. " +
		"TS Jsonic() passes through non-string inputs ({}, [], true, etc.)")
}

func TestErrorFormat(t *testing.T) {
	// Verify error format matches TypeScript JsonicError output.

	t.Run("unterminated_string", func(t *testing.T) {
		_, err := Parse(`"unterminated`)
		if err == nil {
			t.Fatal("Expected error")
		}
		je := err.(*JsonicError)
		if je.Code != "unterminated_string" {
			t.Errorf("Code: got %q, want %q", je.Code, "unterminated_string")
		}
		if je.Row != 1 || je.Col != 1 {
			t.Errorf("Position: got %d:%d, want 1:1", je.Row, je.Col)
		}
		// Detail should match TS format: "unterminated string: <src>"
		if !strings.Contains(je.Detail, "unterminated string:") {
			t.Errorf("Detail should contain 'unterminated string:', got %q", je.Detail)
		}
		// Error() should contain [jsonic/<code>] header
		msg := je.Error()
		if !strings.Contains(msg, "[jsonic/unterminated_string]:") {
			t.Errorf("Error() should contain '[jsonic/unterminated_string]:', got:\n%s", msg)
		}
		// Error() should contain --> row:col
		if !strings.Contains(msg, "--> 1:1") {
			t.Errorf("Error() should contain '--> 1:1', got:\n%s", msg)
		}
	})

	t.Run("unterminated_comment", func(t *testing.T) {
		_, err := Parse("/*")
		if err == nil {
			t.Fatal("Expected error")
		}
		je := err.(*JsonicError)
		if je.Code != "unterminated_comment" {
			t.Errorf("Code: got %q, want %q", je.Code, "unterminated_comment")
		}
		if !strings.Contains(je.Detail, "unterminated comment:") {
			t.Errorf("Detail should contain 'unterminated comment:', got %q", je.Detail)
		}
		msg := je.Error()
		if !strings.Contains(msg, "[jsonic/unterminated_comment]:") {
			t.Errorf("Error() missing code header, got:\n%s", msg)
		}
	})

	t.Run("unexpected_close", func(t *testing.T) {
		_, err := Parse("}")
		if err == nil {
			t.Fatal("Expected error")
		}
		je := err.(*JsonicError)
		if je.Code != "unexpected" {
			t.Errorf("Code: got %q, want %q", je.Code, "unexpected")
		}
		if !strings.Contains(je.Detail, "unexpected character(s):") {
			t.Errorf("Detail should contain 'unexpected character(s):', got %q", je.Detail)
		}
		msg := je.Error()
		if !strings.Contains(msg, "[jsonic/unexpected]:") {
			t.Errorf("Error() missing code header, got:\n%s", msg)
		}
	})

	t.Run("multiline_source_extract", func(t *testing.T) {
		// Match the TS test: error on line 11 with context lines
		src := "\n\n\n\n\n\n\n\n\n\n   }"
		_, err := Parse(src)
		if err == nil {
			t.Fatal("Expected error")
		}
		je := err.(*JsonicError)
		msg := je.Error()
		// Should show --> row:col
		if !strings.Contains(msg, "--> 11:4") {
			t.Errorf("Error() should show '--> 11:4', got:\n%s", msg)
		}
		// Should contain line numbers in the source extract
		if !strings.Contains(msg, "11 |") {
			t.Errorf("Error() should contain '11 |' line marker, got:\n%s", msg)
		}
		// Should contain caret marker
		if !strings.Contains(msg, "^") {
			t.Errorf("Error() should contain '^' caret marker, got:\n%s", msg)
		}
	})

	t.Run("multiline_with_context", func(t *testing.T) {
		// Error in middle of source - verify context lines before and after
		src := "a:1\nb:2\nc:3\nd:\"unterminated\ne:5"
		_, err := Parse(src)
		if err == nil {
			t.Fatal("Expected error")
		}
		je := err.(*JsonicError)
		msg := je.Error()
		// Should show context lines
		if !strings.Contains(msg, "|") {
			t.Errorf("Error() should contain '|' line markers, got:\n%s", msg)
		}
		// Should contain caret marker
		if !strings.Contains(msg, "^") {
			t.Errorf("Error() should contain '^' caret, got:\n%s", msg)
		}
	})

	t.Run("error_fields_match_ts", func(t *testing.T) {
		// Verify all structured fields are present (matching TS JsonicError)
		_, err := Parse(`"abc`)
		if err == nil {
			t.Fatal("Expected error")
		}
		je := err.(*JsonicError)
		// Code matches TS error code
		if je.Code == "" {
			t.Error("Code should not be empty")
		}
		// Detail matches TS message format
		if je.Detail == "" {
			t.Error("Detail should not be empty")
		}
		// Row is 1-based (matches TS rI / lineNumber)
		if je.Row < 1 {
			t.Errorf("Row should be >= 1, got %d", je.Row)
		}
		// Col is 1-based (matches TS cI / columnNumber)
		if je.Col < 1 {
			t.Errorf("Col should be >= 1, got %d", je.Col)
		}
		// Src contains the token text (matches TS token.src)
		if je.Src == "" {
			t.Error("Src should not be empty")
		}
	})
}

func TestPlatformMismatch_CustomConfig(t *testing.T) {
	// PLATFORM MISMATCH: Custom configuration
	//
	// In TypeScript: Jsonic.make({...}) creates customized parser instances.
	// Options include: disabling comments, numbers, text; custom string chars;
	// hex/oct/bin number control; number separators; safe key control;
	// rule finish control; map extend control; custom value matchers;
	// custom fixed tokens; plugins.
	//
	// In Go: The parser uses a fixed default configuration.
	// There is no Jsonic.make() equivalent. Tests for custom configs
	// (comment-off, number-off, hex-off, string.allowUnknown, etc.)
	// are not ported.
	//
	// To support these features, the Go implementation would need a
	// builder pattern or options struct for NewParser().

	t.Logf("MISMATCH NOTE: Go has no Jsonic.make() for custom parser config. " +
		"All TS tests using custom config are skipped.")
}

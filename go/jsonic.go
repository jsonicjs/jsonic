// Package jsonic provides a lenient JSON parser that supports relaxed syntax
// including unquoted keys, implicit objects/arrays, comments, trailing commas,
// single-quoted strings, path diving (nested object shorthand), and more.
//
// It is a Go port of the jsonic TypeScript library, faithfully implementing
// the same matcher-based lexer and rule-based parser architecture.
package jsonic

import "strconv"

// JsonicError is the error type returned by Parse when parsing fails.
// It includes structured details about the error location and cause.
type JsonicError struct {
	Code   string // Error code: "unterminated_string", "unterminated_comment", "unexpected"
	Detail string // Human-readable detail message
	Pos    int    // 0-based character position in source
	Row    int    // 1-based line number
	Col    int    // 1-based column number
	Src    string // Source fragment around the error
}

func (e *JsonicError) Error() string {
	return "jsonic: " + e.Code + " at " + strconv.Itoa(e.Row) + ":" + strconv.Itoa(e.Col)
}

// Parse parses a jsonic string and returns the resulting Go value.
// The returned value can be:
//   - map[string]any for objects
//   - []any for arrays
//   - float64 for numbers
//   - string for strings
//   - bool for booleans
//   - nil for null or empty input
//
// Returns a *JsonicError if the input contains a syntax error.
func Parse(src string) (any, error) {
	p := NewParser()
	return p.Start(src)
}

// preprocessEscapes replaces literal backslash-n sequences with real newlines, etc.
// This handles the case where TSV test files contain literal "\n" in the input.
func preprocessEscapes(s string) string {
	if len(s) == 0 {
		return s
	}

	runes := []rune(s)
	var out []rune
	i := 0
	for i < len(runes) {
		if runes[i] == '\\' && i+1 < len(runes) {
			switch runes[i+1] {
			case 'n':
				out = append(out, '\n')
				i += 2
			case 'r':
				out = append(out, '\r')
				i += 2
			case 't':
				out = append(out, '\t')
				i += 2
			default:
				out = append(out, runes[i])
				i++
			}
		} else {
			out = append(out, runes[i])
			i++
		}
	}
	return string(out)
}

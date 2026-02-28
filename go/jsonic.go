// Package jsonic provides a lenient JSON parser that supports relaxed syntax
// including unquoted keys, implicit objects/arrays, comments, trailing commas,
// single-quoted strings, path diving (nested object shorthand), and more.
//
// It is a Go port of the jsonic TypeScript library, faithfully implementing
// the same matcher-based lexer and rule-based parser architecture.
package jsonic

import (
	"strconv"
	"strings"
)

// Error message templates matching TypeScript defaults.
var errorMessages = map[string]string{
	"unexpected":           "unexpected character(s): ",
	"unterminated_string":  "unterminated string: ",
	"unterminated_comment": "unterminated comment: ",
	"unknown":              "unknown error: ",
}

// JsonicError is the error type returned by Parse when parsing fails.
// It includes structured details about the error location and cause.
type JsonicError struct {
	Code   string // Error code: "unterminated_string", "unterminated_comment", "unexpected"
	Detail string // Human-readable detail message (e.g. "unterminated string: \"abc")
	Pos    int    // 0-based character position in source
	Row    int    // 1-based line number
	Col    int    // 1-based column number
	Src    string // Source fragment at the error (the token text)
	Hint   string // Additional explanatory text for this error code

	fullSource string // Complete input source (for generating site extract)
}

// Error returns a formatted error message matching the TypeScript JsonicError format:
//
//	[jsonic/<code>]: <message>
//	  --> <row>:<col>
//	 <line-2> | <source>
//	 <line-1> | <source>
//	    <line> | <source with error>
//	             ^^^^ <message>
//	 <line+1> | <source>
//	 <line+2> | <source>
func (e *JsonicError) Error() string {
	msg := e.Detail

	var b strings.Builder

	// Line 1: [jsonic/<code>]: <message>
	b.WriteString("[jsonic/")
	b.WriteString(e.Code)
	b.WriteString("]: ")
	b.WriteString(msg)

	// Line 2: --> <row>:<col>
	b.WriteString("\n  --> ")
	b.WriteString(strconv.Itoa(e.Row))
	b.WriteString(":")
	b.WriteString(strconv.Itoa(e.Col))

	// Source site extract
	if e.fullSource != "" {
		site := errsite(e.fullSource, e.Src, msg, e.Row, e.Col)
		if site != "" {
			b.WriteString("\n")
			b.WriteString(site)
		}
	}

	// Hint
	if e.Hint != "" {
		b.WriteString("\n  Hint: ")
		b.WriteString(e.Hint)
	}

	return b.String()
}

// errsite generates a source code extract showing the error location,
// matching the TypeScript errsite() function output format.
func errsite(src, sub, msg string, row, col int) string {
	if row < 1 {
		row = 1
	}
	if col < 1 {
		col = 1
	}

	lines := strings.Split(src, "\n")

	// row is 1-based, convert to 0-based index
	lineIdx := row - 1
	if lineIdx >= len(lines) {
		lineIdx = len(lines) - 1
	}

	// Determine padding width based on largest line number shown
	maxLineNum := row + 2
	pad := len(strconv.Itoa(maxLineNum)) + 2

	// Build context lines: 2 before, error line, caret line, 2 after
	var result []string

	ln := func(num int, text string) string {
		numStr := strconv.Itoa(num)
		return strings.Repeat(" ", pad-len(numStr)) + numStr + " | " + text
	}

	// 2 lines before
	if lineIdx-2 >= 0 {
		result = append(result, ln(row-2, lines[lineIdx-2]))
	}
	if lineIdx-1 >= 0 {
		result = append(result, ln(row-1, lines[lineIdx-1]))
	}

	// Error line
	if lineIdx >= 0 && lineIdx < len(lines) {
		result = append(result, ln(row, lines[lineIdx]))
	}

	// Caret line
	caretCount := len(sub)
	if caretCount < 1 {
		caretCount = 1
	}
	indent := strings.Repeat(" ", pad) + "   " + strings.Repeat(" ", col-1)
	result = append(result, indent+strings.Repeat("^", caretCount)+" "+msg)

	// 2 lines after
	if lineIdx+1 < len(lines) {
		result = append(result, ln(row+1, lines[lineIdx+1]))
	}
	if lineIdx+2 < len(lines) {
		result = append(result, ln(row+2, lines[lineIdx+2]))
	}

	return strings.Join(result, "\n")
}

// makeJsonicError creates a JsonicError with the proper Detail message.
func makeJsonicError(code, src, fullSource string, pos, row, col int) *JsonicError {
	tmpl, ok := errorMessages[code]
	if !ok {
		tmpl = errorMessages["unknown"]
	}
	detail := tmpl + src

	return &JsonicError{
		Code:       code,
		Detail:     detail,
		Pos:        pos,
		Row:        row,
		Col:        col,
		Src:        src,
		fullSource: fullSource,
	}
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

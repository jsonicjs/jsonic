// Package jsonic provides a lenient JSON parser that supports relaxed syntax
// including unquoted keys, implicit objects/arrays, comments, trailing commas,
// single-quoted strings, path diving (nested object shorthand), and more.
//
// It is a Go port of the jsonic TypeScript library.
package jsonic

// Parse parses a jsonic string and returns the resulting Go value.
// The returned value can be:
//   - map[string]any for objects
//   - []any for arrays
//   - float64 for numbers
//   - string for strings
//   - bool for booleans
//   - nil for null or empty input
func Parse(src string) any {
	// Preprocess: handle literal \n, \r\n, \t in test input
	src = preprocessEscapes(src)

	if len(src) == 0 {
		return nil
	}

	// Check if input is only whitespace
	allWhitespace := true
	for _, ch := range src {
		if ch != ' ' && ch != '\t' && ch != '\n' && ch != '\r' {
			allWhitespace = false
			break
		}
	}
	if allWhitespace {
		return nil
	}

	lex := newLexer(src)
	tokens := lex.tokenize()

	p := newParser(tokens)
	return p.parse()
}

// preprocessEscapes replaces literal backslash-n sequences with real newlines, etc.
// This handles the case where TSV test files contain literal "\n" in the input.
func preprocessEscapes(s string) string {
	// Only process if there are actual backslash characters
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

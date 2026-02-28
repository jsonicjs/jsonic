package jsonic

import (
	"math"
	"strconv"
	"strings"
)

// parser converts tokens into Go values.
type parser struct {
	tokens []token
	pos    int
}

func newParser(tokens []token) *parser {
	return &parser{tokens: tokens, pos: 0}
}

func (p *parser) peek() token {
	if p.pos >= len(p.tokens) {
		return token{typ: tokenEOF}
	}
	return p.tokens[p.pos]
}

func (p *parser) peekAt(offset int) token {
	idx := p.pos + offset
	if idx >= len(p.tokens) {
		return token{typ: tokenEOF}
	}
	return p.tokens[idx]
}

func (p *parser) advance() token {
	tok := p.tokens[p.pos]
	p.pos++
	return tok
}

func (p *parser) skipNewlines() {
	for p.peek().typ == tokenNewline {
		p.advance()
	}
}

// Parse is the entry point. It parses the full token stream.
func (p *parser) parse() any {
	p.skipNewlines()

	if p.peek().typ == tokenEOF {
		return nil
	}

	result := p.parseTopLevel()
	return result
}

// parseTopLevel handles implicit top-level objects and lists.
// At the top level, without braces/brackets, jsonic tries to detect:
//   - key:value pairs → implicit object
//   - comma-separated values → implicit list
func (p *parser) parseTopLevel() any {
	p.skipNewlines()

	tok := p.peek()

	// Explicit object/array
	if tok.typ == tokenOpenBrace {
		val := p.parseObject()
		p.skipNewlines()
		// Check if there's more at top level after the object: {a:1},
		if p.peek().typ == tokenComma {
			p.advance() // skip comma
			p.skipNewlines()
			if p.peek().typ == tokenEOF {
				// trailing comma after top-level object: `{a:1},` → [{"a":1}]
				return []any{val}
			}
			// More values: `{a:1},{b:2}` → [{a:1},{b:2}]
			arr := []any{val}
			for {
				p.skipNewlines()
				if p.peek().typ == tokenEOF {
					break
				}
				arr = append(arr, p.parseValue())
				p.skipNewlines()
				if p.peek().typ == tokenComma {
					p.advance()
					continue
				}
				break
			}
			return arr
		}
		return val
	}

	if tok.typ == tokenOpenBracket {
		return p.parseArray()
	}

	// Determine if this is an implicit object or implicit list.
	// If we see VALUE COLON, it's an object.
	// If we see VALUE COMMA VALUE or VALUE NEWLINE VALUE where the second
	// value is not a key (no colon after), it could be a list.
	// Also handle: `a,b` → ["a","b"], `1,2` → [1,2]
	// And: `a:1,b:2` → {"a":1,"b":2}
	if p.looksLikeImplicitObject() {
		return p.parseImplicitObject()
	}

	// Check for implicit list: comma-only like `,` or `,,` or `value,value`
	if tok.typ == tokenComma {
		return p.parseImplicitList()
	}

	// Single value or implicit list
	val := p.parseValue()

	if p.peek().typ == tokenComma {
		// It's an implicit list: `a,b` or `1,2`
		p.advance() // skip comma
		return p.continueImplicitList(val)
	}
	if p.peek().typ == tokenNewline {
		p.skipNewlines()
		if p.peek().typ != tokenEOF {
			// Newline-separated values: `1\n2\n3`
			arr := []any{val}
			for p.peek().typ != tokenEOF {
				arr = append(arr, p.parseValue())
				p.skipNewlines()
			}
			return arr
		}
	}

	return val
}

// looksLikeImplicitObject checks if the token stream from current position
// looks like key:value pairs (implicit object).
func (p *parser) looksLikeImplicitObject() bool {
	// Scan forward: if we see a value token followed by colon, it's an object
	i := p.pos
	for i < len(p.tokens) {
		tok := p.tokens[i]
		if tok.typ == tokenNewline {
			i++
			continue
		}
		if isValueToken(tok) {
			// Check if next non-newline token is colon
			j := i + 1
			for j < len(p.tokens) && p.tokens[j].typ == tokenNewline {
				j++
			}
			if j < len(p.tokens) && p.tokens[j].typ == tokenColon {
				return true
			}
		}
		break
	}
	return false
}

// parseImplicitObject parses key:value pairs at the top level without braces.
func (p *parser) parseImplicitObject() any {
	obj := make(map[string]any)
	p.parsePairsInto(obj, tokenEOF)
	return obj
}

// parseImplicitList parses a comma-only top level like `,` or `,,` or `1,2,3`.
func (p *parser) parseImplicitList() any {
	arr := []any{}

	for {
		p.skipNewlines()
		if p.peek().typ == tokenEOF {
			break
		}
		if p.peek().typ == tokenComma {
			arr = append(arr, nil) // leading/double comma → null
			p.advance()
			continue
		}
		val := p.parseValue()
		arr = append(arr, val)
		p.skipNewlines()
		if p.peek().typ == tokenComma {
			p.advance()
			p.skipNewlines()
			if p.peek().typ == tokenEOF {
				// trailing comma → ignore
				break
			}
			continue
		}
		break
	}
	return arr
}

// continueImplicitList continues parsing an implicit list after the first
// value and comma have been consumed.
func (p *parser) continueImplicitList(first any) any {
	arr := []any{first}

	for {
		p.skipNewlines()
		if p.peek().typ == tokenEOF {
			break
		}
		if p.peek().typ == tokenComma {
			arr = append(arr, nil)
			p.advance()
			continue
		}
		val := p.parseValue()
		arr = append(arr, val)
		p.skipNewlines()
		if p.peek().typ == tokenComma {
			p.advance()
			p.skipNewlines()
			if p.peek().typ == tokenEOF {
				break
			}
			continue
		}
		break
	}
	return arr
}

// parseValue parses a single value.
func (p *parser) parseValue() any {
	p.skipNewlines()
	tok := p.peek()

	switch tok.typ {
	case tokenOpenBrace:
		return p.parseObject()
	case tokenOpenBracket:
		return p.parseArray()
	case tokenString:
		p.advance()
		return tok.val
	case tokenNumber:
		p.advance()
		return parseNumber(tok.val)
	case tokenTrue:
		p.advance()
		return true
	case tokenFalse:
		p.advance()
		return false
	case tokenNull:
		p.advance()
		return nil
	case tokenText:
		p.advance()
		return tok.val
	default:
		// Unexpected token - return nil
		if tok.typ != tokenEOF {
			p.advance()
		}
		return nil
	}
}

// parseObject parses { ... }.
func (p *parser) parseObject() any {
	p.advance() // skip {
	p.skipNewlines()

	if p.peek().typ == tokenCloseBrace {
		p.advance()
		return map[string]any{}
	}

	obj := make(map[string]any)
	p.parsePairsInto(obj, tokenCloseBrace)

	p.skipNewlines()
	if p.peek().typ == tokenCloseBrace {
		p.advance()
	}
	// If no closing brace, auto-close (jsonic is lenient)

	return obj
}

// parsePairsInto parses key:value pairs into the given map until endToken.
func (p *parser) parsePairsInto(obj map[string]any, endToken tokenType) {
	for {
		p.skipNewlines()
		tok := p.peek()

		if tok.typ == endToken || tok.typ == tokenEOF {
			break
		}

		// Skip extra commas in objects
		if tok.typ == tokenComma {
			p.advance()
			continue
		}

		// Closing tokens that shouldn't be consumed
		if tok.typ == tokenCloseBrace || tok.typ == tokenCloseBracket {
			break
		}

		// Read key
		key := p.parseKey()

		p.skipNewlines()
		if p.peek().typ == tokenColon {
			p.advance() // skip colon
		} else {
			// No colon found - treat as a value (shouldn't normally happen in object context)
			obj[key] = key
			continue
		}

		p.skipNewlines()

		// Check for implicit null: key with no value (next is comma, close, newline, or EOF)
		next := p.peek()
		if next.typ == tokenComma || next.typ == tokenCloseBrace || next.typ == tokenEOF ||
			next.typ == tokenNewline {
			obj[key] = nil
			continue
		}

		// Check for path diving: key:key2:value → nested objects
		// If the value position has a value token followed by colon, it's path diving
		if p.looksLikePathDive() {
			p.parsePathDive(obj, key, endToken)
		} else {
			val := p.parseValue()
			obj[key] = val
		}

		p.skipNewlines()

		// Separator: comma, newline, or space (implicit)
		if p.peek().typ == tokenComma {
			p.advance()
		} else if p.peek().typ == tokenNewline {
			// newline acts as implicit comma
			continue
		}
		// Space-separated pairs: no explicit separator needed
	}
}

// looksLikePathDive checks if the next tokens look like a path dive:
// VALUE COLON (not followed by open brace/bracket without a further colon)
func (p *parser) looksLikePathDive() bool {
	// We're positioned right after the first colon.
	// Look ahead: VALUE COLON means path dive.
	tok := p.peek()
	if !isValueToken(tok) {
		return false
	}
	// Skip forward to find if there's a colon after this value
	i := p.pos + 1
	for i < len(p.tokens) && p.tokens[i].typ == tokenNewline {
		i++
	}
	if i < len(p.tokens) && p.tokens[i].typ == tokenColon {
		return true
	}
	return false
}

// parsePathDive handles path diving like a:b:c:1 → {"a":{"b":{"c":1}}}
// It also handles merging: a:b:1 followed by a:c:2 → {"a":{"b":1,"c":2}}
func (p *parser) parsePathDive(obj map[string]any, key string, endToken tokenType) {
	// Collect the chain of keys: we already have 'key', now collect more
	keys := []string{key}
	for {
		// Current position should be at the next key token
		keyTok := p.advance() // consume the key token
		nextKey := tokenToString(keyTok)
		p.skipNewlines()

		if p.peek().typ != tokenColon {
			// This was the final value in the chain, not a key
			setNestedValue(obj, keys, tokenToValue(keyTok))
			return
		}
		// It's key:... so consume the colon
		keys = append(keys, nextKey)
		p.advance() // skip colon
		p.skipNewlines()

		// Check if next is still a path dive
		if !p.looksLikePathDive() {
			// Parse the final value
			next := p.peek()
			if next.typ == tokenComma || next.typ == tokenCloseBrace || next.typ == tokenEOF ||
				next.typ == tokenNewline {
				setNestedValue(obj, keys, nil)
			} else {
				val := p.parseValue()
				setNestedValue(obj, keys, val)
			}
			return
		}
	}
}

// setNestedValue sets a value in a nested map structure.
// keys = ["a", "b", "c"], val = 1 → obj["a"]["b"]["c"] = 1
// If intermediate maps exist and are maps, merge into them.
func setNestedValue(obj map[string]any, keys []string, val any) {
	current := obj
	for i := 0; i < len(keys)-1; i++ {
		k := keys[i]
		if existing, ok := current[k]; ok {
			if m, ok := existing.(map[string]any); ok {
				current = m
				continue
			}
		}
		m := make(map[string]any)
		current[k] = m
		current = m
	}
	current[keys[len(keys)-1]] = val
}

// parseKey reads a key (string, text, number, true, false, null can all be keys).
func (p *parser) parseKey() string {
	tok := p.advance()
	switch tok.typ {
	case tokenString:
		return tok.val
	case tokenText:
		return tok.val
	case tokenNumber:
		return tok.val
	case tokenTrue:
		return "true"
	case tokenFalse:
		return "false"
	case tokenNull:
		return "null"
	default:
		return tok.val
	}
}

// parseArray parses [ ... ].
func (p *parser) parseArray() any {
	p.advance() // skip [
	p.skipNewlines()

	arr := []any{}

	if p.peek().typ == tokenCloseBracket {
		p.advance()
		return arr
	}

	for {
		p.skipNewlines()
		tok := p.peek()

		if tok.typ == tokenCloseBracket || tok.typ == tokenEOF {
			break
		}

		if tok.typ == tokenComma {
			arr = append(arr, nil) // comma without value → null
			p.advance()
			p.skipNewlines()
			continue
		}

		val := p.parseValue()
		arr = append(arr, val)

		p.skipNewlines()

		if p.peek().typ == tokenComma {
			p.advance()
			p.skipNewlines()
			// Check for trailing comma before close bracket
			if p.peek().typ == tokenCloseBracket {
				break
			}
			continue
		}

		// Implicit comma: space/newline separated values in arrays
		if p.peek().typ == tokenNewline {
			p.skipNewlines()
			if p.peek().typ == tokenCloseBracket || p.peek().typ == tokenEOF {
				break
			}
			continue
		}

		// Implicit comma between adjacent values: [a b], [a [b]], [a {b:2}]
		if p.peek().typ != tokenCloseBracket && p.peek().typ != tokenEOF {
			continue
		}

		break
	}

	if p.peek().typ == tokenCloseBracket {
		p.advance()
	}

	return arr
}

// parseNumber converts a number string to float64.
func parseNumber(s string) float64 {
	// Handle underscore separators
	s = strings.ReplaceAll(s, "_", "")

	// Handle hex
	if len(s) >= 2 && s[0] == '0' && (s[1] == 'x' || s[1] == 'X') {
		val, err := strconv.ParseInt(s[2:], 16, 64)
		if err != nil {
			return 0
		}
		return float64(val)
	}
	// Handle negative hex
	if len(s) >= 3 && s[0] == '-' && s[1] == '0' && (s[2] == 'x' || s[2] == 'X') {
		val, err := strconv.ParseInt(s[3:], 16, 64)
		if err != nil {
			return 0
		}
		return float64(-val)
	}

	// Handle octal
	if len(s) >= 2 && s[0] == '0' && (s[1] == 'o' || s[1] == 'O') {
		val, err := strconv.ParseInt(s[2:], 8, 64)
		if err != nil {
			return 0
		}
		return float64(val)
	}

	// Handle binary
	if len(s) >= 2 && s[0] == '0' && (s[1] == 'b' || s[1] == 'B') {
		val, err := strconv.ParseInt(s[2:], 2, 64)
		if err != nil {
			return 0
		}
		return float64(val)
	}

	val, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}

	// Normalize -0 to 0
	if val == 0 {
		return 0
	}

	return val
}

// isValueToken returns true if the token can be a value or key.
func isValueToken(tok token) bool {
	switch tok.typ {
	case tokenString, tokenText, tokenNumber, tokenTrue, tokenFalse, tokenNull:
		return true
	}
	return false
}

// tokenToString returns the string representation of a token for use as a key.
func tokenToString(tok token) string {
	switch tok.typ {
	case tokenString:
		return tok.val
	case tokenTrue:
		return "true"
	case tokenFalse:
		return "false"
	case tokenNull:
		return "null"
	default:
		return tok.val
	}
}

// tokenToValue converts a token to its Go value.
func tokenToValue(tok token) any {
	switch tok.typ {
	case tokenString:
		return tok.val
	case tokenNumber:
		return parseNumber(tok.val)
	case tokenTrue:
		return true
	case tokenFalse:
		return false
	case tokenNull:
		return nil
	case tokenText:
		return tok.val
	default:
		return tok.val
	}
}

// normalizeNumber cleans up float64 for JSON comparison:
// if the float64 is a whole number, ensure it compares properly.
func normalizeNumber(v float64) any {
	if math.IsInf(v, 0) || math.IsNaN(v) {
		return v
	}
	return v
}

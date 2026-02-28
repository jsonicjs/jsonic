package jsonic

import (
	"strings"
	"unicode"
)

// tokenType identifies the kind of token.
type tokenType int

const (
	tokenEOF         tokenType = iota
	tokenOpenBrace             // {
	tokenCloseBrace            // }
	tokenOpenBracket           // [
	tokenCloseBracket          // ]
	tokenColon                 // :
	tokenComma                 // ,
	tokenString                // quoted string value
	tokenNumber                // numeric literal
	tokenText                  // unquoted text
	tokenTrue                  // true
	tokenFalse                 // false
	tokenNull                  // null
	tokenNewline               // \n or \r\n (significant for implicit commas)
)

// token represents a lexical token.
type token struct {
	typ tokenType
	val string // raw string value; for strings, the unescaped content
}

// lexer tokenizes jsonic input.
type lexer struct {
	src []rune
	pos int
}

func newLexer(src string) *lexer {
	return &lexer{src: []rune(src), pos: 0}
}

func (l *lexer) peek() rune {
	if l.pos >= len(l.src) {
		return 0
	}
	return l.src[l.pos]
}

func (l *lexer) advance() rune {
	ch := l.src[l.pos]
	l.pos++
	return ch
}

func (l *lexer) atEnd() bool {
	return l.pos >= len(l.src)
}

// tokenize produces all tokens from the input.
func (l *lexer) tokenize() []token {
	var tokens []token
	for {
		tok := l.nextToken()
		tokens = append(tokens, tok)
		if tok.typ == tokenEOF {
			break
		}
	}
	return tokens
}

func (l *lexer) nextToken() token {
	l.skipSpacesAndComments()

	if l.atEnd() {
		return token{typ: tokenEOF}
	}

	ch := l.peek()

	// Check for newlines (emit as tokens for implicit comma handling)
	if ch == '\n' || ch == '\r' {
		l.consumeNewline()
		// Skip additional whitespace/newlines
		for !l.atEnd() {
			c := l.peek()
			if c == '\n' || c == '\r' {
				l.consumeNewline()
			} else if c == ' ' || c == '\t' {
				l.advance()
			} else {
				break
			}
		}
		return token{typ: tokenNewline}
	}

	switch ch {
	case '{':
		l.advance()
		return token{typ: tokenOpenBrace, val: "{"}
	case '}':
		l.advance()
		return token{typ: tokenCloseBrace, val: "}"}
	case '[':
		l.advance()
		return token{typ: tokenOpenBracket, val: "["}
	case ']':
		l.advance()
		return token{typ: tokenCloseBracket, val: "]"}
	case ':':
		l.advance()
		return token{typ: tokenColon, val: ":"}
	case ',':
		l.advance()
		return token{typ: tokenComma, val: ","}
	case '"', '\'', '`':
		return l.readString(ch)
	default:
		// Try number, then fall back to text
		if ch == '-' || ch == '+' || (ch >= '0' && ch <= '9') || ch == '.' {
			if tok, ok := l.tryNumber(); ok {
				return tok
			}
		}
		return l.readText()
	}
}

// skipSpacesAndComments skips spaces, tabs, and comments but NOT newlines.
func (l *lexer) skipSpacesAndComments() {
	for !l.atEnd() {
		ch := l.peek()
		if ch == ' ' || ch == '\t' {
			l.advance()
			continue
		}
		// Line comments
		if ch == '#' {
			l.skipLineComment()
			continue
		}
		if ch == '/' && l.pos+1 < len(l.src) {
			next := l.src[l.pos+1]
			if next == '/' {
				l.skipLineComment()
				continue
			}
			if next == '*' {
				l.skipBlockComment()
				continue
			}
		}
		break
	}
}

func (l *lexer) skipLineComment() {
	for !l.atEnd() {
		ch := l.advance()
		if ch == '\n' {
			break
		}
	}
}

func (l *lexer) skipBlockComment() {
	l.advance() // /
	l.advance() // *
	for !l.atEnd() {
		ch := l.advance()
		if ch == '*' && !l.atEnd() && l.peek() == '/' {
			l.advance()
			return
		}
	}
}

func (l *lexer) consumeNewline() {
	ch := l.advance()
	if ch == '\r' && !l.atEnd() && l.peek() == '\n' {
		l.advance()
	}
}

// readString reads a quoted string (", ', or `).
func (l *lexer) readString(quote rune) token {
	l.advance() // skip opening quote
	var sb strings.Builder
	for !l.atEnd() {
		ch := l.advance()
		if ch == '\\' && quote != '`' {
			if l.atEnd() {
				sb.WriteRune('\\')
				break
			}
			esc := l.advance()
			switch esc {
			case 'n':
				sb.WriteRune('\n')
			case 'r':
				sb.WriteRune('\r')
			case 't':
				sb.WriteRune('\t')
			case '\\':
				sb.WriteRune('\\')
			case '/':
				sb.WriteRune('/')
			case 'b':
				sb.WriteRune('\b')
			case 'f':
				sb.WriteRune('\f')
			case '"':
				sb.WriteRune('"')
			case '\'':
				sb.WriteRune('\'')
			case '`':
				sb.WriteRune('`')
			case 'u':
				sb.WriteRune(l.readUnicodeEscape())
			case 'x':
				sb.WriteRune(l.readHexEscape())
			default:
				// Allow unknown escapes - just emit the character
				sb.WriteRune(esc)
			}
		} else if ch == quote {
			break
		} else {
			sb.WriteRune(ch)
		}
	}
	return token{typ: tokenString, val: sb.String()}
}

func (l *lexer) readUnicodeEscape() rune {
	// Handle \u{HHHH} or \uHHHH
	if !l.atEnd() && l.peek() == '{' {
		l.advance() // skip {
		var hex strings.Builder
		for !l.atEnd() && l.peek() != '}' {
			hex.WriteRune(l.advance())
		}
		if !l.atEnd() {
			l.advance() // skip }
		}
		return parseHexRune(hex.String())
	}
	// Standard 4-digit
	var hex strings.Builder
	for i := 0; i < 4 && !l.atEnd(); i++ {
		hex.WriteRune(l.advance())
	}
	return parseHexRune(hex.String())
}

func (l *lexer) readHexEscape() rune {
	var hex strings.Builder
	for i := 0; i < 2 && !l.atEnd(); i++ {
		hex.WriteRune(l.advance())
	}
	return parseHexRune(hex.String())
}

func parseHexRune(hex string) rune {
	var val rune
	for _, ch := range hex {
		val <<= 4
		switch {
		case ch >= '0' && ch <= '9':
			val |= ch - '0'
		case ch >= 'a' && ch <= 'f':
			val |= ch - 'a' + 10
		case ch >= 'A' && ch <= 'F':
			val |= ch - 'A' + 10
		}
	}
	return val
}

// tryNumber attempts to parse a number. Returns (token, true) on success.
// If the token turns out to be text (like "1a" or "0x" with no digits), returns false.
func (l *lexer) tryNumber() (token, bool) {
	start := l.pos
	var sb strings.Builder

	ch := l.peek()

	// Handle sign
	if ch == '-' || ch == '+' {
		sb.WriteRune(ch)
		l.advance()
		if l.atEnd() {
			l.pos = start
			return token{}, false
		}
		ch = l.peek()
	}

	// Check for hex: 0x or 0X
	if ch == '0' && l.pos+1 < len(l.src) && (l.src[l.pos+1] == 'x' || l.src[l.pos+1] == 'X') {
		sb.WriteRune(l.advance()) // 0
		sb.WriteRune(l.advance()) // x
		hexCount := 0
		for !l.atEnd() && isHexDigit(l.peek()) {
			sb.WriteRune(l.advance())
			hexCount++
		}
		if hexCount == 0 {
			// "0x" with no hex digits → text
			l.pos = start
			return token{}, false
		}
		// Check for trailing alpha/digit that would make this text
		if !l.atEnd() && isTextChar(l.peek()) && !isTokenBreak(l.peek()) {
			l.pos = start
			return token{}, false
		}
		return token{typ: tokenNumber, val: sb.String()}, true
	}

	// Check for octal: 0o
	if ch == '0' && l.pos+1 < len(l.src) && (l.src[l.pos+1] == 'o' || l.src[l.pos+1] == 'O') {
		sb.WriteRune(l.advance()) // 0
		sb.WriteRune(l.advance()) // o
		octCount := 0
		for !l.atEnd() && l.peek() >= '0' && l.peek() <= '7' {
			sb.WriteRune(l.advance())
			octCount++
		}
		if octCount == 0 {
			l.pos = start
			return token{}, false
		}
		if !l.atEnd() && isTextChar(l.peek()) && !isTokenBreak(l.peek()) {
			l.pos = start
			return token{}, false
		}
		return token{typ: tokenNumber, val: sb.String()}, true
	}

	// Check for binary: 0b
	if ch == '0' && l.pos+1 < len(l.src) && (l.src[l.pos+1] == 'b' || l.src[l.pos+1] == 'B') {
		sb.WriteRune(l.advance()) // 0
		sb.WriteRune(l.advance()) // b
		binCount := 0
		for !l.atEnd() && (l.peek() == '0' || l.peek() == '1') {
			sb.WriteRune(l.advance())
			binCount++
		}
		if binCount == 0 {
			l.pos = start
			return token{}, false
		}
		if !l.atEnd() && isTextChar(l.peek()) && !isTokenBreak(l.peek()) {
			l.pos = start
			return token{}, false
		}
		return token{typ: tokenNumber, val: sb.String()}, true
	}

	// Regular number: digits, optional dot, optional exponent
	hasDigit := false

	// Integer part
	for !l.atEnd() && l.peek() >= '0' && l.peek() <= '9' {
		sb.WriteRune(l.advance())
		hasDigit = true
	}

	// Decimal point
	if !l.atEnd() && l.peek() == '.' {
		nextAfterDot := rune(0)
		if l.pos+1 < len(l.src) {
			nextAfterDot = l.src[l.pos+1]
		}
		// Only treat as decimal if followed by digit or end/token break
		if nextAfterDot >= '0' && nextAfterDot <= '9' {
			sb.WriteRune(l.advance()) // .
			for !l.atEnd() && l.peek() >= '0' && l.peek() <= '9' {
				sb.WriteRune(l.advance())
			}
		} else if hasDigit {
			// "0." followed by non-digit like "0.a" → text
			// Check if what follows the dot is a letter
			if nextAfterDot != 0 && !isTokenBreak(nextAfterDot) && nextAfterDot != ',' && nextAfterDot != '}' && nextAfterDot != ']' && nextAfterDot != ':' && nextAfterDot != ' ' && nextAfterDot != '\t' && nextAfterDot != '\n' && nextAfterDot != '\r' {
				l.pos = start
				return token{}, false
			}
			// "0." at end or before delimiter → just "0" - back up
			// Actually "0." should be 0. Let's consume it
			sb.WriteRune(l.advance()) // .
		}
	}

	if !hasDigit {
		l.pos = start
		return token{}, false
	}

	// Exponent
	if !l.atEnd() && (l.peek() == 'e' || l.peek() == 'E') {
		nextAfterE := rune(0)
		if l.pos+1 < len(l.src) {
			nextAfterE = l.src[l.pos+1]
		}
		// Is it a valid exponent?
		if nextAfterE >= '0' && nextAfterE <= '9' || nextAfterE == '+' || nextAfterE == '-' {
			sb.WriteRune(l.advance()) // e/E
			if !l.atEnd() && (l.peek() == '+' || l.peek() == '-') {
				sb.WriteRune(l.advance())
			}
			expDigits := 0
			for !l.atEnd() && l.peek() >= '0' && l.peek() <= '9' {
				sb.WriteRune(l.advance())
				expDigits++
			}
			// Check trailing text after exponent
			if !l.atEnd() && isTextChar(l.peek()) && !isTokenBreak(l.peek()) {
				l.pos = start
				return token{}, false
			}
			if expDigits == 0 {
				l.pos = start
				return token{}, false
			}
		} else {
			// e followed by non-numeric → this might be text like "1e2e"
			// We have digits so far, check if the 'e' is followed by something that makes it all text
			if nextAfterE != 0 && !isTokenBreak(nextAfterE) && nextAfterE != ',' && nextAfterE != '}' && nextAfterE != ']' && nextAfterE != ':' && nextAfterE != ' ' && nextAfterE != '\t' && nextAfterE != '\n' && nextAfterE != '\r' {
				l.pos = start
				return token{}, false
			}
		}
	}

	// Check for trailing alpha that would make it text (e.g. "10b", "1a")
	if !l.atEnd() {
		next := l.peek()
		if isTextChar(next) && !isTokenBreak(next) {
			l.pos = start
			return token{}, false
		}
	}

	return token{typ: tokenNumber, val: sb.String()}, true
}

// readText reads unquoted text until a delimiter is hit.
// Text tokens stop at spaces, which act as token separators in jsonic.
func (l *lexer) readText() token {
	var sb strings.Builder
	for !l.atEnd() {
		ch := l.peek()
		if ch == '{' || ch == '}' || ch == '[' || ch == ']' ||
			ch == ':' || ch == ',' ||
			ch == ' ' || ch == '\t' ||
			ch == '\n' || ch == '\r' ||
			ch == '"' || ch == '\'' || ch == '`' {
			break
		}
		// Comments
		if ch == '#' {
			break
		}
		if ch == '/' && l.pos+1 < len(l.src) && (l.src[l.pos+1] == '/' || l.src[l.pos+1] == '*') {
			break
		}

		sb.WriteRune(l.advance())
	}

	val := sb.String()

	// Check for keywords
	switch val {
	case "true":
		return token{typ: tokenTrue, val: val}
	case "false":
		return token{typ: tokenFalse, val: val}
	case "null":
		return token{typ: tokenNull, val: val}
	}

	return token{typ: tokenText, val: val}
}

func isHexDigit(ch rune) bool {
	return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
}

func isTextChar(ch rune) bool {
	return ch != '{' && ch != '}' && ch != '[' && ch != ']' &&
		ch != ':' && ch != ',' &&
		ch != '"' && ch != '\'' && ch != '`' &&
		ch != '\n' && ch != '\r' &&
		!unicode.IsSpace(ch)
}

func isTokenBreak(ch rune) bool {
	return ch == '{' || ch == '}' || ch == '[' || ch == ']' ||
		ch == ':' || ch == ',' ||
		ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r' ||
		ch == '"' || ch == '\'' || ch == '`'
}

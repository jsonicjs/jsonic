package jsonic

import (
	"math"
	"strconv"
	"strings"
	"unicode"
)

// Lex is the lexer that produces tokens from source text.
type Lex struct {
	Src    string
	pnt    Point
	end    *Token    // End-of-source token (cached)
	tokens []*Token  // Lookahead token queue
	Config *LexConfig
}

// LexConfig holds lexer configuration.
type LexConfig struct {
	StringChars  map[rune]bool // Quote characters
	MultiChars   map[rune]bool // Multiline quote characters
	EscapeChar   rune
	SpaceChars   map[rune]bool
	LineChars    map[rune]bool
	RowChars     map[rune]bool
	CommentLine  []string // Line comment starters: "#", "//"
	CommentBlock [][2]string // Block comment: [start, end] pairs
	NumberHex    bool
	NumberOct    bool
	NumberBin    bool
	NumberSep    rune // Separator char (underscore)
	AllowUnknownEscape bool
	FinishRule   bool // Auto-close unclosed structures at EOF
}

// DefaultLexConfig returns the default lexer configuration matching jsonic defaults.
func DefaultLexConfig() *LexConfig {
	return &LexConfig{
		StringChars:  map[rune]bool{'\'': true, '"': true, '`': true},
		MultiChars:   map[rune]bool{'`': true},
		EscapeChar:   '\\',
		SpaceChars:   map[rune]bool{' ': true, '\t': true},
		LineChars:    map[rune]bool{'\r': true, '\n': true},
		RowChars:     map[rune]bool{'\n': true},
		CommentLine:  []string{"#", "//"},
		CommentBlock: [][2]string{{"/*", "*/"}},
		NumberHex:    true,
		NumberOct:    true,
		NumberBin:    true,
		NumberSep:    '_',
		AllowUnknownEscape: true,
		FinishRule:   true,
	}
}

// NewLex creates a new lexer for the given source.
func NewLex(src string, cfg *LexConfig) *Lex {
	return &Lex{
		Src:    src,
		pnt:    Point{Len: len(src), SI: 0, RI: 1, CI: 1},
		Config: cfg,
	}
}

// Token creates a new token at the current point.
func (l *Lex) Token(name string, tin Tin, val any, src string) *Token {
	return MakeToken(name, tin, val, src, l.pnt)
}

// Next returns the next non-IGNORE token.
// This is the core lexing method called by the parser.
// rule and tI are provided for context but not currently used in the simplified port.
func (l *Lex) Next() *Token {
	for {
		tkn := l.nextRaw()
		if tkn == nil {
			panic("jsonic: unexpected character at position " + strconv.Itoa(l.pnt.SI))
		}
		// Bad token → panic with error details
		if tkn.Tin == TinBD {
			panic("jsonic: " + tkn.Why + " at position " + strconv.Itoa(tkn.SI))
		}
		// Skip IGNORE tokens (space, line, comment)
		if TinSetIGNORE[tkn.Tin] {
			continue
		}
		return tkn
	}
}

// nextRaw returns the next raw token (including IGNORE tokens).
func (l *Lex) nextRaw() *Token {
	// Return cached end token
	if l.end != nil {
		return l.end
	}

	// Return queued lookahead tokens
	if len(l.tokens) > 0 {
		tkn := l.tokens[0]
		l.tokens = l.tokens[1:]
		return tkn
	}

	// End of source
	if l.pnt.SI >= l.pnt.Len {
		l.end = l.Token("#ZZ", TinZZ, Undefined, "")
		return l.end
	}

	// Try matchers in order: match, fixed, space, line, string, comment, number, text
	// (We skip 'match' as it's for plugins only)

	if tkn := l.matchFixed(); tkn != nil {
		return tkn
	}
	if tkn := l.matchSpace(); tkn != nil {
		return tkn
	}
	if tkn := l.matchLine(); tkn != nil {
		return tkn
	}
	if tkn := l.matchString(); tkn != nil {
		return tkn
	}
	if tkn := l.matchComment(); tkn != nil {
		return tkn
	}
	if tkn := l.matchNumber(); tkn != nil {
		return tkn
	}
	if tkn := l.matchText(); tkn != nil {
		return tkn
	}

	// Bad token - no matcher matched
	return l.bad("unexpected", l.pnt.SI, l.pnt.SI+1)
}

func (l *Lex) bad(why string, pstart, pend int) *Token {
	src := ""
	if pstart >= 0 && pstart < len(l.Src) && pend <= len(l.Src) {
		src = l.Src[pstart:pend]
	} else if l.pnt.SI < len(l.Src) {
		src = string(l.Src[l.pnt.SI])
	}
	tkn := l.Token("#BD", TinBD, nil, src)
	tkn.Why = why
	return tkn
}

// matchFixed matches fixed tokens: { } [ ] : ,
func (l *Lex) matchFixed() *Token {
	if l.pnt.SI >= l.pnt.Len {
		return nil
	}
	ch := l.Src[l.pnt.SI]
	src := string(ch)
	tin, ok := FixedTokens[src]
	if !ok {
		return nil
	}
	tkn := l.Token(tinName(tin), tin, nil, src)
	l.pnt.SI++
	l.pnt.CI++
	return tkn
}

// matchSpace matches space and tab characters.
func (l *Lex) matchSpace() *Token {
	sI := l.pnt.SI
	cI := l.pnt.CI
	for sI < l.pnt.Len && l.Config.SpaceChars[rune(l.Src[sI])] {
		sI++
		cI++
	}
	if sI > l.pnt.SI {
		src := l.Src[l.pnt.SI:sI]
		tkn := l.Token("#SP", TinSP, nil, src)
		l.pnt.SI = sI
		l.pnt.CI = cI
		return tkn
	}
	return nil
}

// matchLine matches line ending characters (\r, \n).
func (l *Lex) matchLine() *Token {
	sI := l.pnt.SI
	rI := l.pnt.RI
	for sI < l.pnt.Len && l.Config.LineChars[rune(l.Src[sI])] {
		if l.Config.RowChars[rune(l.Src[sI])] {
			rI++
		}
		sI++
	}
	if sI > l.pnt.SI {
		src := l.Src[l.pnt.SI:sI]
		tkn := l.Token("#LN", TinLN, nil, src)
		l.pnt.SI = sI
		l.pnt.RI = rI
		l.pnt.CI = 1
		return tkn
	}
	return nil
}

// matchComment matches line comments (# //) and block comments (/* */).
func (l *Lex) matchComment() *Token {
	fwd := l.Src[l.pnt.SI:]

	// Line comments
	for _, start := range l.Config.CommentLine {
		if strings.HasPrefix(fwd, start) {
			fI := len(start)
			cI := l.pnt.CI + len(start)
			for fI < len(fwd) && !l.Config.LineChars[rune(fwd[fI])] {
				cI++
				fI++
			}
			src := fwd[:fI]
			tkn := l.Token("#CM", TinCM, nil, src)
			l.pnt.SI += len(src)
			l.pnt.CI = cI
			return tkn
		}
	}

	// Block comments
	for _, pair := range l.Config.CommentBlock {
		start, end := pair[0], pair[1]
		if strings.HasPrefix(fwd, start) {
			rI := l.pnt.RI
			cI := l.pnt.CI + len(start)
			fI := len(start)
			for fI < len(fwd) && !strings.HasPrefix(fwd[fI:], end) {
				if l.Config.RowChars[rune(fwd[fI])] {
					rI++
					cI = 0
				}
				cI++
				fI++
			}
			if strings.HasPrefix(fwd[fI:], end) {
				cI += len(end)
				src := fwd[:fI+len(end)]
				tkn := l.Token("#CM", TinCM, nil, src)
				l.pnt.SI += len(src)
				l.pnt.RI = rI
				l.pnt.CI = cI
				return tkn
			}
			// Unterminated comment - return bad token
			return l.bad("unterminated_comment", l.pnt.SI, l.pnt.SI+len(start)*9)
		}
	}

	return nil
}

// matchString matches quoted strings: "...", '...', `...`
func (l *Lex) matchString() *Token {
	if l.pnt.SI >= l.pnt.Len {
		return nil
	}
	q := rune(l.Src[l.pnt.SI])
	if !l.Config.StringChars[q] {
		return nil
	}

	isMultiLine := l.Config.MultiChars[q]
	src := l.Src
	sI := l.pnt.SI + 1
	rI := l.pnt.RI
	cI := l.pnt.CI + 1

	var sb strings.Builder
	srclen := len(src)
	foundClose := false

	for sI < srclen {
		cI++
		c := rune(src[sI])

		// End quote
		if c == q {
			sI++
			foundClose = true
			break
		}

		// Escape character (all string types process escapes)
		if c == l.Config.EscapeChar {
			sI++
			cI++
			if sI >= srclen {
				break
			}
			esc := src[sI]
			switch esc {
			case 'b':
				sb.WriteByte('\b')
			case 'f':
				sb.WriteByte('\f')
			case 'n':
				sb.WriteByte('\n')
			case 'r':
				sb.WriteByte('\r')
			case 't':
				sb.WriteByte('\t')
			case 'v':
				sb.WriteByte('\v')
			case '"':
				sb.WriteByte('"')
			case '\'':
				sb.WriteByte('\'')
			case '`':
				sb.WriteByte('`')
			case '\\':
				sb.WriteByte('\\')
			case '/':
				sb.WriteByte('/')
			case 'x':
				// ASCII escape \x**
				sI++
				if sI+2 <= srclen {
					cc := parseHexInt(src[sI : sI+2])
					if cc >= 0 {
						sb.WriteRune(rune(cc))
						sI += 1 // loop will increment
						cI += 2
					} else {
						sb.WriteByte(esc)
						sI--
					}
				}
			case 'u':
				// Unicode escape \u**** or \u{*****}
				sI++
				if sI < srclen && src[sI] == '{' {
					sI++
					endI := strings.IndexByte(src[sI:], '}')
					if endI >= 0 {
						cc := parseHexInt(src[sI : sI+endI])
						if cc >= 0 {
							sb.WriteRune(rune(cc))
							sI += endI // skip past digits, loop handles +1
							cI += endI + 2
						}
					}
				} else if sI+4 <= srclen {
					cc := parseHexInt(src[sI : sI+4])
					if cc >= 0 {
						sb.WriteRune(rune(cc))
						sI += 3
						cI += 4
					}
				}
			default:
				if l.Config.AllowUnknownEscape {
					sb.WriteByte(esc)
				}
			}
			sI++
			continue
		}

		// Check for unprintable / multiline
		if c < 32 {
			if isMultiLine && l.Config.LineChars[c] {
				if l.Config.RowChars[c] {
					rI++
				}
				cI = 1
				sb.WriteByte(src[sI])
				sI++
				continue
			}
			// Non-multiline unprintable - bad
			break
		}

		// Normal body - fast scan
		bI := sI
		for sI < srclen {
			cc := rune(src[sI])
			if cc < 32 || cc == q || cc == rune(l.Config.EscapeChar) {
				break
			}
			sI++
			cI++
		}
		cI-- // loop will re-increment
		sb.WriteString(src[bI:sI])
		continue
	}

	// Check for unterminated string
	if !foundClose {
		return l.bad("unterminated_string", l.pnt.SI, sI)
	}

	val := sb.String()
	ssrc := src[l.pnt.SI:sI]
	tkn := l.Token("#ST", TinST, val, ssrc)
	l.pnt.SI = sI
	l.pnt.RI = rI
	l.pnt.CI = cI
	return tkn
}

// matchNumber matches numeric literals: decimal, hex (0x), octal (0o), binary (0b).
// Returns nil if the text at current position is not a valid number (lets text matcher try).
func (l *Lex) matchNumber() *Token {
	if l.pnt.SI >= l.pnt.Len {
		return nil
	}

	src := l.Src
	sI := l.pnt.SI
	ch := src[sI]

	// Must start with digit, +, -, or .
	if !isDigit(ch) && ch != '-' && ch != '+' && ch != '.' {
		return nil
	}

	// Save start position for backtracking
	start := sI

	// Handle sign
	hasSign := false
	if ch == '-' || ch == '+' {
		hasSign = true
		sI++
		if sI >= len(src) {
			return nil
		}
		ch = src[sI]
	}

	// Hex: 0x...
	if ch == '0' && sI+1 < len(src) && (src[sI+1] == 'x' || src[sI+1] == 'X') && l.Config.NumberHex {
		sI += 2
		hexStart := sI
		for sI < len(src) && (isHexDigitByte(src[sI]) || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
			sI++
		}
		if sI == hexStart {
			// "0x" with no hex digits → let text matcher handle
			return nil
		}
		// Check trailing text
		if l.isFollowingText(sI) {
			return nil
		}
		msrc := src[start:sI]
		nstr := msrc
		if l.Config.NumberSep != 0 {
			nstr = strings.ReplaceAll(nstr, string(l.Config.NumberSep), "")
		}
		num := parseNumericString(nstr)
		if num != num { // NaN check
			return nil
		}
		tkn := l.Token("#NR", TinNR, num, msrc)
		l.pnt.SI = sI
		l.pnt.CI += sI - start
		return tkn
	}

	// Octal: 0o...
	if ch == '0' && sI+1 < len(src) && (src[sI+1] == 'o' || src[sI+1] == 'O') && l.Config.NumberOct {
		sI += 2
		octStart := sI
		for sI < len(src) && ((src[sI] >= '0' && src[sI] <= '7') || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
			sI++
		}
		if sI == octStart {
			return nil
		}
		if l.isFollowingText(sI) {
			return nil
		}
		msrc := src[start:sI]
		nstr := msrc
		if l.Config.NumberSep != 0 {
			nstr = strings.ReplaceAll(nstr, string(l.Config.NumberSep), "")
		}
		num := parseNumericString(nstr)
		if num != num {
			return nil
		}
		tkn := l.Token("#NR", TinNR, num, msrc)
		l.pnt.SI = sI
		l.pnt.CI += sI - start
		return tkn
	}

	// Binary: 0b...
	if ch == '0' && sI+1 < len(src) && (src[sI+1] == 'b' || src[sI+1] == 'B') && l.Config.NumberBin {
		sI += 2
		binStart := sI
		for sI < len(src) && ((src[sI] == '0' || src[sI] == '1') || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
			sI++
		}
		if sI == binStart {
			return nil
		}
		if l.isFollowingText(sI) {
			return nil
		}
		msrc := src[start:sI]
		nstr := msrc
		if l.Config.NumberSep != 0 {
			nstr = strings.ReplaceAll(nstr, string(l.Config.NumberSep), "")
		}
		num := parseNumericString(nstr)
		if num != num {
			return nil
		}
		tkn := l.Token("#NR", TinNR, num, msrc)
		l.pnt.SI = sI
		l.pnt.CI += sI - start
		return tkn
	}

	// Decimal number: optional leading dot, digits, decimal, exponent
	// Pattern: \.?[0-9]+([0-9_]*[0-9])? (\.[0-9]?([0-9_]*[0-9])?)? ([eE][-+]?[0-9]+([0-9_]*[0-9])?)?
	hasDigits := false

	// Leading dot
	if ch == '.' {
		if sI+1 >= len(src) || !isDigit(src[sI+1]) {
			return nil // Just a dot, not a number
		}
		sI++ // consume dot
		for sI < len(src) && (isDigit(src[sI]) || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
			sI++
			hasDigits = true
		}
	} else {
		// Integer part
		for sI < len(src) && (isDigit(src[sI]) || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
			hasDigits = true
			sI++
		}
	}

	if !hasDigits {
		return nil
	}

	// Decimal point
	if sI < len(src) && src[sI] == '.' {
		// Check what follows the dot
		if sI+1 < len(src) && isDigit(src[sI+1]) {
			sI++ // consume dot
			for sI < len(src) && (isDigit(src[sI]) || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
				sI++
			}
		} else if sI+1 < len(src) && l.isFollowingText(sI+1) && src[sI+1] != '.' {
			// "0.a" → not a number, let text handle it
			return nil
		} else {
			// Trailing dot: "0." at end or before delimiter
			sI++ // consume dot
		}
	}

	// Exponent
	if sI < len(src) && (src[sI] == 'e' || src[sI] == 'E') {
		eSI := sI
		sI++ // consume e
		if sI < len(src) && (src[sI] == '+' || src[sI] == '-') {
			sI++
		}
		expStart := sI
		for sI < len(src) && (isDigit(src[sI]) || (l.Config.NumberSep != 0 && rune(src[sI]) == l.Config.NumberSep)) {
			sI++
		}
		if sI == expStart {
			// No exponent digits - check if trailing makes it text
			if l.isFollowingText(sI) {
				return nil
			}
			sI = eSI // backtrack, 'e' is not part of number
		}
		// Check for trailing text after exponent
		if l.isFollowingText(sI) {
			return nil
		}
	}

	// Check for trailing alpha/text that would make this text
	if l.isFollowingText(sI) {
		return nil
	}

	msrc := src[start:sI]
	if len(msrc) == 0 || (hasSign && len(msrc) == 1) {
		return nil
	}

	// Check if this matches a value keyword (e.g. if value.def had this string)
	// Not applicable for standard numbers, skip.

	nstr := msrc
	if l.Config.NumberSep != 0 {
		nstr = strings.ReplaceAll(nstr, string(l.Config.NumberSep), "")
	}

	num := parseNumericString(nstr)
	if num != num { // NaN
		return nil
	}

	tkn := l.Token("#NR", TinNR, num, msrc)
	l.pnt.SI = sI
	l.pnt.CI += sI - start
	return tkn
}

// matchText matches unquoted text and checks for value keywords (true, false, null).
// Text is terminated by fixed tokens, whitespace, quotes, and comment starters.
func (l *Lex) matchText() *Token {
	if l.pnt.SI >= l.pnt.Len {
		return nil
	}

	src := l.Src
	sI := l.pnt.SI
	start := sI

	for sI < len(src) {
		ch := rune(src[sI])
		// Stop at: fixed tokens, whitespace, quotes, line chars
		if ch == '{' || ch == '}' || ch == '[' || ch == ']' ||
			ch == ':' || ch == ',' ||
			l.Config.SpaceChars[ch] || l.Config.LineChars[ch] ||
			l.Config.StringChars[ch] {
			break
		}
		// Comment starters
		rest := src[sI:]
		isComment := false
		for _, cs := range l.Config.CommentLine {
			if strings.HasPrefix(rest, cs) {
				isComment = true
				break
			}
		}
		if !isComment {
			for _, cb := range l.Config.CommentBlock {
				if strings.HasPrefix(rest, cb[0]) {
					isComment = true
					break
				}
			}
		}
		if isComment {
			break
		}
		sI++
	}

	if sI == start {
		return nil
	}

	msrc := src[start:sI]
	mlen := len(msrc)

	// Check for value keywords
	switch msrc {
	case "true":
		tkn := l.Token("#VL", TinVL, true, msrc)
		l.pnt.SI += mlen
		l.pnt.CI += mlen
		return tkn
	case "false":
		tkn := l.Token("#VL", TinVL, false, msrc)
		l.pnt.SI += mlen
		l.pnt.CI += mlen
		return tkn
	case "null":
		tkn := l.Token("#VL", TinVL, nil, msrc)
		l.pnt.SI += mlen
		l.pnt.CI += mlen
		return tkn
	case "NaN":
		tkn := l.Token("#VL", TinVL, math.NaN(), msrc)
		l.pnt.SI += mlen
		l.pnt.CI += mlen
		return tkn
	case "Infinity":
		tkn := l.Token("#VL", TinVL, math.Inf(1), msrc)
		l.pnt.SI += mlen
		l.pnt.CI += mlen
		return tkn
	case "-Infinity":
		tkn := l.Token("#VL", TinVL, math.Inf(-1), msrc)
		l.pnt.SI += mlen
		l.pnt.CI += mlen
		return tkn
	}

	// Plain text
	tkn := l.Token("#TX", TinTX, msrc, msrc)
	l.pnt.SI += mlen
	l.pnt.CI += mlen

	// Check if next char is a fixed token - push as lookahead (subMatchFixed)
	if l.pnt.SI < l.pnt.Len {
		nextCh := string(src[l.pnt.SI])
		if tin, ok := FixedTokens[nextCh]; ok {
			fixTkn := l.Token(tinName(tin), tin, nil, nextCh)
			l.pnt.SI++
			l.pnt.CI++
			l.tokens = append(l.tokens, fixTkn)
		}
	}

	return tkn
}

// Helper functions

func tinName(tin Tin) string {
	switch tin {
	case TinOB:
		return "#OB"
	case TinCB:
		return "#CB"
	case TinOS:
		return "#OS"
	case TinCS:
		return "#CS"
	case TinCL:
		return "#CL"
	case TinCA:
		return "#CA"
	default:
		return "#UK"
	}
}

func isDigit(ch byte) bool {
	return ch >= '0' && ch <= '9'
}

func isHexDigitByte(ch byte) bool {
	return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
}

// isTextContinuation returns true if the character can continue a text token
// (i.e., it's not a delimiter).
func isTextContinuation(ch byte) bool {
	r := rune(ch)
	return !unicode.IsSpace(r) && ch != '{' && ch != '}' && ch != '[' && ch != ']' &&
		ch != ':' && ch != ',' && ch != '"' && ch != '\'' && ch != '`'
}

// isFollowingText returns true if the character at pos would continue a text token,
// taking into account comment starters (which are not text continuation).
func (l *Lex) isFollowingText(pos int) bool {
	if pos >= len(l.Src) {
		return false
	}
	if !isTextContinuation(l.Src[pos]) {
		return false
	}
	// Comment starters are not text continuation
	rest := l.Src[pos:]
	for _, cs := range l.Config.CommentLine {
		if strings.HasPrefix(rest, cs) {
			return false
		}
	}
	for _, cb := range l.Config.CommentBlock {
		if strings.HasPrefix(rest, cb[0]) {
			return false
		}
	}
	return true
}

func parseHexInt(s string) int {
	val := 0
	for _, ch := range s {
		val <<= 4
		switch {
		case ch >= '0' && ch <= '9':
			val |= int(ch - '0')
		case ch >= 'a' && ch <= 'f':
			val |= int(ch-'a') + 10
		case ch >= 'A' && ch <= 'F':
			val |= int(ch-'A') + 10
		default:
			return -1
		}
	}
	return val
}

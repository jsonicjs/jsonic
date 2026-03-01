package jsonic

import (
	"math"
	"sort"
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
	Err    error     // First error encountered during lexing
}

// LexConfig holds lexer configuration.
type LexConfig struct {
	// Lex enable/disable flags (matching TS options.*.lex)
	FixedLex   bool // Enable fixed token recognition. Default: true.
	SpaceLex   bool // Enable space lexing. Default: true.
	LineLex    bool // Enable line lexing. Default: true.
	TextLex    bool // Enable text matching. Default: true.
	NumberLex  bool // Enable number matching. Default: true.
	CommentLex bool // Enable comment matching. Default: true.
	StringLex  bool // Enable string matching. Default: true.
	ValueLex   bool // Enable value keyword matching. Default: true.

	StringChars  map[rune]bool // Quote characters
	MultiChars   map[rune]bool // Multiline quote characters
	EscapeChar   rune
	EscapeMap    map[string]string // Custom escape mappings, e.g. {"n": "\n"}.
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

	// Value definitions: keyword → value (e.g. "true" → true)
	// If nil, uses built-in defaults (true, false, null, NaN, Infinity).
	ValueDef map[string]any

	// Map/List options
	MapExtend    bool // Deep-merge duplicate keys. Default: true.
	ListProperty bool // Allow named properties in arrays. Default: true.

	// Safe options
	SafeKey bool // Prevent __proto__ keys. Default: true.

	// Rule options
	FinishRule bool // Auto-close unclosed structures at EOF
	RuleStart  string // Starting rule name. Default: "val".

	// EnderChars lists additional characters that end text and number tokens.
	EnderChars map[rune]bool

	// Per-instance fixed token map (cloned from global FixedTokens).
	// Plugins can add custom fixed tokens here. Supports multi-char keys.
	FixedTokens map[string]Tin

	// FixedSorted is the list of fixed token strings sorted by length (longest first).
	// Rebuilt by SortFixedTokens() after adding custom tokens.
	FixedSorted []string

	// Custom token names: Tin → name for plugin-defined tokens.
	TinNames map[Tin]string

	// Custom lexer matchers added by plugins, sorted by priority.
	CustomMatchers []*MatcherEntry

	// TextInfo wraps string/text output values in Text structs.
	TextInfo bool

	// LexCheck callbacks allow plugins to intercept and override matchers.
	// Each returns nil to continue normal matching, or a LexCheckResult to short-circuit.
	FixedCheck   LexCheck
	SpaceCheck   LexCheck
	LineCheck    LexCheck
	StringCheck  LexCheck
	CommentCheck LexCheck
	NumberCheck  LexCheck
	TextCheck    LexCheck
}

// LexCheck is a function that can intercept a matcher before it runs.
// Return nil to continue normal matching, or a LexCheckResult to override.
type LexCheck func(lex *Lex) *LexCheckResult

// LexCheckResult controls matcher behavior from a LexCheck callback.
type LexCheckResult struct {
	Done  bool   // If true, use Token as the match result (even if nil).
	Token *Token // The token to return (nil means "no match").
}

// DefaultLexConfig returns the default lexer configuration matching jsonic defaults.
func DefaultLexConfig() *LexConfig {
	return &LexConfig{
		FixedLex:     true,
		SpaceLex:     true,
		LineLex:      true,
		TextLex:      true,
		NumberLex:    true,
		CommentLex:   true,
		StringLex:    true,
		ValueLex:     true,

		StringChars:        map[rune]bool{'\'': true, '"': true, '`': true},
		MultiChars:         map[rune]bool{'`': true},
		EscapeChar:         '\\',
		SpaceChars:         map[rune]bool{' ': true, '\t': true},
		LineChars:          map[rune]bool{'\r': true, '\n': true},
		RowChars:           map[rune]bool{'\n': true},
		CommentLine:        []string{"#", "//"},
		CommentBlock:       [][2]string{{"/*", "*/"}},
		NumberHex:          true,
		NumberOct:          true,
		NumberBin:          true,
		NumberSep:          '_',
		AllowUnknownEscape: true,

		MapExtend:    true,
		ListProperty: true,
		SafeKey:      true,

		FinishRule: true,
		RuleStart:  "val",

		FixedTokens: map[string]Tin{
			"{": TinOB, "}": TinCB,
			"[": TinOS, "]": TinCS,
			":": TinCL, ",": TinCA,
		},
		FixedSorted: []string{"{", "}", "[", "]", ":", ","},
	}
}

// SortFixedTokens rebuilds FixedSorted from FixedTokens, sorted by length descending.
// Call this after adding multi-char fixed tokens to ensure longest-match-first behavior.
func (cfg *LexConfig) SortFixedTokens() {
	sorted := make([]string, 0, len(cfg.FixedTokens))
	for k := range cfg.FixedTokens {
		sorted = append(sorted, k)
	}
	sort.Slice(sorted, func(i, j int) bool {
		if len(sorted[i]) != len(sorted[j]) {
			return len(sorted[i]) > len(sorted[j]) // longer first
		}
		return sorted[i] < sorted[j] // stable tie-break
	})
	cfg.FixedSorted = sorted
}

// NewLex creates a new lexer for the given source.
func NewLex(src string, cfg *LexConfig) *Lex {
	return &Lex{
		Src:    src,
		pnt:    Point{Len: len(src), SI: 0, RI: 1, CI: 1},
		Config: cfg,
	}
}

// Cursor returns a pointer to the lexer's current position.
// Custom matchers use this to read and advance the position.
func (l *Lex) Cursor() *Point {
	return &l.pnt
}

// Token creates a new token at the current point.
func (l *Lex) Token(name string, tin Tin, val any, src string) *Token {
	return MakeToken(name, tin, val, src, l.pnt)
}

// Next returns the next non-IGNORE token.
// On error (unterminated string, unterminated comment, unexpected character),
// the error is stored in l.Err and a ZZ (end) token is returned to allow
// the parser to wind down gracefully.
func (l *Lex) Next() *Token {
	for {
		// If an error has already occurred, return end-of-source to stop parsing
		if l.Err != nil {
			return &Token{Name: "#ZZ", Tin: TinZZ, Val: Undefined, SI: l.pnt.SI, RI: l.pnt.RI, CI: l.pnt.CI}
		}

		tkn := l.nextRaw()
		if tkn == nil {
			src := ""
			if l.pnt.SI < len(l.Src) {
				src = string(l.Src[l.pnt.SI])
			}
			l.Err = makeJsonicError("unexpected", src, l.Src, l.pnt.SI, l.pnt.RI, l.pnt.CI)
			return &Token{Name: "#ZZ", Tin: TinZZ, Val: Undefined, SI: l.pnt.SI, RI: l.pnt.RI, CI: l.pnt.CI}
		}
		// Bad token → store error and return end-of-source
		if tkn.Tin == TinBD {
			l.Err = makeJsonicError(tkn.Why, tkn.Src, l.Src, tkn.SI, tkn.RI, tkn.CI)
			return &Token{Name: "#ZZ", Tin: TinZZ, Val: Undefined, SI: tkn.SI, RI: tkn.RI, CI: tkn.CI}
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

	// Try matchers in order (matching TS lex.match ordering):
	// custom(<2e6), fixed(2e6), space(3e6), line(4e6), string(5e6), comment(6e6), number(7e6), text(8e6)

	// Run custom matchers with priority < 2000000 (before fixed).
	for _, m := range l.Config.CustomMatchers {
		if m.Priority >= 2000000 {
			break
		}
		if tkn := m.Match(l); tkn != nil {
			return tkn
		}
	}

	if l.Config.FixedLex {
		if l.Config.FixedCheck != nil {
			if cr := l.Config.FixedCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchFixed(); tkn != nil { return tkn }
		} else if tkn := l.matchFixed(); tkn != nil { return tkn }
	}
	if l.Config.SpaceLex {
		if l.Config.SpaceCheck != nil {
			if cr := l.Config.SpaceCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchSpace(); tkn != nil { return tkn }
		} else if tkn := l.matchSpace(); tkn != nil { return tkn }
	}
	if l.Config.LineLex {
		if l.Config.LineCheck != nil {
			if cr := l.Config.LineCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchLine(); tkn != nil { return tkn }
		} else if tkn := l.matchLine(); tkn != nil { return tkn }
	}
	if l.Config.StringLex {
		if l.Config.StringCheck != nil {
			if cr := l.Config.StringCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchString(); tkn != nil { return tkn }
		} else if tkn := l.matchString(); tkn != nil { return tkn }
	}
	if l.Config.CommentLex {
		if l.Config.CommentCheck != nil {
			if cr := l.Config.CommentCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchComment(); tkn != nil { return tkn }
		} else if tkn := l.matchComment(); tkn != nil { return tkn }
	}
	if l.Config.NumberLex {
		if l.Config.NumberCheck != nil {
			if cr := l.Config.NumberCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchNumber(); tkn != nil { return tkn }
		} else if tkn := l.matchNumber(); tkn != nil { return tkn }
	}
	if l.Config.TextLex {
		if l.Config.TextCheck != nil {
			if cr := l.Config.TextCheck(l); cr != nil && cr.Done {
				if cr.Token != nil { return cr.Token }
			} else if tkn := l.matchText(); tkn != nil { return tkn }
		} else if tkn := l.matchText(); tkn != nil { return tkn }
	}

	// Run custom matchers with priority >= 8000000 (after text).
	for _, m := range l.Config.CustomMatchers {
		if m.Priority < 8000000 {
			continue
		}
		if tkn := m.Match(l); tkn != nil {
			return tkn
		}
	}

	// No matcher matched
	return nil
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

// matchFixed matches fixed tokens, including multi-character tokens.
// Tokens are tried longest-first to ensure greedy matching (e.g. "=>" before "=").
func (l *Lex) matchFixed() *Token {
	if l.pnt.SI >= l.pnt.Len {
		return nil
	}
	ftoks := l.Config.FixedTokens
	if ftoks == nil {
		ftoks = FixedTokens
	}
	remaining := l.Src[l.pnt.SI:]

	// Use sorted list for longest-match-first. Fall back to single-char lookup
	// if no sorted list (e.g. standalone lexer without Jsonic).
	if len(l.Config.FixedSorted) > 0 {
		for _, fs := range l.Config.FixedSorted {
			if strings.HasPrefix(remaining, fs) {
				tin := ftoks[fs]
				tkn := l.Token(l.tinNameFor(tin), tin, nil, fs)
				l.pnt.SI += len(fs)
				l.pnt.CI += len(fs)
				return tkn
			}
		}
		return nil
	}

	// Fallback: single-char lookup.
	src := string(l.Src[l.pnt.SI])
	tin, ok := ftoks[src]
	if !ok {
		return nil
	}
	tkn := l.Token(l.tinNameFor(tin), tin, nil, src)
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

			// Check custom escape map first.
			if l.Config.EscapeMap != nil {
				if rep, ok := l.Config.EscapeMap[string(esc)]; ok {
					sb.WriteString(rep)
					sI++
					continue
				}
			}

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
		// Stop at: whitespace, quotes, line chars, ender chars
		if l.Config.SpaceChars[ch] || l.Config.LineChars[ch] ||
			l.Config.StringChars[ch] || l.Config.EnderChars[ch] {
			break
		}
		// Stop at fixed tokens (check multi-char first, then single-char)
		rest := src[sI:]
		isFixed := false
		for _, fs := range l.Config.FixedSorted {
			if strings.HasPrefix(rest, fs) {
				isFixed = true
				break
			}
		}
		if !isFixed && len(l.Config.FixedSorted) == 0 {
			// Fallback for standalone lexer without sorted list
			if ch == '{' || ch == '}' || ch == '[' || ch == ']' ||
				ch == ':' || ch == ',' {
				isFixed = true
			}
		}
		if isFixed {
			break
		}
		// Comment starters
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
	if l.Config.ValueLex {
		if l.Config.ValueDef != nil {
			// Custom value definitions
			if val, ok := l.Config.ValueDef[msrc]; ok {
				tkn := l.Token("#VL", TinVL, val, msrc)
				l.pnt.SI += mlen
				l.pnt.CI += mlen
				return tkn
			}
		} else {
			// Default value keywords
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
		}
	}

	// Plain text
	tkn := l.Token("#TX", TinTX, msrc, msrc)
	l.pnt.SI += mlen
	l.pnt.CI += mlen

	// Check if next chars are a fixed token - push as lookahead (subMatchFixed)
	if l.pnt.SI < l.pnt.Len {
		remaining := src[l.pnt.SI:]
		matched := false
		for _, fs := range l.Config.FixedSorted {
			if strings.HasPrefix(remaining, fs) {
				ftoks := l.Config.FixedTokens
				if ftoks == nil {
					ftoks = FixedTokens
				}
				tin := ftoks[fs]
				fixTkn := l.Token(l.tinNameFor(tin), tin, nil, fs)
				l.pnt.SI += len(fs)
				l.pnt.CI += len(fs)
				l.tokens = append(l.tokens, fixTkn)
				matched = true
				break
			}
		}
		if !matched && len(l.Config.FixedSorted) == 0 {
			// Fallback for standalone lexer
			nextCh := string(src[l.pnt.SI])
			ftoks := l.Config.FixedTokens
			if ftoks == nil {
				ftoks = FixedTokens
			}
			if tin, ok := ftoks[nextCh]; ok {
				fixTkn := l.Token(l.tinNameFor(tin), tin, nil, nextCh)
				l.pnt.SI++
				l.pnt.CI++
				l.tokens = append(l.tokens, fixTkn)
			}
		}
	}

	return tkn
}

// Helper functions

// tinNameFor returns the name for a Tin, checking custom names first.
func (l *Lex) tinNameFor(tin Tin) string {
	if l.Config.TinNames != nil {
		if name, ok := l.Config.TinNames[tin]; ok {
			return name
		}
	}
	return tinName(tin)
}

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

// isTextChar returns true if the character can continue a text token,
// checking against the config's fixed tokens, ender chars, and string chars.
func (l *Lex) isTextChar(pos int) bool {
	if pos >= len(l.Src) {
		return false
	}
	ch := l.Src[pos]
	r := rune(ch)
	if unicode.IsSpace(r) {
		return false
	}
	// Check string chars
	if l.Config.StringChars[r] {
		return false
	}
	// Check ender chars
	if l.Config.EnderChars[r] {
		return false
	}
	// Check fixed tokens (multi-char: check if any fixed token starts here)
	rest := l.Src[pos:]
	for _, fs := range l.Config.FixedSorted {
		if strings.HasPrefix(rest, fs) {
			return false
		}
	}
	// Fallback for standalone lexer without sorted list
	if len(l.Config.FixedSorted) == 0 {
		if ch == '{' || ch == '}' || ch == '[' || ch == ']' ||
			ch == ':' || ch == ',' {
			return false
		}
	}
	return true
}

// isFollowingText returns true if the character at pos would continue a text token,
// taking into account fixed tokens, ender chars, and comment starters.
func (l *Lex) isFollowingText(pos int) bool {
	if !l.isTextChar(pos) {
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

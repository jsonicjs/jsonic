package jsonic

import (
	"math"
	"strconv"
	"strings"
)

// Context holds the parse state.
type Context struct {
	UI  int               // Unique rule ID counter
	T0  *Token            // First lookahead token
	T1  *Token            // Second lookahead token
	V1  *Token            // Previous token 1
	V2  *Token            // Previous token 2
	RS  []*Rule           // Rule stack
	RSI int               // Rule stack index
	RSM map[string]*RuleSpec // Rule spec map
	KI  int               // Iteration counter
}

// Parser orchestrates the parsing process.
type Parser struct {
	Config *LexConfig
	RSM    map[string]*RuleSpec
}

// NewParser creates a parser with default configuration.
func NewParser() *Parser {
	cfg := DefaultLexConfig()
	rsm := make(map[string]*RuleSpec)
	Grammar(rsm, cfg)
	return &Parser{Config: cfg, RSM: rsm}
}

// Start parses the source string and returns the result.
func (p *Parser) Start(src string) any {
	if src == "" {
		return nil
	}

	// Check if all whitespace
	allWS := true
	for _, ch := range src {
		if ch != ' ' && ch != '\t' && ch != '\n' && ch != '\r' {
			allWS = false
			break
		}
	}
	if allWS {
		return nil
	}

	lex := NewLex(src, p.Config)

	ctx := &Context{
		UI:  0,
		T0:  NoToken,
		T1:  NoToken,
		V1:  NoToken,
		V2:  NoToken,
		RS:  make([]*Rule, len(src)*4+100),
		RSI: 0,
		RSM: p.RSM,
	}

	startSpec := p.RSM["val"]
	if startSpec == nil {
		return nil
	}

	rule := MakeRule(startSpec, ctx, nil)
	root := rule

	// Maximum iterations: 2 * numRules * srcLen * 2 * maxmul(3)
	maxr := 2 * len(p.RSM) * len(src) * 2 * 3
	if maxr < 100 {
		maxr = 100
	}

	kI := 0
	for rule != NoRule && kI < maxr {
		ctx.KI = kI
		rule = rule.Process(ctx, lex)
		kI++
	}

	// Check for unconsumed tokens (syntax error)
	if ctx.T0 != nil && !ctx.T0.IsNoToken() && ctx.T0.Tin != TinZZ {
		panic("jsonic: unexpected '" + ctx.T0.Src + "'")
	}

	// Follow replacement chain: when val is replaced by list (implicit list),
	// root.Node is stale. Follow Next/Prev links to find the actual result.
	result := root
	for result.Next != NoRule && result.Next != nil && result.Next.Prev == result {
		result = result.Next
	}

	if IsUndefined(result.Node) {
		return nil
	}
	return result.Node
}

// parseNumericString converts a numeric string to float64.
// Handles standard decimals, hex (0x), octal (0o), binary (0b), and signs.
func parseNumericString(s string) float64 {
	if len(s) == 0 {
		return math.NaN()
	}

	// Handle sign prefix for special formats
	sign := 1.0
	ns := s
	if ns[0] == '-' {
		sign = -1.0
		ns = ns[1:]
	} else if ns[0] == '+' {
		sign = 1.0
		ns = ns[1:]
	}

	if len(ns) >= 2 {
		switch {
		case ns[0] == '0' && (ns[1] == 'x' || ns[1] == 'X'):
			val, err := strconv.ParseInt(ns[2:], 16, 64)
			if err != nil {
				return math.NaN()
			}
			return sign * float64(val)
		case ns[0] == '0' && (ns[1] == 'o' || ns[1] == 'O'):
			val, err := strconv.ParseInt(ns[2:], 8, 64)
			if err != nil {
				return math.NaN()
			}
			return sign * float64(val)
		case ns[0] == '0' && (ns[1] == 'b' || ns[1] == 'B'):
			val, err := strconv.ParseInt(ns[2:], 2, 64)
			if err != nil {
				return math.NaN()
			}
			return sign * float64(val)
		}
	}

	// Remove underscores if present
	ns = strings.ReplaceAll(s, "_", "")

	val, err := strconv.ParseFloat(ns, 64)
	if err != nil {
		return math.NaN()
	}

	// Normalize -0 to 0
	if val == 0 {
		return 0
	}

	return val
}

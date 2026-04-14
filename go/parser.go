package jsonic

import (
	"math"
	"strconv"
	"strings"
)

// Context holds the parse state, matching the TypeScript Context type.
type Context struct {
	UI       int               // Unique rule ID counter (TS: uI)
	T0       *Token            // Current token (TS: t0)
	T1       *Token            // Next token / lookahead (TS: t1)
	V1       *Token            // Previous token (TS: v1)
	V2       *Token            // Previous previous token (TS: v2)
	RS       []*Rule           // Rule stack (TS: rs)
	RSI      int               // Rule stack index (TS: rsI)
	RSM      map[string]*RuleSpec // Rule spec map (TS: rsm)
	KI       int               // Iteration counter (TS: kI)
	Rule     *Rule             // Current parsing rule (TS: rule)
	Meta     map[string]any    // Parse metadata (TS: meta)
	LexSubs  []LexSub          // Lex event subscribers (TS: sub.lex)
	RuleSubs []RuleSub         // Rule event subscribers (TS: sub.rule)
	ParseErr *Token            // Error token, halts parse

	// Fields matching TS Context:
	Opts     *Options          // Jsonic instance options (TS: opts)
	Cfg      *LexConfig        // Jsonic instance config (TS: cfg)
	Src      string            // Source text being parsed (TS: src)
	Inst     *Jsonic           // Current Jsonic instance (TS: inst)
	U        map[string]any    // Custom plugin data bag (TS: u)
	Root     *Rule             // Root rule (TS: root)
	TC       int               // Token count (TS: tC)
	F        func(any) string  // Format value as string (TS: F)
	Log      func(...any)      // Debug logger (TS: log)
	NOTOKEN  *Token            // Sentinel no-token (TS: NOTOKEN)
	NORULE   *Rule             // Sentinel no-rule (TS: NORULE)
}

// Parser orchestrates the parsing process.
type Parser struct {
	Config        *LexConfig
	RSM           map[string]*RuleSpec
	MaxMul        int               // Max rule occurrence multiplier. Default: 3.
	ErrorMessages map[string]string  // Custom error message templates.
	Hints         map[string]string  // Explanatory hints per error code.
	ErrTag        string             // Custom error tag (TS: errmsg.name). Default: "jsonic".
}

// NewParser creates a parser with default configuration.
func NewParser() *Parser {
	cfg := DefaultLexConfig()
	rsm := make(map[string]*RuleSpec)
	buildGrammar(rsm, cfg)
	// Copy global error messages as defaults.
	msgs := make(map[string]string, len(errorMessages))
	for k, v := range errorMessages {
		msgs[k] = v
	}
	return &Parser{Config: cfg, RSM: rsm, MaxMul: 3, ErrorMessages: msgs}
}

// Start parses the source string and returns the result.
// Returns a *JsonicError if parsing fails.
func (p *Parser) Start(src string) (any, error) {
	return p.startParse(src, nil, nil, nil, nil)
}

// StartMeta parses the source string with metadata, subscriptions, and
// an optional Jsonic instance reference (for Context.Inst).
func (p *Parser) StartMeta(src string, meta map[string]any, lexSubs []LexSub, ruleSubs []RuleSub) (any, error) {
	return p.startParse(src, meta, lexSubs, ruleSubs, nil)
}

// startParse is the internal entry point that populates the full Context.
func (p *Parser) startParse(src string, meta map[string]any, lexSubs []LexSub, ruleSubs []RuleSub, inst *Jsonic) (any, error) {
	if src == "" {
		return nil, nil
	}

	lex := NewLex(src, p.Config)

	var opts *Options
	if inst != nil {
		opts = inst.options
	}

	ctx := &Context{
		UI:       0,
		T0:       NoToken,
		T1:       NoToken,
		V1:       NoToken,
		V2:       NoToken,
		RS:       make([]*Rule, len(src)*4+100),
		RSI:      0,
		RSM:      p.RSM,
		Meta:     meta,
		LexSubs:  lexSubs,
		RuleSubs: ruleSubs,
		Opts:     opts,
		Cfg:      p.Config,
		Src:      src,
		Inst:     inst,
		U:        make(map[string]any),
		TC:       0,
		NOTOKEN:  NoToken,
		NORULE:   NoRule,
		F:        func(v any) string { return Str(v, 44) },
	}

	lex.Ctx = ctx

	startName := p.Config.RuleStart
	if startName == "" {
		startName = "val"
	}
	startSpec := p.RSM[startName]
	if startSpec == nil {
		return nil, nil
	}

	rule := MakeRule(startSpec, ctx, nil)
	root := rule
	ctx.Root = root

	// Run parse.prepare hooks
	if len(p.Config.ParsePrepare) > 0 {
		for _, prep := range p.Config.ParsePrepare {
			prep(ctx)
		}
	}

	// Maximum iterations: 2 * numRules * srcLen * 2 * maxmul
	maxmul := p.MaxMul
	if maxmul <= 0 {
		maxmul = 3
	}
	maxr := 2 * len(p.RSM) * len(src) * 2 * maxmul
	if maxr < 100 {
		maxr = 100
	}

	kI := 0
	for rule != NoRule && kI < maxr {
		ctx.KI = kI
		ctx.Rule = rule

		// Fire rule subscribers BEFORE process (matching TS).
		if len(ctx.RuleSubs) > 0 {
			for _, sub := range ctx.RuleSubs {
				sub(rule, ctx)
			}
		}

		rule = rule.Process(ctx, lex)

		// Check for parse error from alt.E or actions.
		if ctx.ParseErr != nil {
			// Prefer lexer errors (e.g. unterminated_string) over generic
			// "unexpected" from alt matching, since the lex error is more
			// specific about what went wrong. Matches TS behavior where
			// lex errors propagate through #ZZ tokens.
			if lex.Err != nil {
				return nil, lex.Err
			}
			tkn := ctx.ParseErr
			return nil, p.makeError("unexpected", tkn.Src, src, tkn.SI, tkn.RI, tkn.CI)
		}

		kI++
	}

	// Check for lexer errors (unterminated strings, comments, etc.)
	if lex.Err != nil {
		return nil, lex.Err
	}

	// Check for unconsumed tokens (syntax error) - explicit trailing content check.
	// First check tokens already in the lookahead buffer.
	if ctx.T0 != nil && !ctx.T0.IsNoToken() && ctx.T0.Tin != TinZZ {
		return nil, p.makeError("unexpected", ctx.T0.Src, src, ctx.T0.SI, ctx.T0.RI, ctx.T0.CI)
	}
	// Also explicitly ask lexer for more (matching TS parser.ts:187-189).
	endTkn := lex.Next(rule)
	if endTkn.Tin != TinZZ {
		return nil, p.makeError("unexpected", endTkn.Src, src, endTkn.SI, endTkn.RI, endTkn.CI)
	}
	// Check lexer errors from that final Next() call.
	if lex.Err != nil {
		return nil, lex.Err
	}

	// Follow replacement chain: when val is replaced by list (implicit list),
	// root.Node is stale. Follow Next/Prev links to find the actual result.
	result := root
	for result.Next != NoRule && result.Next != nil && result.Next.Prev == result {
		result = result.Next
	}

	if IsUndefined(result.Node) {
		return nil, nil
	}

	// Check result.fail
	if len(p.Config.ResultFail) > 0 {
		for _, fail := range p.Config.ResultFail {
			if result.Node == fail {
				return nil, p.makeError("unexpected", "", src, 0, 1, 1)
			}
		}
	}

	return result.Node, nil
}

// makeError creates a JsonicError using this parser's error messages.
func (p *Parser) makeError(code, src, fullSource string, pos, row, col int) *JsonicError {
	msgs := p.ErrorMessages
	if msgs == nil {
		msgs = errorMessages
	}
	tmpl, ok := msgs[code]
	if !ok {
		tmpl = msgs["unknown"]
		if tmpl == "" {
			tmpl = errorMessages["unknown"]
		}
	}
	detail := tmpl + src

	hint := ""
	if p.Hints != nil {
		hint = p.Hints[code]
	}

	return &JsonicError{
		Code:       code,
		Detail:     detail,
		Pos:        pos,
		Row:        row,
		Col:        col,
		Src:        src,
		Hint:       hint,
		fullSource: fullSource,
		tag:        p.ErrTag,
	}
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

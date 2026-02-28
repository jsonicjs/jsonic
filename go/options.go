package jsonic

// Options configures a Jsonic parser instance.
// All fields use pointer types so that nil means "use default".
// This matches the TypeScript pattern where unset options fall back to defaults.
type Options struct {
	// Safe controls prototype-pollution-style key safety.
	Safe *SafeOptions

	// Fixed controls fixed token recognition ({, }, [, ], :, ,).
	Fixed *FixedOptions

	// Space controls space/tab lexing.
	Space *SpaceOptions

	// Line controls line-ending lexing.
	Line *LineOptions

	// Text controls unquoted text lexing.
	Text *TextOptions

	// Number controls numeric literal lexing.
	Number *NumberOptions

	// Comment controls comment lexing.
	Comment *CommentOptions

	// String controls quoted string lexing.
	String *StringOptions

	// Map controls object/map merging behavior.
	Map *MapOptions

	// List controls array/list behavior.
	List *ListOptions

	// Value controls keyword literal matching (true, false, null, etc.).
	Value *ValueOptions

	// Ender lists additional characters that end text tokens.
	Ender []string

	// Rule controls parser rule behavior.
	Rule *RuleOptions

	// Error provides custom error message templates keyed by error code.
	// e.g. {"unexpected": "unexpected character(s): {src}"}
	Error map[string]string

	// Tag is an instance identifier tag.
	Tag string
}

// SafeOptions controls key safety.
type SafeOptions struct {
	Key *bool // Prevent __proto__ keys. Default: true.
}

// FixedOptions controls fixed token recognition.
type FixedOptions struct {
	Lex *bool // Enable fixed tokens. Default: true.
}

// SpaceOptions controls space lexing.
type SpaceOptions struct {
	Lex   *bool  // Enable space lexing. Default: true.
	Chars string // Space characters. Default: " \t".
}

// LineOptions controls line-ending lexing.
type LineOptions struct {
	Lex      *bool  // Enable line lexing. Default: true.
	Chars    string // Line characters. Default: "\r\n".
	RowChars string // Row-counting characters. Default: "\n".
}

// TextOptions controls unquoted text lexing.
type TextOptions struct {
	Lex *bool // Enable text matching. Default: true.
}

// NumberOptions controls numeric literal lexing.
type NumberOptions struct {
	Lex *bool   // Enable number matching. Default: true.
	Hex *bool   // Support 0x hex format. Default: true.
	Oct *bool   // Support 0o octal format. Default: true.
	Bin *bool   // Support 0b binary format. Default: true.
	Sep string  // Number separator character. Default: "_". Empty string disables.
}

// CommentDef defines a single comment type.
type CommentDef struct {
	Line    bool   // true = line comment, false = block comment.
	Start   string // Start marker, e.g. "#", "//", "/*".
	End     string // End marker for block comments, e.g. "*/".
	Lex     *bool  // Enable this comment type. Default: true.
}

// CommentOptions controls comment lexing.
type CommentOptions struct {
	Lex *bool                  // Enable all comment lexing. Default: true.
	Def map[string]*CommentDef // Comment type definitions.
}

// StringOptions controls quoted string lexing.
type StringOptions struct {
	Lex          *bool             // Enable string matching. Default: true.
	Chars        string            // Quote characters. Default: `'"` + "`".
	MultiChars   string            // Multiline quote characters. Default: "`".
	EscapeChar   string            // Escape character. Default: "\\".
	Escape       map[string]string // Escape mappings, e.g. {"n": "\n"}.
	AllowUnknown *bool             // Allow unknown escapes. Default: true.
}

// MapOptions controls object/map behavior.
type MapOptions struct {
	Extend *bool // Deep-merge duplicate keys. Default: true.
}

// ListOptions controls array/list behavior.
type ListOptions struct {
	Property *bool // Allow named properties in arrays [a:1]. Default: true.
}

// ValueDef defines a keyword value.
type ValueDef struct {
	Val any // Value to produce for this keyword.
}

// ValueOptions controls keyword value matching.
type ValueOptions struct {
	Lex *bool                // Enable value matching. Default: true.
	Def map[string]*ValueDef // Keyword definitions, e.g. {"true": {Val: true}}.
}

// RuleOptions controls parser rule behavior.
type RuleOptions struct {
	Start  string // Starting rule name. Default: "val".
	Finish *bool  // Auto-close unclosed structures at EOF. Default: true.
	MaxMul *int   // Max rule occurrence multiplier. Default: 3.
}

// Jsonic is a configured parser instance, equivalent to TypeScript's Jsonic.make().
type Jsonic struct {
	options   *Options
	parser    *Parser
	plugins   []pluginEntry      // Registered plugins
	tinByName map[string]Tin     // Custom token name → Tin
	nameByTin map[Tin]string     // Custom Tin → token name
	nextTin   Tin                // Next available Tin for allocation
}

// Make creates a new Jsonic parser instance with the given options.
// Unset option fields fall back to defaults, matching TypeScript Jsonic.make().
func Make(opts ...Options) *Jsonic {
	var o Options
	if len(opts) > 0 {
		o = opts[0]
	}

	cfg := buildConfig(&o)
	rsm := make(map[string]*RuleSpec)
	Grammar(rsm, cfg)

	maxmul := 3
	if o.Rule != nil && o.Rule.MaxMul != nil {
		maxmul = *o.Rule.MaxMul
	}

	// Copy global FixedTokens into the config for per-instance customization.
	cfg.FixedTokens = make(map[string]Tin, len(FixedTokens))
	for k, v := range FixedTokens {
		cfg.FixedTokens[k] = v
	}

	// Copy global error messages as defaults.
	msgs := make(map[string]string, len(errorMessages))
	for k, v := range errorMessages {
		msgs[k] = v
	}

	p := &Parser{Config: cfg, RSM: rsm, MaxMul: maxmul, ErrorMessages: msgs}

	// Initialize built-in token name mappings.
	tinByName := map[string]Tin{
		"#BD": TinBD, "#ZZ": TinZZ, "#UK": TinUK, "#AA": TinAA,
		"#SP": TinSP, "#LN": TinLN, "#CM": TinCM, "#NR": TinNR,
		"#ST": TinST, "#TX": TinTX, "#VL": TinVL, "#OB": TinOB,
		"#CB": TinCB, "#OS": TinOS, "#CS": TinCS, "#CL": TinCL,
		"#CA": TinCA,
	}
	nameByTin := make(map[Tin]string, len(tinByName))
	for name, tin := range tinByName {
		nameByTin[tin] = name
	}

	j := &Jsonic{
		options:   &o,
		parser:    p,
		tinByName: tinByName,
		nameByTin: nameByTin,
		nextTin:   TinMAX,
	}

	// Apply custom error messages.
	if o.Error != nil {
		for k, v := range o.Error {
			j.parser.ErrorMessages[k] = v
		}
	}

	return j
}

// Parse parses a jsonic string using this instance's configuration.
func (j *Jsonic) Parse(src string) (any, error) {
	return j.parser.Start(src)
}

// Options returns a copy of this instance's options.
func (j *Jsonic) Options() Options {
	if j.options != nil {
		return *j.options
	}
	return Options{}
}

// boolPtr is a helper to create a *bool.
func boolPtr(b bool) *bool {
	return &b
}

// intPtr is a helper to create a *int.
func intPtr(i int) *int {
	return &i
}

// boolVal returns the value of a *bool, or the default if nil.
func boolVal(p *bool, def bool) bool {
	if p != nil {
		return *p
	}
	return def
}

// buildConfig converts Options into a LexConfig, applying defaults for unset fields.
func buildConfig(o *Options) *LexConfig {
	cfg := &LexConfig{}

	// Fixed tokens
	cfg.FixedLex = boolVal(optBool(o.Fixed, func(f *FixedOptions) *bool { return f.Lex }), true)

	// Space
	cfg.SpaceLex = boolVal(optBool(o.Space, func(s *SpaceOptions) *bool { return s.Lex }), true)
	if o.Space != nil && o.Space.Chars != "" {
		cfg.SpaceChars = runeSet(o.Space.Chars)
	} else {
		cfg.SpaceChars = map[rune]bool{' ': true, '\t': true}
	}

	// Line
	cfg.LineLex = boolVal(optBool(o.Line, func(l *LineOptions) *bool { return l.Lex }), true)
	if o.Line != nil && o.Line.Chars != "" {
		cfg.LineChars = runeSet(o.Line.Chars)
	} else {
		cfg.LineChars = map[rune]bool{'\r': true, '\n': true}
	}
	if o.Line != nil && o.Line.RowChars != "" {
		cfg.RowChars = runeSet(o.Line.RowChars)
	} else {
		cfg.RowChars = map[rune]bool{'\n': true}
	}

	// Text
	cfg.TextLex = boolVal(optBool(o.Text, func(t *TextOptions) *bool { return t.Lex }), true)

	// Number
	cfg.NumberLex = boolVal(optBool(o.Number, func(n *NumberOptions) *bool { return n.Lex }), true)
	cfg.NumberHex = boolVal(optBool(o.Number, func(n *NumberOptions) *bool { return n.Hex }), true)
	cfg.NumberOct = boolVal(optBool(o.Number, func(n *NumberOptions) *bool { return n.Oct }), true)
	cfg.NumberBin = boolVal(optBool(o.Number, func(n *NumberOptions) *bool { return n.Bin }), true)
	if o.Number != nil && o.Number.Sep != "" {
		cfg.NumberSep = rune(o.Number.Sep[0])
	} else if o.Number != nil && o.Number.Sep == "" && o.Number.Lex != nil {
		// Explicitly set to empty: disable separator
		cfg.NumberSep = 0
	} else {
		cfg.NumberSep = '_'
	}

	// Comment
	cfg.CommentLex = boolVal(optBool(o.Comment, func(c *CommentOptions) *bool { return c.Lex }), true)
	if o.Comment != nil && o.Comment.Def != nil {
		cfg.CommentLine = nil
		cfg.CommentBlock = nil
		for _, def := range o.Comment.Def {
			if def == nil || !boolVal(def.Lex, true) {
				continue
			}
			if def.Line {
				cfg.CommentLine = append(cfg.CommentLine, def.Start)
			} else {
				cfg.CommentBlock = append(cfg.CommentBlock, [2]string{def.Start, def.End})
			}
		}
	} else {
		cfg.CommentLine = []string{"#", "//"}
		cfg.CommentBlock = [][2]string{{"/*", "*/"}}
	}

	// String
	cfg.StringLex = boolVal(optBool(o.String, func(s *StringOptions) *bool { return s.Lex }), true)
	if o.String != nil && o.String.Chars != "" {
		cfg.StringChars = runeSet(o.String.Chars)
	} else {
		cfg.StringChars = map[rune]bool{'\'': true, '"': true, '`': true}
	}
	if o.String != nil && o.String.MultiChars != "" {
		cfg.MultiChars = runeSet(o.String.MultiChars)
	} else {
		cfg.MultiChars = map[rune]bool{'`': true}
	}
	if o.String != nil && o.String.EscapeChar != "" {
		cfg.EscapeChar = rune(o.String.EscapeChar[0])
	} else {
		cfg.EscapeChar = '\\'
	}
	cfg.AllowUnknownEscape = boolVal(optBool(o.String, func(s *StringOptions) *bool { return s.AllowUnknown }), true)

	// Value
	cfg.ValueLex = boolVal(optBool(o.Value, func(v *ValueOptions) *bool { return v.Lex }), true)
	if o.Value != nil && o.Value.Def != nil {
		cfg.ValueDef = make(map[string]any)
		for k, v := range o.Value.Def {
			if v != nil {
				cfg.ValueDef[k] = v.Val
			}
		}
	}

	// Map
	cfg.MapExtend = boolVal(optBool(o.Map, func(m *MapOptions) *bool { return m.Extend }), true)

	// List
	cfg.ListProperty = boolVal(optBool(o.List, func(l *ListOptions) *bool { return l.Property }), true)

	// Rule
	cfg.FinishRule = boolVal(optBool(o.Rule, func(r *RuleOptions) *bool { return r.Finish }), true)
	if o.Rule != nil && o.Rule.Start != "" {
		cfg.RuleStart = o.Rule.Start
	} else {
		cfg.RuleStart = "val"
	}

	// Safe
	cfg.SafeKey = boolVal(optBool(o.Safe, func(s *SafeOptions) *bool { return s.Key }), true)

	return cfg
}

// optBool extracts a *bool from an optional sub-options struct.
func optBool[T any](outer *T, getter func(*T) *bool) *bool {
	if outer == nil {
		return nil
	}
	return getter(outer)
}

// runeSet converts a string into a rune presence map.
func runeSet(s string) map[rune]bool {
	m := make(map[rune]bool, len(s))
	for _, r := range s {
		m[r] = true
	}
	return m
}

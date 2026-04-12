package jsonic

import (
	"sort"
	"strings"
)

// Plugin is a function that modifies a Jsonic instance.
// Plugins can add custom tokens, matchers, and rule modifications.
// Matching the TypeScript pattern: (jsonic, plugin_options?) => void
type Plugin func(j *Jsonic, opts map[string]any)

// LexMatcher is a custom lexer matcher function.
// It receives the lexer and the current parsing rule, and returns a Token
// if matched, or nil to pass. The rule parameter allows context-sensitive
// lexing (e.g. checking lex.Ctx.Rule, rule.K, rule.U, rule.N, or rule.State).
// The matcher can read the current position via lex.Cursor() and must
// advance the cursor if it produces a token.
type LexMatcher func(lex *Lex, rule *Rule) *Token

// MakeLexMatcher is a factory function that creates a LexMatcher.
// It receives the lexer config and parser options, matching the TypeScript
// pattern: (cfg: Config, opts: Options) => (lex: Lex) => Token | undefined.
type MakeLexMatcher func(cfg *LexConfig, opts *Options) LexMatcher

// MatchSpec defines a custom matcher to be registered via options.
// This matches the TypeScript pattern: { order: number, make: MakeLexMatcher }.
type MatchSpec struct {
	Order int            // Priority order (lower runs first)
	Make  MakeLexMatcher // Factory function that creates the matcher
}

// MatcherEntry holds a named custom matcher with a priority for ordering.
// Lower priority numbers run first. Built-in matchers use:
// fixed=2e6, space=3e6, line=4e6, string=5e6, comment=6e6, number=7e6, text=8e6.
// Custom matchers at priority < 2e6 run before all built-ins (matching TS behavior).
type MatcherEntry struct {
	Name     string
	Priority int
	Match    LexMatcher
}

// RuleDefiner is a callback that modifies a RuleSpec.
// Plugins use this to add alternates, actions, or conditions to grammar rules.
type RuleDefiner func(rs *RuleSpec)

// LexSub is a subscriber callback invoked after each token is lexed.
type LexSub func(tkn *Token, rule *Rule, ctx *Context)

// RuleSub is a subscriber callback invoked after each rule step.
type RuleSub func(rule *Rule, ctx *Context)

// pluginEntry stores a registered plugin and its options.
type pluginEntry struct {
	plugin Plugin
	opts   map[string]any
}

// Use registers and invokes a plugin on this Jsonic instance.
// The plugin function is called with the Jsonic instance and optional options.
// Returns the Jsonic instance for chaining.
//
// Example:
//
//	j := jsonic.Make()
//	j.Use(myPlugin, map[string]any{"key": "value"})
func (j *Jsonic) Use(plugin Plugin, opts ...map[string]any) *Jsonic {
	var pluginOpts map[string]any
	if len(opts) > 0 && opts[0] != nil {
		pluginOpts = opts[0]
	}

	j.plugins = append(j.plugins, pluginEntry{plugin: plugin, opts: pluginOpts})
	plugin(j, pluginOpts)
	return j
}

// Rule modifies or creates a grammar rule by name.
// The definer callback receives the RuleSpec and can modify its Open/Close
// alternates, and BO/BC/AO/AC state actions.
//
// If the rule does not exist, a new empty RuleSpec is created.
// Returns the Jsonic instance for chaining.
//
// Example:
//
//	j.Rule("val", func(rs *RuleSpec) {
//	    rs.Open = append([]*AltSpec{{
//	        S: [][]Tin{{myToken}},
//	        A: func(r *Rule, ctx *Context) { r.Node = "custom" },
//	    }}, rs.Open...)
//	})
func (j *Jsonic) Rule(name string, definer RuleDefiner) *Jsonic {
	rs := j.parser.RSM[name]
	if rs == nil {
		rs = &RuleSpec{Name: name}
		j.parser.RSM[name] = rs
	}
	definer(rs)
	return j
}

// Token registers a new token type or looks up an existing one.
// With just a name, it returns the Tin for an existing token.
// With a name and source character(s), it registers a new fixed token.
//
// Returns the Tin (token identification number) for the token.
//
// Example:
//
//	// Register a new fixed token
//	TT := j.Token("#TL", "~")
//
//	// Look up existing token
//	OB := j.Token("#OB", "")
func (j *Jsonic) Token(name string, src ...string) Tin {
	// Look up existing token by name.
	if tin, ok := j.tinByName[name]; ok {
		// If src provided, update the fixed token mapping.
		if len(src) > 0 && src[0] != "" {
			if j.parser.Config.FixedTokens == nil {
				j.parser.Config.FixedTokens = make(map[string]Tin)
			}
			j.parser.Config.FixedTokens[src[0]] = tin
			j.parser.Config.SortFixedTokens()
		}
		return tin
	}

	// Allocate a new Tin.
	tin := j.nextTin
	j.nextTin++

	j.tinByName[name] = tin
	j.nameByTin[tin] = name

	// Also store in the config's TinNames for lexer access.
	if j.parser.Config.TinNames == nil {
		j.parser.Config.TinNames = make(map[Tin]string)
	}
	j.parser.Config.TinNames[tin] = name

	// Register as fixed token if src provided.
	if len(src) > 0 && src[0] != "" {
		if j.parser.Config.FixedTokens == nil {
			j.parser.Config.FixedTokens = make(map[string]Tin)
		}
		j.parser.Config.FixedTokens[src[0]] = tin
		j.parser.Config.SortFixedTokens()
	}

	return tin
}

// FixedSrc returns the Tin for a fixed token source string (e.g. "{" → TinOB).
// Returns 0 if the source string is not a fixed token.
// Matches TS `jsonic.fixed('b')`.
func (j *Jsonic) FixedSrc(src string) Tin {
	if tin, ok := j.parser.Config.FixedTokens[src]; ok {
		return tin
	}
	return 0
}

// FixedTin returns the source string for a fixed token Tin (e.g. TinOB → "{").
// Returns "" if the Tin is not a fixed token.
// Matches TS `jsonic.fixed(18)`.
func (j *Jsonic) FixedTin(tin Tin) string {
	for src, t := range j.parser.Config.FixedTokens {
		if t == tin {
			return src
		}
	}
	return ""
}

// AddMatcher adds a custom lexer matcher with the given name and priority.
// Matchers are tried in priority order (lower first). Built-in matchers use:
//
//	fixed=2000000, space=3000000, line=4000000, string=5000000,
//	comment=6000000, number=7000000, text=8000000
//
// Use priority < 2000000 to run before all built-ins (matching TS match behavior).
// The matcher receives the current parsing rule for context-sensitive lexing.
// Returns the Jsonic instance for chaining.
func (j *Jsonic) AddMatcher(name string, priority int, matcher LexMatcher) *Jsonic {
	entry := &MatcherEntry{
		Name:     name,
		Priority: priority,
		Match:    matcher,
	}
	j.parser.Config.CustomMatchers = append(j.parser.Config.CustomMatchers, entry)

	// Keep sorted by priority.
	sort.Slice(j.parser.Config.CustomMatchers, func(i, k int) bool {
		return j.parser.Config.CustomMatchers[i].Priority < j.parser.Config.CustomMatchers[k].Priority
	})
	return j
}


// Plugins returns the list of installed plugins (for introspection).
func (j *Jsonic) Plugins() []Plugin {
	out := make([]Plugin, len(j.plugins))
	for i, pe := range j.plugins {
		out[i] = pe.plugin
	}
	return out
}

// Config returns the parser's LexConfig for direct inspection or modification.
// Use with care — prefer Token(), Rule(), and AddMatcher() for most plugin work.
func (j *Jsonic) Config() *LexConfig {
	return j.parser.Config
}

// RSM returns the rule spec map for direct inspection or modification.
func (j *Jsonic) RSM() map[string]*RuleSpec {
	return j.parser.RSM
}

// TinName returns the name for a Tin value, checking both built-in and custom tokens.
func (j *Jsonic) TinName(tin Tin) string {
	if name, ok := j.nameByTin[tin]; ok {
		return name
	}
	return tinName(tin)
}

// TokenSet returns a named set of Tin values.
// Built-in sets: "IGNORE" (space, line, comment), "VAL" (text, number, string, value),
// "KEY" (text, number, string, value).
// Custom sets can be added via SetTokenSet.
// Returns nil if the set name is not recognized.
func (j *Jsonic) TokenSet(name string) []Tin {
	// Check custom sets first.
	if j.customTokenSets != nil {
		if tins, ok := j.customTokenSets[name]; ok {
			result := make([]Tin, len(tins))
			copy(result, tins)
			return result
		}
	}
	switch name {
	case "IGNORE":
		tins := make([]Tin, 0, len(TinSetIGNORE))
		for tin := range TinSetIGNORE {
			tins = append(tins, tin)
		}
		return tins
	case "VAL":
		result := make([]Tin, len(TinSetVAL))
		copy(result, TinSetVAL)
		return result
	case "KEY":
		result := make([]Tin, len(TinSetKEY))
		copy(result, TinSetKEY)
		return result
	default:
		return nil
	}
}

// SetTokenSet registers a custom named token set.
// Matches TS options.tokenSet.
func (j *Jsonic) SetTokenSet(name string, tins []Tin) {
	if j.customTokenSets == nil {
		j.customTokenSets = make(map[string][]Tin)
	}
	j.customTokenSets[name] = tins
}

// Sub subscribes to lex and/or rule events.
// LexSub fires after each non-ignored token is lexed.
// RuleSub fires after each rule processing step.
// Returns the Jsonic instance for chaining.
func (j *Jsonic) Sub(lexSub LexSub, ruleSub RuleSub) *Jsonic {
	if lexSub != nil {
		j.lexSubs = append(j.lexSubs, lexSub)
	}
	if ruleSub != nil {
		j.ruleSubs = append(j.ruleSubs, ruleSub)
	}
	return j
}

// Derive creates a new Jsonic instance inheriting this instance's config,
// rules, plugins, and custom tokens. Changes to the child do not affect the parent.
// This matches TypeScript's jsonic.make(options, parent).
func (j *Jsonic) Derive(opts ...Options) *Jsonic {
	// Start with parent's options, merge with new ones.
	child := Make(opts...)

	// Copy parent's custom fixed tokens.
	for k, v := range j.parser.Config.FixedTokens {
		child.parser.Config.FixedTokens[k] = v
	}
	child.parser.Config.SortFixedTokens()

	// Copy parent's custom token names.
	for k, v := range j.tinByName {
		child.tinByName[k] = v
	}
	for k, v := range j.nameByTin {
		child.nameByTin[k] = v
	}
	if child.nextTin < j.nextTin {
		child.nextTin = j.nextTin
	}

	// Copy TinNames into child config.
	if j.parser.Config.TinNames != nil {
		if child.parser.Config.TinNames == nil {
			child.parser.Config.TinNames = make(map[Tin]string)
		}
		for k, v := range j.parser.Config.TinNames {
			child.parser.Config.TinNames[k] = v
		}
	}

	// Copy parent's custom matchers.
	for _, m := range j.parser.Config.CustomMatchers {
		child.parser.Config.CustomMatchers = append(child.parser.Config.CustomMatchers, m)
	}

	// Copy parent's ender chars.
	if j.parser.Config.EnderChars != nil {
		if child.parser.Config.EnderChars == nil {
			child.parser.Config.EnderChars = make(map[rune]bool)
		}
		for k, v := range j.parser.Config.EnderChars {
			child.parser.Config.EnderChars[k] = v
		}
	}

	// Copy parent's escape map.
	if j.parser.Config.EscapeMap != nil {
		if child.parser.Config.EscapeMap == nil {
			child.parser.Config.EscapeMap = make(map[string]string)
		}
		for k, v := range j.parser.Config.EscapeMap {
			child.parser.Config.EscapeMap[k] = v
		}
	}

	// Copy custom token sets.
	if j.customTokenSets != nil {
		if child.customTokenSets == nil {
			child.customTokenSets = make(map[string][]Tin)
		}
		for name, tins := range j.customTokenSets {
			copied := make([]Tin, len(tins))
			copy(copied, tins)
			child.customTokenSets[name] = copied
		}
	}

	// Re-apply parent's plugins on the child.
	for _, pe := range j.plugins {
		child.plugins = append(child.plugins, pe)
		pe.plugin(child, pe.opts)
	}

	// Copy subscriptions.
	child.lexSubs = append(child.lexSubs, j.lexSubs...)
	child.ruleSubs = append(child.ruleSubs, j.ruleSubs...)

	// Copy decorations (TS: parent properties inherited by child).
	if j.decorations != nil {
		if child.decorations == nil {
			child.decorations = make(map[string]any)
		}
		for k, v := range j.decorations {
			child.decorations[k] = v
		}
	}

	// Copy plugin options namespace.
	if j.pluginOpts != nil {
		if child.pluginOpts == nil {
			child.pluginOpts = make(map[string]map[string]any)
		}
		for name, opts := range j.pluginOpts {
			copied := make(map[string]any, len(opts))
			for k, v := range opts {
				copied[k] = v
			}
			child.pluginOpts[name] = copied
		}
	}

	return child
}

// SetOptions deep-merges new options into this instance and rebuilds the
// config. Existing grammar rules (including plugin modifications) are
// preserved — matching the TypeScript clone/inherit pattern where
// options() does not rebuild the grammar.
// When called from within a plugin (during re-apply), skips plugin
// re-application to avoid infinite recursion.
// Returns the instance for chaining.
func (j *Jsonic) SetOptions(opts Options) *Jsonic {
	merged := Deep(*j.options, opts).(Options)
	j.options = &merged

	// Rebuild config from merged options.
	cfg := buildConfig(j.options)

	// Preserve per-instance state.
	cfg.FixedTokens = j.parser.Config.FixedTokens
	cfg.FixedSorted = j.parser.Config.FixedSorted
	cfg.TinNames = j.parser.Config.TinNames
	cfg.CustomMatchers = j.parser.Config.CustomMatchers

	// Update config in-place to preserve pointer identity.
	// Grammar closures capture the original *LexConfig pointer, so updating
	// the object they point to (rather than replacing it) ensures they see
	// the new config values. This matches TS behavior where configure()
	// mutates the existing config and parser.clone() inherits the rules.
	*j.parser.Config = *cfg

	// Do NOT rebuild grammar — preserve existing RSM with user rule
	// modifications. This matches TS where options() calls parser.clone()
	// which inherits existing rules rather than rebuilding from scratch.

	// Re-apply plugins (with re-entrancy guard to match TS behavior where
	// options() setter does not re-trigger plugin application).
	if !j.inSetOptions {
		j.inSetOptions = true
		for _, pe := range j.plugins {
			pe.plugin(j, pe.opts)
		}
		j.inSetOptions = false
	}

	// Apply lex.match specs: create matchers from MakeLexMatcher factories.
	if opts.Lex != nil && opts.Lex.Match != nil {
		for name, spec := range opts.Lex.Match {
			matcher := spec.Make(j.parser.Config, j.options)
			j.AddMatcher(name, spec.Order, matcher)
		}
	}

	// Apply error messages.
	if j.options.Error != nil {
		for k, v := range j.options.Error {
			j.parser.ErrorMessages[k] = v
		}
	}

	// Apply hints.
	if j.options.Hint != nil {
		if j.hints == nil {
			j.hints = make(map[string]string)
		}
		if j.parser.Hints == nil {
			j.parser.Hints = make(map[string]string)
		}
		for k, v := range j.options.Hint {
			j.hints[k] = v
			j.parser.Hints[k] = v
		}
	}

	// Apply errmsg options.
	if j.options.ErrMsg != nil && j.options.ErrMsg.Name != "" {
		j.parser.ErrTag = j.options.ErrMsg.Name
	}

	return j
}

// Exclude removes grammar alternates tagged with any of the given group names.
// Group names are comma-separated in AltSpec.G fields.
// Use Exclude("json") to strip all jsonic extensions and get strict JSON parsing.
// Returns the Jsonic instance for chaining.
func (j *Jsonic) Exclude(groups ...string) *Jsonic {
	excludeSet := make(map[string]bool)
	for _, g := range groups {
		for _, part := range strings.Split(g, ",") {
			part = strings.TrimSpace(part)
			if part != "" {
				excludeSet[part] = true
			}
		}
	}

	for _, rs := range j.parser.RSM {
		rs.Open = filterAlts(rs.Open, excludeSet)
		rs.Close = filterAlts(rs.Close, excludeSet)
	}
	return j
}

// filterAlts removes alternates whose G tags overlap with the exclude set.
func filterAlts(alts []*AltSpec, excludeSet map[string]bool) []*AltSpec {
	result := make([]*AltSpec, 0, len(alts))
	for _, alt := range alts {
		if alt.G == "" {
			result = append(result, alt)
			continue
		}
		excluded := false
		for _, tag := range strings.Split(alt.G, ",") {
			tag = strings.TrimSpace(tag)
			if excludeSet[tag] {
				excluded = true
				break
			}
		}
		if !excluded {
			result = append(result, alt)
		}
	}
	return result
}

// ParseMeta parses a jsonic string with metadata passed through to the parse context.
// The meta map is accessible in rule actions/conditions via ctx.Meta.
func (j *Jsonic) ParseMeta(src string, meta map[string]any) (any, error) {
	return j.parseInternal(src, meta)
}

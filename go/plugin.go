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
// It receives the lexer and returns a Token if matched, or nil to pass.
// The matcher can read the current position via lex.Cursor() and must
// advance the cursor if it produces a token.
type LexMatcher func(lex *Lex) *Token

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

// AddMatcher adds a custom lexer matcher with the given name and priority.
// Matchers are tried in priority order (lower first). Built-in matchers use:
//
//	fixed=2000000, space=3000000, line=4000000, string=5000000,
//	comment=6000000, number=7000000, text=8000000
//
// Use priority < 2000000 to run before all built-ins (matching TS match behavior).
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
// Returns nil if the set name is not recognized.
func (j *Jsonic) TokenSet(name string) []Tin {
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

	// Re-apply parent's plugins on the child.
	for _, pe := range j.plugins {
		child.plugins = append(child.plugins, pe)
		pe.plugin(child, pe.opts)
	}

	// Copy subscriptions.
	child.lexSubs = append(child.lexSubs, j.lexSubs...)
	child.ruleSubs = append(child.ruleSubs, j.ruleSubs...)

	return child
}

// SetOptions merges new options into this instance and rebuilds the config.
// This allows dynamic reconfiguration after construction.
func (j *Jsonic) SetOptions(opts Options) *Jsonic {
	// Merge individual option fields.
	if opts.Safe != nil {
		j.options.Safe = opts.Safe
	}
	if opts.Fixed != nil {
		j.options.Fixed = opts.Fixed
	}
	if opts.Space != nil {
		j.options.Space = opts.Space
	}
	if opts.Line != nil {
		j.options.Line = opts.Line
	}
	if opts.Text != nil {
		j.options.Text = opts.Text
	}
	if opts.Number != nil {
		j.options.Number = opts.Number
	}
	if opts.Comment != nil {
		j.options.Comment = opts.Comment
	}
	if opts.String != nil {
		j.options.String = opts.String
	}
	if opts.Map != nil {
		j.options.Map = opts.Map
	}
	if opts.List != nil {
		j.options.List = opts.List
	}
	if opts.Value != nil {
		j.options.Value = opts.Value
	}
	if opts.Rule != nil {
		j.options.Rule = opts.Rule
	}
	if len(opts.Ender) > 0 {
		j.options.Ender = opts.Ender
	}
	if opts.Error != nil {
		j.options.Error = opts.Error
	}
	if opts.Tag != "" {
		j.options.Tag = opts.Tag
	}

	// Rebuild config from merged options.
	cfg := buildConfig(j.options)

	// Preserve per-instance state.
	cfg.FixedTokens = j.parser.Config.FixedTokens
	cfg.FixedSorted = j.parser.Config.FixedSorted
	cfg.TinNames = j.parser.Config.TinNames
	cfg.CustomMatchers = j.parser.Config.CustomMatchers

	j.parser.Config = cfg

	// Rebuild grammar.
	rsm := make(map[string]*RuleSpec)
	Grammar(rsm, cfg)
	j.parser.RSM = rsm

	// Re-apply plugins.
	for _, pe := range j.plugins {
		pe.plugin(j, pe.opts)
	}

	// Apply error messages.
	if j.options.Error != nil {
		for k, v := range j.options.Error {
			j.parser.ErrorMessages[k] = v
		}
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

package jsonic

import "sort"

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

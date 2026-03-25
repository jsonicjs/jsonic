package jsonic

import (
	"fmt"
	"sort"
	"strings"
)

// Debug is a plugin that provides introspection and tracing capabilities.
// It matches the TypeScript Debug plugin functionality.
//
// Usage:
//
//	j := jsonic.Make()
//	j.Use(jsonic.Debug, map[string]any{"trace": true})
//	fmt.Println(jsonic.Describe(j))
var Debug Plugin = func(j *Jsonic, opts map[string]any) {
	if opts != nil {
		if trace, ok := opts["trace"]; ok {
			if traceBool, ok := trace.(bool); ok && traceBool {
				addTrace(j)
			}
		}
	}
}

// addTrace installs lex and rule subscribers that log each step.
func addTrace(j *Jsonic) {
	j.Sub(
		func(tkn *Token, rule *Rule, ctx *Context) {
			fmt.Printf("[lex] %s tin=%d src=%q val=%v at %d:%d\n",
				tkn.Name, tkn.Tin, tkn.Src, tkn.Val, tkn.RI, tkn.CI)
		},
		func(rule *Rule, ctx *Context) {
			fmt.Printf("[rule] %s state=%s node=%v ki=%d\n",
				rule.Name, rule.State, rule.Node, ctx.KI)
		},
	)
}

// Describe returns a human-readable description of a Jsonic instance's configuration.
// It lists tokens, fixed tokens, rules, matchers, plugins, and key config settings.
func Describe(j *Jsonic) string {
	var b strings.Builder

	b.WriteString("=== Jsonic Instance ===\n")
	if j.options != nil && j.options.Tag != "" {
		b.WriteString(fmt.Sprintf("Tag: %s\n", j.options.Tag))
	}

	// Tokens
	b.WriteString("\n--- Tokens ---\n")
	names := make([]string, 0, len(j.tinByName))
	for name := range j.tinByName {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		tin := j.tinByName[name]
		b.WriteString(fmt.Sprintf("  %s = %d\n", name, tin))
	}

	// Fixed tokens
	b.WriteString("\n--- Fixed Tokens ---\n")
	cfg := j.Config()
	if cfg.FixedTokens != nil {
		ftKeys := make([]string, 0, len(cfg.FixedTokens))
		for k := range cfg.FixedTokens {
			ftKeys = append(ftKeys, k)
		}
		sort.Strings(ftKeys)
		for _, k := range ftKeys {
			tin := cfg.FixedTokens[k]
			name := j.TinName(tin)
			b.WriteString(fmt.Sprintf("  %q -> %s (%d)\n", k, name, tin))
		}
	}

	// Rules
	b.WriteString("\n--- Rules ---\n")
	ruleNames := make([]string, 0, len(j.parser.RSM))
	for name := range j.parser.RSM {
		ruleNames = append(ruleNames, name)
	}
	sort.Strings(ruleNames)
	for _, name := range ruleNames {
		rs := j.parser.RSM[name]
		b.WriteString(fmt.Sprintf("  %s: open=%d close=%d bo=%d ao=%d bc=%d ac=%d\n",
			name, len(rs.Open), len(rs.Close), len(rs.BO), len(rs.AO), len(rs.BC), len(rs.AC)))
	}

	// Custom matchers
	if len(cfg.CustomMatchers) > 0 {
		b.WriteString("\n--- Custom Matchers ---\n")
		for _, m := range cfg.CustomMatchers {
			b.WriteString(fmt.Sprintf("  %s (priority=%d)\n", m.Name, m.Priority))
		}
	}

	// Plugins
	b.WriteString(fmt.Sprintf("\n--- Plugins: %d ---\n", len(j.plugins)))

	// Subscriptions
	b.WriteString(fmt.Sprintf("\n--- Subscriptions ---\n"))
	b.WriteString(fmt.Sprintf("  Lex subscribers: %d\n", len(j.lexSubs)))
	b.WriteString(fmt.Sprintf("  Rule subscribers: %d\n", len(j.ruleSubs)))

	// Config summary
	b.WriteString("\n--- Config ---\n")
	b.WriteString(fmt.Sprintf("  FixedLex: %v\n", cfg.FixedLex))
	b.WriteString(fmt.Sprintf("  SpaceLex: %v\n", cfg.SpaceLex))
	b.WriteString(fmt.Sprintf("  LineLex: %v\n", cfg.LineLex))
	b.WriteString(fmt.Sprintf("  TextLex: %v\n", cfg.TextLex))
	b.WriteString(fmt.Sprintf("  NumberLex: %v\n", cfg.NumberLex))
	b.WriteString(fmt.Sprintf("  CommentLex: %v\n", cfg.CommentLex))
	b.WriteString(fmt.Sprintf("  StringLex: %v\n", cfg.StringLex))
	b.WriteString(fmt.Sprintf("  ValueLex: %v\n", cfg.ValueLex))
	b.WriteString(fmt.Sprintf("  MapExtend: %v\n", cfg.MapExtend))
	b.WriteString(fmt.Sprintf("  ListProperty: %v\n", cfg.ListProperty))
	b.WriteString(fmt.Sprintf("  SafeKey: %v\n", cfg.SafeKey))
	b.WriteString(fmt.Sprintf("  FinishRule: %v\n", cfg.FinishRule))
	b.WriteString(fmt.Sprintf("  RuleStart: %s\n", cfg.RuleStart))

	return b.String()
}

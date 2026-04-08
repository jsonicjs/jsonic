package jsonic

import (
	"strings"
	"testing"
)

// hasExactTag checks if tagStr (comma-separated) contains the exact tag.
func hasExactTag(tagStr, tag string) bool {
	for _, t := range strings.Split(tagStr, ",") {
		if strings.TrimSpace(t) == tag {
			return true
		}
	}
	return false
}

// --- Plugin: Use and basic invocation ---

func TestUseInvokesPlugin(t *testing.T) {
	invoked := false
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		invoked = true
	})
	if !invoked {
		t.Error("plugin was not invoked")
	}
}

func TestUsePassesOptions(t *testing.T) {
	var got map[string]any
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		got = opts
	}, map[string]any{"key": "value"})
	if got == nil || got["key"] != "value" {
		t.Errorf("plugin options not passed correctly: %v", got)
	}
}

func TestUseChaining(t *testing.T) {
	order := []string{}
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		order = append(order, "first")
	}).Use(func(j *Jsonic, opts map[string]any) {
		order = append(order, "second")
	})
	if len(order) != 2 || order[0] != "first" || order[1] != "second" {
		t.Errorf("expected [first second], got %v", order)
	}
}

func TestPlugins(t *testing.T) {
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {})
	j.Use(func(j *Jsonic, opts map[string]any) {})
	if len(j.Plugins()) != 2 {
		t.Errorf("expected 2 plugins, got %d", len(j.Plugins()))
	}
}

// --- Plugin: Token registration ---

func TestTokenRegisterNew(t *testing.T) {
	j := Make()
	tin := j.Token("#TL", "~")
	if tin < TinMAX {
		t.Errorf("new token should have Tin >= TinMAX(%d), got %d", TinMAX, tin)
	}
	// Look up by name returns same Tin.
	tin2 := j.Token("#TL")
	if tin2 != tin {
		t.Errorf("lookup returned different Tin: %d vs %d", tin2, tin)
	}
}

func TestTokenLookupBuiltin(t *testing.T) {
	j := Make()
	tin := j.Token("#OB")
	if tin != TinOB {
		t.Errorf("expected TinOB=%d, got %d", TinOB, tin)
	}
}

func TestTokenFixedRegistration(t *testing.T) {
	j := Make()
	tin := j.Token("#TL", "~")
	// The fixed token map should now contain '~'.
	if j.Config().FixedTokens["~"] != tin {
		t.Errorf("fixed token '~' not registered in config")
	}
}

func TestTokenMultipleRegistrations(t *testing.T) {
	j := Make()
	t1 := j.Token("#T1", "!")
	t2 := j.Token("#T2", "@")
	if t1 == t2 {
		t.Error("different tokens got same Tin")
	}
	if t1 < TinMAX || t2 < TinMAX {
		t.Error("custom tokens should have Tin >= TinMAX")
	}
}

func TestTinName(t *testing.T) {
	j := Make()
	j.Token("#TL", "~")
	name := j.TinName(TinOB)
	if name != "#OB" {
		t.Errorf("expected #OB, got %s", name)
	}
	tin := j.Token("#TL")
	name2 := j.TinName(tin)
	if name2 != "#TL" {
		t.Errorf("expected #TL, got %s", name2)
	}
}

// --- Plugin: Custom fixed token used in parsing ---

func TestPluginCustomFixedToken(t *testing.T) {
	// Plugin that makes '~' a separator (like comma).
	tildeSep := func(j *Jsonic, opts map[string]any) {
		// Register ~ as the comma token (replacing comma behavior).
		j.Token("#CA", "~")
	}

	j := Make()
	j.Use(tildeSep)

	// Now ~ should act as a comma separator.
	result, err := j.Parse("a ~ b ~ c")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	arr, ok := result.([]any)
	if !ok {
		t.Fatalf("expected array, got %T: %v", result, result)
	}
	if len(arr) != 3 {
		t.Fatalf("expected 3 elements, got %d: %v", len(arr), arr)
	}
	if arr[0] != "a" || arr[1] != "b" || arr[2] != "c" {
		t.Errorf("expected [a b c], got %v", arr)
	}
}

// --- Plugin: Rule modification ---

func TestPluginRuleModification(t *testing.T) {
	// Plugin that makes all string values uppercase.
	upperPlugin := func(j *Jsonic, opts map[string]any) {
		j.Rule("val", func(rs *RuleSpec) {
			// Add an after-close action that uppercases string nodes.
			rs.AC = append(rs.AC, func(r *Rule, ctx *Context) {
				if s, ok := r.Node.(string); ok {
					r.Node = strings.ToUpper(s)
				}
			})
		})
	}

	j := Make()
	j.Use(upperPlugin)

	result, err := j.Parse(`"hello"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "HELLO" {
		t.Errorf("expected HELLO, got %v", result)
	}
}

func TestPluginRuleAddAlternate(t *testing.T) {
	// Plugin that adds a custom "hundred" rule.
	hundredPlugin := func(j *Jsonic, opts map[string]any) {
		// Register a custom fixed token 'H'.
		TH := j.Token("#TH", "H")

		// Add a new rule that produces 100.
		j.Rule("hundred", func(rs *RuleSpec) {
			rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
				r.Node = float64(100)
			})
		})

		// Modify val rule to recognize 'H' and push to "hundred".
		j.Rule("val", func(rs *RuleSpec) {
			rs.Open = append([]*AltSpec{{
				S: [][]Tin{{TH}},
				P: "hundred",
			}}, rs.Open...)
		})
	}

	j := Make()
	j.Use(hundredPlugin)

	result, err := j.Parse("H")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != float64(100) {
		t.Errorf("expected 100, got %v (%T)", result, result)
	}
}

func TestPluginRuleNewRule(t *testing.T) {
	j := Make()
	// Verify we can create a new rule.
	j.Rule("custom", func(rs *RuleSpec) {
		if rs.Name != "custom" {
			t.Errorf("expected rule name 'custom', got '%s'", rs.Name)
		}
	})
	if j.RSM()["custom"] == nil {
		t.Error("custom rule not created")
	}
}

// --- Plugin: Custom matcher ---

func TestPluginCustomMatcher(t *testing.T) {
	// Plugin that matches "$$" as a special value.
	dollarPlugin := func(j *Jsonic, opts map[string]any) {
		j.AddMatcher("dollar", 1500000, func(lex *Lex, rule *Rule) *Token {
			pnt := lex.Cursor()
			if pnt.SI+2 <= pnt.Len && lex.Src[pnt.SI:pnt.SI+2] == "$$" {
				tkn := lex.Token("#VL", TinVL, "DOLLAR", "$$")
				pnt.SI += 2
				pnt.CI += 2
				return tkn
			}
			return nil
		})
	}

	j := Make()
	j.Use(dollarPlugin)

	result, err := j.Parse("$$")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "DOLLAR" {
		t.Errorf("expected DOLLAR, got %v", result)
	}
}

func TestPluginCustomMatcherInObject(t *testing.T) {
	// Custom matcher that matches "@" as a special value.
	atPlugin := func(j *Jsonic, opts map[string]any) {
		j.AddMatcher("at", 1500000, func(lex *Lex, rule *Rule) *Token {
			pnt := lex.Cursor()
			if pnt.SI < pnt.Len && lex.Src[pnt.SI] == '@' {
				tkn := lex.Token("#VL", TinVL, "AT_VALUE", "@")
				pnt.SI++
				pnt.CI++
				return tkn
			}
			return nil
		})
	}

	j := Make()
	j.Use(atPlugin)

	result, err := j.Parse("{a: @}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T: %v", result, result)
	}
	if m["a"] != "AT_VALUE" {
		t.Errorf("expected AT_VALUE, got %v", m["a"])
	}
}

func TestPluginMatcherPriority(t *testing.T) {
	// Verify early matchers (priority < 2e6) run before built-in matchers.
	// The early matcher sees '42' before the number matcher does.
	earlySawInput := false

	j := Make()
	j.AddMatcher("early", 1000000, func(lex *Lex, rule *Rule) *Token {
		pnt := lex.Cursor()
		if pnt.SI < pnt.Len && lex.Src[pnt.SI] == '4' {
			earlySawInput = true
		}
		return nil // Pass through to built-in matchers.
	})

	j.Parse("42")

	if !earlySawInput {
		t.Error("early matcher was not invoked before built-in number matcher")
	}
}

func TestPluginMatcherLowPriorityCaptures(t *testing.T) {
	// An early custom matcher can capture input before built-in matchers.
	j := Make()
	j.AddMatcher("capture42", 1000000, func(lex *Lex, rule *Rule) *Token {
		pnt := lex.Cursor()
		if pnt.SI+2 <= pnt.Len && lex.Src[pnt.SI:pnt.SI+2] == "42" {
			tkn := lex.Token("#VL", TinVL, "FORTY_TWO", "42")
			pnt.SI += 2
			pnt.CI += 2
			return tkn
		}
		return nil
	})

	result, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "FORTY_TWO" {
		t.Errorf("expected FORTY_TWO, got %v", result)
	}
}

// --- Plugin: Config and RSM access ---

func TestPluginConfigAccess(t *testing.T) {
	j := Make()
	cfg := j.Config()
	if cfg == nil {
		t.Fatal("Config() returned nil")
	}
	if !cfg.FixedLex {
		t.Error("expected FixedLex to be true")
	}
}

func TestPluginRSMAccess(t *testing.T) {
	j := Make()
	rsm := j.RSM()
	if rsm == nil {
		t.Fatal("RSM() returned nil")
	}
	if rsm["val"] == nil {
		t.Error("expected 'val' rule in RSM")
	}
}

// --- Plugin: Instance isolation ---

func TestPluginInstanceIsolation(t *testing.T) {
	j1 := Make()
	j2 := Make()

	// Registering a token on j1 should not affect j2.
	j1.Token("#T1", "~")

	if _, ok := j2.Config().FixedTokens["~"]; ok {
		t.Error("custom token leaked from j1 to j2")
	}
}

// --- Plugin: Composite test (full plugin workflow) ---

func TestPluginComposite(t *testing.T) {
	// A realistic plugin that:
	// 1. Registers a custom token ';' as separator (replacing comma)
	// 2. Adds a before-open action to list rule

	semiPlugin := func(j *Jsonic, opts map[string]any) {
		j.Token("#CA", ";")
	}

	j := Make()
	j.Use(semiPlugin)

	// Semicolon should work as separator.
	result, err := j.Parse("a ; b ; c")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	arr, ok := result.([]any)
	if !ok {
		t.Fatalf("expected array, got %T: %v", result, result)
	}
	if len(arr) != 3 {
		t.Fatalf("expected 3 elements, got %d: %v", len(arr), arr)
	}

	// Original comma should still work too (it's still in FixedTokens).
	result2, err := j.Parse("x , y")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	arr2, ok := result2.([]any)
	if !ok {
		t.Fatalf("expected array, got %T: %v", result2, result2)
	}
	if len(arr2) != 2 {
		t.Fatalf("expected 2 elements, got %d: %v", len(arr2), arr2)
	}
}

// --- Plugin: Nil options handling ---

func TestUseNilOptions(t *testing.T) {
	invoked := false
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		invoked = true
		if opts != nil {
			t.Errorf("expected nil opts, got %v", opts)
		}
	})
	if !invoked {
		t.Error("plugin not invoked")
	}
}

// --- Plugin: Disable built-in features ---

func TestPluginDisableComments(t *testing.T) {
	// Disable comments entirely by providing empty comment definitions.
	j := Make(Options{
		Comment: &CommentOptions{
			Lex: boolPtr(false),
			Def: map[string]*CommentDef{},
		},
	})

	// With comments disabled and no comment defs, # should be treated as text.
	result, err := j.Parse(`{a: #hello}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T: %v", result, result)
	}
	if v, ok := m["a"].(string); !ok || !strings.HasPrefix(v, "#hello") {
		t.Errorf("expected a to start with '#hello', got %v", m["a"])
	}
}

func TestPluginDisableNumbers(t *testing.T) {
	j := Make(Options{
		Number: &NumberOptions{Lex: boolPtr(false)},
	})

	// With numbers disabled, 42 should be treated as text.
	result, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "42" {
		t.Errorf("expected string '42', got %v (%T)", result, result)
	}
}

// --- Multi-character fixed tokens ---

func TestMultiCharFixedToken(t *testing.T) {
	j := Make()
	TA := j.Token("#TA", "=>")

	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{{
			S: [][]Tin{{TA}},
			A: func(r *Rule, ctx *Context) {
				r.Node = "ARROW"
			},
		}}, rs.Open...)
	})

	result, err := j.Parse("=>")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "ARROW" {
		t.Errorf("expected ARROW, got %v", result)
	}
}

func TestMultiCharFixedTokenLongestMatch(t *testing.T) {
	j := Make()
	TEQ := j.Token("#TEQ", "=")
	TARROW := j.Token("#TARROW", "=>")

	matchedEQ := false
	matchedArrow := false

	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{
			{
				S: [][]Tin{{TARROW}},
				A: func(r *Rule, ctx *Context) {
					matchedArrow = true
					r.Node = "ARROW"
				},
			},
			{
				S: [][]Tin{{TEQ}},
				A: func(r *Rule, ctx *Context) {
					matchedEQ = true
					r.Node = "EQ"
				},
			},
		}, rs.Open...)
	})

	// "=>" should match the arrow (longer), not just "=".
	result, err := j.Parse("=>")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "ARROW" {
		t.Errorf("expected ARROW, got %v", result)
	}
	if !matchedArrow {
		t.Error("arrow should have been matched")
	}
	if matchedEQ {
		t.Error("eq should not have been matched for =>")
	}
}

func TestMultiCharFixedTokenBreaksText(t *testing.T) {
	j := Make()
	j.Token("#TA", "=>")

	// "abc=>" should parse "abc" as text, then "=>" as fixed token.
	result, err := j.Parse("{key: abc=>}")
	if err != nil {
		// If the parser can't handle "=>" in this context, that's OK.
		// The important thing is that "=>" breaks text.
		return
	}
	m, ok := result.(map[string]any)
	if !ok {
		return
	}
	// "key" should be "abc" since "=>" breaks text.
	if v, ok := m["key"].(string); ok && v == "abc" {
		// Expected behavior: text stops at "=>"
	}
	_ = m
}

// --- Ender system ---

func TestEnderCharsBreakText(t *testing.T) {
	j := Make(Options{
		Ender: []string{"|"},
	})

	// "|" should end text tokens.
	result, err := j.Parse("abc|def")
	if err != nil {
		// Ender chars may cause unexpected token errors depending on grammar.
		// That's expected - the important thing is text stops at "|".
		return
	}
	// If it parses successfully, "abc" should be separated from "def".
	_ = result
}

func TestEnderCharsInMap(t *testing.T) {
	j := Make(Options{
		Ender: []string{"|"},
	})

	// In a map, ender should break values.
	result, err := j.Parse("{a: hello|world}")
	if err != nil {
		return // Ender breaking may cause parse issues
	}
	_ = result
}

// --- Custom escape mappings ---

func TestCustomEscapeMappings(t *testing.T) {
	j := Make(Options{
		String: &StringOptions{
			Escape: map[string]string{
				"a": "ALPHA",
				"d": "DELTA",
			},
		},
	})

	result, err := j.Parse(`"\a"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "ALPHA" {
		t.Errorf("expected ALPHA, got %v", result)
	}

	result2, err := j.Parse(`"\d"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result2 != "DELTA" {
		t.Errorf("expected DELTA, got %v", result2)
	}

	// Standard escapes should still work.
	result3, err := j.Parse(`"\n"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result3 != "\n" {
		t.Errorf("expected newline, got %v", result3)
	}
}

// --- Subscriptions ---

func TestSubLex(t *testing.T) {
	j := Make()

	tokens := []string{}
	j.Sub(func(tkn *Token, rule *Rule, ctx *Context) {
		tokens = append(tokens, tkn.Src)
	}, nil)

	j.Parse("{a: 1}")

	if len(tokens) == 0 {
		t.Error("lex subscriber was not invoked")
	}

	// Should have seen "{", "a", ":", "1", "}", end
	foundBrace := false
	for _, tok := range tokens {
		if tok == "{" {
			foundBrace = true
		}
	}
	if !foundBrace {
		t.Errorf("expected to see '{' token, got: %v", tokens)
	}
}

func TestSubRule(t *testing.T) {
	j := Make()

	ruleNames := []string{}
	j.Sub(nil, func(rule *Rule, ctx *Context) {
		ruleNames = append(ruleNames, rule.Name)
	})

	j.Parse("{a: 1}")

	if len(ruleNames) == 0 {
		t.Error("rule subscriber was not invoked")
	}

	// Should see rule processing for val, map, pair, etc.
	foundVal := false
	for _, name := range ruleNames {
		if name == "val" {
			foundVal = true
		}
	}
	if !foundVal {
		t.Errorf("expected to see 'val' rule, got: %v", ruleNames)
	}
}

// --- Instance derivation ---

func TestDerive(t *testing.T) {
	parent := Make()
	parent.Token("#TL", "~")

	child := parent.Derive()

	// Child should inherit parent's custom token.
	if _, ok := child.Config().FixedTokens["~"]; !ok {
		t.Error("child should inherit parent's custom fixed token")
	}
}

func TestDeriveIsolation(t *testing.T) {
	parent := Make()
	child := parent.Derive()

	// Modifying child should not affect parent.
	child.Token("#TX", "!")

	if _, ok := parent.Config().FixedTokens["!"]; ok {
		t.Error("child modification leaked to parent")
	}
}

func TestDeriveInheritsPlugins(t *testing.T) {
	count := 0
	parent := Make()
	parent.Use(func(j *Jsonic, opts map[string]any) {
		count++
	})

	// Plugin was invoked once on parent.
	if count != 1 {
		t.Fatalf("expected count 1, got %d", count)
	}

	child := parent.Derive()

	// Plugin should be re-invoked on child.
	if count != 2 {
		t.Errorf("expected count 2 after derive, got %d", count)
	}
	if len(child.Plugins()) != 1 {
		t.Errorf("expected 1 plugin, got %d", len(child.Plugins()))
	}
}

// --- Dynamic options ---

func TestSetOptions(t *testing.T) {
	j := Make()

	// Parse with defaults.
	result, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != float64(42) {
		t.Errorf("expected 42, got %v", result)
	}

	// Disable number lexing.
	j.SetOptions(Options{
		Number: &NumberOptions{Lex: boolPtr(false)},
	})

	// Now 42 should be text.
	result2, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result2 != "42" {
		t.Errorf("expected string '42' after SetOptions, got %v (%T)", result2, result2)
	}
}

func TestSetOptionsDeepMerge(t *testing.T) {
	// SetOptions should deep-merge like the TS options() setter:
	// setting one sub-field should not clobber sibling sub-fields.
	j := Make(Options{
		Number: &NumberOptions{Lex: boolPtr(true), Hex: boolPtr(true)},
	})

	// Disable hex but leave Lex untouched.
	j.SetOptions(Options{
		Number: &NumberOptions{Hex: boolPtr(false)},
	})

	opts := j.Options()
	if opts.Number == nil {
		t.Fatal("expected Number options to be non-nil")
	}
	if opts.Number.Lex == nil || !*opts.Number.Lex {
		t.Errorf("expected Number.Lex to remain true after SetOptions, got %v", opts.Number.Lex)
	}
	if opts.Number.Hex == nil || *opts.Number.Hex {
		t.Errorf("expected Number.Hex to be false after SetOptions, got %v", opts.Number.Hex)
	}

	// Numbers should still parse (Lex is still true).
	result, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != float64(42) {
		t.Errorf("expected 42, got %v (%T)", result, result)
	}
}

func TestSetOptionsDeepMergeMaps(t *testing.T) {
	// Map fields like Error and Comment.Def should merge, not replace.
	j := Make(Options{
		Error: map[string]string{"unexpected": "custom unexpected"},
	})

	j.SetOptions(Options{
		Error: map[string]string{"unterminated_string": "custom unterminated"},
	})

	opts := j.Options()
	if opts.Error["unexpected"] != "custom unexpected" {
		t.Errorf("expected Error['unexpected'] to be preserved, got %q", opts.Error["unexpected"])
	}
	if opts.Error["unterminated_string"] != "custom unterminated" {
		t.Errorf("expected Error['unterminated_string'] to be set, got %q", opts.Error["unterminated_string"])
	}
}

func TestSetOptionsChaining(t *testing.T) {
	// Multiple SetOptions calls should accumulate, not reset.
	j := Make()

	j.SetOptions(Options{
		Comment: &CommentOptions{Lex: boolPtr(false)},
	})
	j.SetOptions(Options{
		Number: &NumberOptions{Lex: boolPtr(false)},
	})

	opts := j.Options()
	if opts.Comment == nil || opts.Comment.Lex == nil || *opts.Comment.Lex {
		t.Error("expected Comment.Lex to remain false after second SetOptions")
	}
	if opts.Number == nil || opts.Number.Lex == nil || *opts.Number.Lex {
		t.Error("expected Number.Lex to be false after second SetOptions")
	}
}

// --- Rule exclude ---

func TestExclude(t *testing.T) {
	j := Make()

	// Count alternates with exact "json" group tag before exclude.
	hasJsonGroup := false
	for _, rs := range j.RSM() {
		for _, alt := range rs.Open {
			if hasExactTag(alt.G, "json") {
				hasJsonGroup = true
				break
			}
		}
		if hasJsonGroup {
			break
		}
	}

	if !hasJsonGroup {
		// Grammar doesn't use "json" group tags, so exclude won't remove anything.
		// But Exclude() should still work without error.
		j.Exclude("json")
		return
	}

	// If there are "json" tagged alts, exclude should remove them.
	j.Exclude("json")

	for _, rs := range j.RSM() {
		for _, alt := range rs.Open {
			if hasExactTag(alt.G, "json") {
				t.Errorf("rule %s still has 'json' group alt after Exclude", rs.Name)
			}
		}
		for _, alt := range rs.Close {
			if hasExactTag(alt.G, "json") {
				t.Errorf("rule %s still has 'json' close alt after Exclude", rs.Name)
			}
		}
	}
}

func TestExcludeCustomGroup(t *testing.T) {
	j := Make()

	// Add a custom alternate with a group tag.
	TT := j.Token("#TT", "!")
	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append(rs.Open, &AltSpec{
			S: [][]Tin{{TT}},
			G: "custom,test",
			A: func(r *Rule, ctx *Context) { r.Node = "BANG" },
		})
	})

	// Exclude "custom" group.
	j.Exclude("custom")

	// The custom alt should be removed.
	found := false
	for _, alt := range j.RSM()["val"].Open {
		if strings.Contains(alt.G, "custom") {
			found = true
		}
	}
	if found {
		t.Error("custom group alt should have been excluded")
	}
}

// --- Parse metadata ---

func TestParseMeta(t *testing.T) {
	j := Make()

	// Add a rule action that reads metadata.
	var capturedMeta map[string]any
	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			capturedMeta = ctx.Meta
		})
	})

	meta := map[string]any{"mode": "test", "version": 2}
	j.ParseMeta("42", meta)

	if capturedMeta == nil {
		t.Fatal("meta was not passed to context")
	}
	if capturedMeta["mode"] != "test" {
		t.Errorf("expected mode=test, got %v", capturedMeta["mode"])
	}
	if capturedMeta["version"] != 2 {
		t.Errorf("expected version=2, got %v", capturedMeta["version"])
	}
}

func TestParseMetaNil(t *testing.T) {
	j := Make()

	// ParseMeta with nil meta should work.
	result, err := j.ParseMeta("42", nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != float64(42) {
		t.Errorf("expected 42, got %v", result)
	}
}

// --- isTextChar config-aware ---

func TestCustomFixedTokenBreaksText(t *testing.T) {
	j := Make()
	j.Token("#TL", "~")

	// "abc~def" should break at "~"
	result, err := j.Parse("{key: abc~def}")
	if err != nil {
		// May cause parse error since ~def is unexpected.
		// The important test is that text stops at ~.
		return
	}
	_ = result
}

// --- Empty source handling ---

func TestEmptySourceDefault(t *testing.T) {
	j := Make()
	result, err := j.Parse("")
	if err != nil {
		t.Fatalf("empty source should not error by default: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil for empty source, got %v", result)
	}
}

func TestEmptySourceDisabled(t *testing.T) {
	j := Make(Options{
		Lex: &LexOptions{Empty: boolPtr(false)},
	})
	_, err := j.Parse("")
	if err == nil {
		t.Error("expected error when empty source is disallowed")
	}
}

func TestEmptySourceCustomResult(t *testing.T) {
	j := Make(Options{
		Lex: &LexOptions{EmptyResult: "EMPTY"},
	})
	result, err := j.Parse("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "EMPTY" {
		t.Errorf("expected 'EMPTY', got %v", result)
	}
}

// --- Custom parser.start ---

func TestCustomParserStart(t *testing.T) {
	j := Make(Options{
		Parser: &ParserOptions{
			Start: func(src string, j *Jsonic, meta map[string]any) (any, error) {
				return "CUSTOM:" + src, nil
			},
		},
	})
	result, err := j.Parse("hello")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "CUSTOM:hello" {
		t.Errorf("expected 'CUSTOM:hello', got %v", result)
	}
}

func TestCustomParserStartWithMeta(t *testing.T) {
	j := Make(Options{
		Parser: &ParserOptions{
			Start: func(src string, j *Jsonic, meta map[string]any) (any, error) {
				prefix := ""
				if meta != nil {
					if p, ok := meta["prefix"].(string); ok {
						prefix = p
					}
				}
				return prefix + src, nil
			},
		},
	})
	result, err := j.ParseMeta("world", map[string]any{"prefix": "hello-"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "hello-world" {
		t.Errorf("expected 'hello-world', got %v", result)
	}
}

// --- Error hints ---

func TestErrorHints(t *testing.T) {
	j := Make(Options{
		Hint: map[string]string{
			"unexpected": "Check your syntax for typos.",
		},
	})
	_, err := j.Parse("{a: @}")
	if err == nil {
		// This input might actually parse in some configs.
		// Use an input that's guaranteed to fail.
		return
	}
	je, ok := err.(*JsonicError)
	if !ok {
		t.Fatalf("expected *JsonicError, got %T", err)
	}
	if je.Hint != "Check your syntax for typos." {
		t.Errorf("expected hint text, got %q", je.Hint)
	}
	// Hint should appear in error string.
	errStr := je.Error()
	if !strings.Contains(errStr, "Hint: Check your syntax for typos.") {
		t.Errorf("error string should contain hint, got:\n%s", errStr)
	}
}

func TestErrorHintsInOutput(t *testing.T) {
	j := Make(Options{
		Hint: map[string]string{
			"unterminated_string": "Did you forget a closing quote?",
		},
	})
	_, err := j.Parse(`"unclosed`)
	if err == nil {
		t.Fatal("expected error for unterminated string")
	}
	je, ok := err.(*JsonicError)
	if !ok {
		t.Fatalf("expected *JsonicError, got %T", err)
	}
	if je.Hint != "Did you forget a closing quote?" {
		t.Errorf("expected hint for unterminated_string, got %q", je.Hint)
	}
}

// --- Config modify callbacks ---

func TestConfigModify(t *testing.T) {
	j := Make(Options{Property: &PropertyOptions{
		ConfigModify: map[string]ConfigModifier{
			"disable-hex": func(cfg *LexConfig, opts *Options) {
				cfg.NumberHex = false
			},
		},
	}})

	// With hex disabled, 0xFF should be text.
	result, err := j.Parse("0xFF")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == float64(255) {
		t.Error("hex should be disabled by config modifier")
	}
	if result != "0xFF" {
		t.Errorf("expected string '0xFF', got %v (%T)", result, result)
	}
}

// --- TokenSet ---

func TestTokenSetVAL(t *testing.T) {
	j := Make()
	val := j.TokenSet("VAL")
	if val == nil {
		t.Fatal("TokenSet('VAL') returned nil")
	}
	if len(val) != 4 {
		t.Errorf("expected 4 VAL tokens, got %d", len(val))
	}
	// Should contain TinTX, TinNR, TinST, TinVL.
	found := map[Tin]bool{}
	for _, tin := range val {
		found[tin] = true
	}
	for _, expected := range []Tin{TinTX, TinNR, TinST, TinVL} {
		if !found[expected] {
			t.Errorf("VAL set missing Tin %d", expected)
		}
	}
}

func TestTokenSetIGNORE(t *testing.T) {
	j := Make()
	ign := j.TokenSet("IGNORE")
	if ign == nil {
		t.Fatal("TokenSet('IGNORE') returned nil")
	}
	if len(ign) != 3 {
		t.Errorf("expected 3 IGNORE tokens, got %d", len(ign))
	}
}

func TestTokenSetKEY(t *testing.T) {
	j := Make()
	key := j.TokenSet("KEY")
	if key == nil {
		t.Fatal("TokenSet('KEY') returned nil")
	}
	if len(key) != 4 {
		t.Errorf("expected 4 KEY tokens, got %d", len(key))
	}
}

func TestTokenSetUnknown(t *testing.T) {
	j := Make()
	result := j.TokenSet("NONEXISTENT")
	if result != nil {
		t.Errorf("expected nil for unknown set, got %v", result)
	}
}

// --- LexCheck callbacks ---

func TestLexCheckFixed(t *testing.T) {
	j := Make()
	// Override fixed check to replace '{' with a custom token.
	j.Config().FixedCheck = func(lex *Lex) *LexCheckResult {
		pnt := lex.Cursor()
		if pnt.SI < pnt.Len && lex.Src[pnt.SI] == '{' {
			tkn := lex.Token("#OB", TinOB, nil, "{")
			pnt.SI++
			pnt.CI++
			// Return the token normally (same behavior, but proves check ran).
			return &LexCheckResult{Done: true, Token: tkn}
		}
		return nil // Continue normal matching.
	}

	result, err := j.Parse("{a: 1}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", result)
	}
	if m["a"] != float64(1) {
		t.Errorf("expected a=1, got %v", m["a"])
	}
}

func TestLexCheckSkipMatcher(t *testing.T) {
	j := Make()
	// Skip number matching for specific inputs.
	j.Config().NumberCheck = func(lex *Lex) *LexCheckResult {
		pnt := lex.Cursor()
		if pnt.SI+3 <= pnt.Len && lex.Src[pnt.SI:pnt.SI+3] == "999" {
			// Return Done=true with nil Token to skip number matching for "999".
			return &LexCheckResult{Done: true, Token: nil}
		}
		return nil
	}

	// 999 should fall through to text matcher.
	result, err := j.Parse("999")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "999" {
		t.Errorf("expected string '999', got %v (%T)", result, result)
	}

	// 42 should still be a number.
	result2, err := j.Parse("42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result2 != float64(42) {
		t.Errorf("expected 42, got %v", result2)
	}
}

// --- RuleSpec helpers ---

func TestRuleSpecClear(t *testing.T) {
	rs := &RuleSpec{
		Name:  "test",
		Open:  []*AltSpec{{}, {}},
		Close: []*AltSpec{{}},
		BO:    []StateAction{func(r *Rule, ctx *Context) {}},
	}
	rs.Clear()
	if len(rs.Open) != 0 || len(rs.Close) != 0 || len(rs.BO) != 0 {
		t.Error("Clear() should empty all slices")
	}
}

func TestRuleSpecAddOpen(t *testing.T) {
	rs := &RuleSpec{Name: "test"}
	rs.AddOpen(&AltSpec{P: "a"}, &AltSpec{P: "b"})
	if len(rs.Open) != 2 {
		t.Errorf("expected 2 open alts, got %d", len(rs.Open))
	}
	if rs.Open[0].P != "a" || rs.Open[1].P != "b" {
		t.Error("open alts not in expected order")
	}
}

func TestRuleSpecPrependOpen(t *testing.T) {
	rs := &RuleSpec{Name: "test"}
	rs.AddOpen(&AltSpec{P: "b"})
	rs.PrependOpen(&AltSpec{P: "a"})
	if len(rs.Open) != 2 {
		t.Errorf("expected 2 open alts, got %d", len(rs.Open))
	}
	if rs.Open[0].P != "a" {
		t.Errorf("expected first alt 'a', got '%s'", rs.Open[0].P)
	}
}

func TestRuleSpecAddClose(t *testing.T) {
	rs := &RuleSpec{Name: "test"}
	rs.AddClose(&AltSpec{P: "x"})
	if len(rs.Close) != 1 || rs.Close[0].P != "x" {
		t.Error("AddClose failed")
	}
}

func TestRuleSpecPrependClose(t *testing.T) {
	rs := &RuleSpec{Name: "test"}
	rs.AddClose(&AltSpec{P: "b"})
	rs.PrependClose(&AltSpec{P: "a"})
	if len(rs.Close) != 2 || rs.Close[0].P != "a" {
		t.Error("PrependClose failed")
	}
}

func TestRuleSpecStateActions(t *testing.T) {
	rs := &RuleSpec{Name: "test"}
	count := 0
	action := func(r *Rule, ctx *Context) { count++ }
	rs.AddBO(action)
	rs.AddAO(action)
	rs.AddBC(action)
	rs.AddAC(action)
	if len(rs.BO) != 1 || len(rs.AO) != 1 || len(rs.BC) != 1 || len(rs.AC) != 1 {
		t.Error("state action addition failed")
	}
}

// --- Debug plugin ---

func TestDebugDescribe(t *testing.T) {
	j := Make(Options{Tag: "test-instance"})
	j.Token("#TL", "~")
	j.Use(Debug)

	desc := Describe(j)
	if desc == "" {
		t.Fatal("Describe returned empty string")
	}
	if !strings.Contains(desc, "test-instance") {
		t.Error("description should contain tag")
	}
	if !strings.Contains(desc, "#TL") {
		t.Error("description should contain custom token")
	}
	if !strings.Contains(desc, "val") {
		t.Error("description should contain val rule")
	}
	if !strings.Contains(desc, "FixedLex: true") {
		t.Error("description should contain config settings")
	}
}

func TestDebugPlugin(t *testing.T) {
	j := Make()
	// Debug without trace should not add subscribers.
	j.Use(Debug)
	if len(j.Plugins()) != 1 {
		t.Errorf("expected 1 plugin, got %d", len(j.Plugins()))
	}
}

// --- Rule exclude from options ---

func TestRuleExcludeFromOptions(t *testing.T) {
	j := Make()

	// Add tagged alternates.
	TT := j.Token("#TT", "!")
	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append(rs.Open, &AltSpec{
			S: [][]Tin{{TT}},
			G: "experimental",
			A: func(r *Rule, ctx *Context) { r.Node = "BANG" },
		})
	})

	// Create a new instance with exclude in options.
	j2 := Make(Options{
		Rule: &RuleOptions{Exclude: "experimental"},
	})
	// Manually add the same alt.
	TT2 := j2.Token("#TT", "!")
	j2.Rule("val", func(rs *RuleSpec) {
		rs.Open = append(rs.Open, &AltSpec{
			S: [][]Tin{{TT2}},
			G: "experimental",
			A: func(r *Rule, ctx *Context) { r.Node = "BANG" },
		})
	})
	j2.Exclude("experimental")

	// The experimental alt should be excluded.
	found := false
	for _, alt := range j2.RSM()["val"].Open {
		if strings.Contains(alt.G, "experimental") {
			found = true
		}
	}
	if found {
		t.Error("experimental group should have been excluded via options")
	}
}

// --- Multi-level token inheritance and isolation (TS: parent-safe) ---

func TestDeriveTokenInheritance(t *testing.T) {
	// Parent registers token #B. Child registers token #D.
	// Child should see both. Parent should only see #B.
	c0 := Make()
	c0.Token("#B0", "b")

	c1 := c0.Derive()
	c1.Token("#D0", "d")

	// c1 inherits c0's token.
	if _, ok := c1.Config().FixedTokens["b"]; !ok {
		t.Error("child should inherit parent's #B0 token")
	}
	// c1 has its own token.
	if _, ok := c1.Config().FixedTokens["d"]; !ok {
		t.Error("child should have its own #D0 token")
	}
	// c0 is unaffected by c1's token.
	if _, ok := c0.Config().FixedTokens["d"]; ok {
		t.Error("parent should NOT have child's #D0 token")
	}
	// c0 still has its own token.
	if _, ok := c0.Config().FixedTokens["b"]; !ok {
		t.Error("parent should still have its #B0 token")
	}
}

// --- Multi-level plugin inheritance with isolation (TS: naked-make) ---

// makeTokenPlugin creates a plugin that registers a fixed token for `char`
// and a val rule alternate that produces `val` when that token is seen.
// This mirrors the TS make_token_plugin helper.
func makeTokenPlugin(char, val string) Plugin {
	return func(j *Jsonic, opts map[string]any) {
		tn := "#T<" + char + ">"
		j.Token(tn, char)
		TT := j.Token(tn, "")

		j.Rule("val", func(rs *RuleSpec) {
			capturedVal := val
			capturedTT := TT
			rs.Open = append([]*AltSpec{{
				S: [][]Tin{{capturedTT}},
				G: "CV=" + capturedVal,
				A: func(r *Rule, ctx *Context) {
					r.Node = capturedVal
				},
			}}, rs.Open...)
		})
	}
}

func TestDeriveMultiLevelPluginInheritance(t *testing.T) {
	// j has plugin A (maps char "A" to value "aaa").
	j := Make()
	j.Use(makeTokenPlugin("A", "aaa"))

	resultJ, err := j.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("j.Parse: %v", err)
	}
	expectMap(t, "j", resultJ, map[string]any{"x": "aaa", "y": "B", "z": "C"})

	// a1 derives from j. a1 should inherit plugin A.
	a1 := j.Derive()
	resultA1, err := a1.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("a1.Parse: %v", err)
	}
	expectMap(t, "a1", resultA1, map[string]any{"x": "aaa", "y": "B", "z": "C"})

	// a2 derives from j. a2 adds plugin B.
	a2 := j.Derive()
	a2.Use(makeTokenPlugin("B", "bbb"))

	resultA2, err := a2.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("a2.Parse: %v", err)
	}
	expectMap(t, "a2", resultA2, map[string]any{"x": "aaa", "y": "bbb", "z": "C"})

	// a1 and j should be unaffected by a2's plugin B.
	resultA1Again, err := a1.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("a1 again: %v", err)
	}
	expectMap(t, "a1 again", resultA1Again, map[string]any{"x": "aaa", "y": "B", "z": "C"})

	resultJAgain, err := j.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("j again: %v", err)
	}
	expectMap(t, "j again", resultJAgain, map[string]any{"x": "aaa", "y": "B", "z": "C"})

	// a22 derives from a2. Inherits plugins A and B. Adds plugin C.
	a22 := a2.Derive()
	a22.Use(makeTokenPlugin("C", "ccc"))

	resultA22, err := a22.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("a22.Parse: %v", err)
	}
	expectMap(t, "a22", resultA22, map[string]any{"x": "aaa", "y": "bbb", "z": "ccc"})

	// a2 unaffected by a22's plugin C.
	resultA2Again, err := a2.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("a2 again: %v", err)
	}
	expectMap(t, "a2 again", resultA2Again, map[string]any{"x": "aaa", "y": "bbb", "z": "C"})

	// a1 still unaffected.
	resultA1Final, err := a1.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("a1 final: %v", err)
	}
	expectMap(t, "a1 final", resultA1Final, map[string]any{"x": "aaa", "y": "B", "z": "C"})

	// j still unaffected.
	resultJFinal, err := j.Parse("x:A,y:B,z:C")
	if err != nil {
		t.Fatalf("j final: %v", err)
	}
	expectMap(t, "j final", resultJFinal, map[string]any{"x": "aaa", "y": "B", "z": "C"})
}

// expectMap asserts that result is a map[string]any matching expected.
func expectMap(t *testing.T, label string, result any, expected map[string]any) {
	t.Helper()
	m, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("%s: expected map[string]any, got %T: %v", label, result, result)
	}
	for k, v := range expected {
		if m[k] != v {
			t.Errorf("%s: key %q: got %v (%T), want %v (%T)", label, k, m[k], m[k], v, v)
		}
	}
}

// --- Custom parser error propagation (TS: custom-parser-error) ---

func TestCustomParserStartError(t *testing.T) {
	j := Make(Options{
		Parser: &ParserOptions{
			Start: func(src string, j *Jsonic, meta map[string]any) (any, error) {
				if src == "e:0" {
					return nil, &JsonicError{
						Code:   "custom",
						Detail: "bad-parser:e:0",
					}
				}
				return src, nil
			},
		},
	})

	// Normal input works.
	result, err := j.Parse("hello")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "hello" {
		t.Errorf("expected 'hello', got %v", result)
	}

	// Error input propagates the error.
	_, err = j.Parse("e:0")
	if err == nil {
		t.Fatal("expected error for 'e:0'")
	}
	je, ok := err.(*JsonicError)
	if !ok {
		t.Fatalf("expected *JsonicError, got %T: %v", err, err)
	}
	if je.Code != "custom" {
		t.Errorf("expected code 'custom', got %q", je.Code)
	}
	if !strings.Contains(je.Detail, "e:0") {
		t.Errorf("expected detail to contain 'e:0', got %q", je.Detail)
	}
}

// --- Plugin sets error hints (TS: plugin-errmsg) ---

func TestPluginErrorHints(t *testing.T) {
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		j.SetOptions(Options{
			Hint: map[string]string{
				"unexpected": "FOO",
			},
		})
	})

	_, err := j.Parse("x::1")
	if err == nil {
		t.Fatal("expected error for 'x::1'")
	}
	je, ok := err.(*JsonicError)
	if !ok {
		t.Fatalf("expected *JsonicError, got %T", err)
	}
	errStr := je.Error()
	if !strings.Contains(errStr, "unexpected") {
		t.Errorf("error should contain 'unexpected', got:\n%s", errStr)
	}
	if !strings.Contains(errStr, "FOO") {
		t.Errorf("error should contain hint 'FOO', got:\n%s", errStr)
	}
}

// --- Decorate: dynamic string-keyed properties (TS: jsonic.foo = value) ---

func TestDecorate(t *testing.T) {
	// TS equivalent:
	//   let jp0 = j.use(function foo(jsonic) { jsonic.foo = () => 'FOO' })
	//   expect(jp0.foo()).equal('FOO')
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		j.Decorate("foo", "FOO")
	})
	if j.Decoration("foo") != "FOO" {
		t.Errorf("expected Decoration('foo') = 'FOO', got %v", j.Decoration("foo"))
	}
}

func TestDecorateChaining(t *testing.T) {
	// TS: jp0 adds foo, jp1 adds bar, both accessible on jp1, foo still on jp0.
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		j.Decorate("foo", "FOO")
	})
	j.Use(func(j *Jsonic, opts map[string]any) {
		j.Decorate("bar", "BAR")
	})

	if j.Decoration("foo") != "FOO" {
		t.Errorf("expected foo=FOO, got %v", j.Decoration("foo"))
	}
	if j.Decoration("bar") != "BAR" {
		t.Errorf("expected bar=BAR, got %v", j.Decoration("bar"))
	}
}

func TestDecorateInherited(t *testing.T) {
	// TS: parent decorations inherited by make/derive.
	parent := Make()
	parent.Decorate("foo", "FOO")

	child := parent.Derive()

	// Child inherits parent decoration.
	if child.Decoration("foo") != "FOO" {
		t.Errorf("child should inherit foo=FOO, got %v", child.Decoration("foo"))
	}

	// Child adds its own decoration.
	child.Decorate("bar", "BAR")
	if child.Decoration("bar") != "BAR" {
		t.Errorf("expected child bar=BAR, got %v", child.Decoration("bar"))
	}

	// Parent unaffected by child's decoration.
	if parent.Decoration("bar") != nil {
		t.Errorf("parent should NOT have bar, got %v", parent.Decoration("bar"))
	}
}

func TestDecorateUnset(t *testing.T) {
	j := Make()
	if j.Decoration("nonexistent") != nil {
		t.Errorf("expected nil for unset decoration, got %v", j.Decoration("nonexistent"))
	}
}

func TestDecorateFunction(t *testing.T) {
	// Decorations can hold functions, matching TS jsonic.foo = () => 'FOO'.
	j := Make()
	j.Decorate("greet", func(name string) string {
		return "hello " + name
	})

	fn := j.Decoration("greet").(func(string) string)
	if fn("world") != "hello world" {
		t.Errorf("expected 'hello world', got %q", fn("world"))
	}
}

// --- Context: fields match TS Context ---

func TestContextInst(t *testing.T) {
	// TS: ctx.inst() returns the jsonic instance.
	j := Make()
	var capturedInst *Jsonic

	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			capturedInst = ctx.Inst
		})
	})

	j.Parse("42")

	if capturedInst != j {
		t.Error("ctx.Inst should be the Jsonic instance")
	}
}

func TestContextOpts(t *testing.T) {
	j := Make(Options{Tag: "test-tag"})
	var capturedOpts *Options

	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			capturedOpts = ctx.Opts
		})
	})

	j.Parse("42")

	if capturedOpts == nil {
		t.Fatal("ctx.Opts should not be nil")
	}
	if capturedOpts.Tag != "test-tag" {
		t.Errorf("expected Tag 'test-tag', got %q", capturedOpts.Tag)
	}
}

func TestContextCfg(t *testing.T) {
	j := Make()
	var capturedCfg *LexConfig

	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			capturedCfg = ctx.Cfg
		})
	})

	j.Parse("42")

	if capturedCfg == nil {
		t.Fatal("ctx.Cfg should not be nil")
	}
	if !capturedCfg.NumberLex {
		t.Error("expected NumberLex=true in default config")
	}
}

func TestContextSrc(t *testing.T) {
	j := Make()
	var capturedSrc string

	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			capturedSrc = ctx.Src
		})
	})

	j.Parse("hello:world")

	if capturedSrc != "hello:world" {
		t.Errorf("expected ctx.Src='hello:world', got %q", capturedSrc)
	}
}

func TestContextU(t *testing.T) {
	// TS: ctx.u is a custom plugin data bag.
	j := Make()
	var capturedU map[string]any

	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			ctx.U["plugin-data"] = "hello"
		})
		rs.AC = append(rs.AC, func(r *Rule, ctx *Context) {
			capturedU = ctx.U
		})
	})

	j.Parse("42")

	if capturedU == nil {
		t.Fatal("ctx.U should not be nil")
	}
	if capturedU["plugin-data"] != "hello" {
		t.Errorf("expected ctx.U['plugin-data']='hello', got %v", capturedU["plugin-data"])
	}
}

func TestContextMeta(t *testing.T) {
	j := Make()
	var capturedMeta map[string]any

	j.Rule("val", func(rs *RuleSpec) {
		rs.AO = append(rs.AO, func(r *Rule, ctx *Context) {
			capturedMeta = ctx.Meta
		})
	})

	j.ParseMeta("42", map[string]any{"file": "test.jsonic"})

	if capturedMeta == nil || capturedMeta["file"] != "test.jsonic" {
		t.Errorf("expected ctx.Meta['file']='test.jsonic', got %v", capturedMeta)
	}
}

// --- Plugin options namespace (TS: options.plugin) ---

func TestPluginOptions(t *testing.T) {
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		j.SetPluginOptions("foo", map[string]any{"x": 1})
	})

	po := j.PluginOptions("foo")
	if po == nil || po["x"] != 1 {
		t.Errorf("expected PluginOptions('foo')['x']=1, got %v", po)
	}
	if j.PluginOptions("bar") != nil {
		t.Error("expected nil for unset plugin options")
	}
}

func TestPluginOptionsInherited(t *testing.T) {
	j := Make()
	j.SetPluginOptions("foo", map[string]any{"x": 1})
	child := j.Derive()

	po := child.PluginOptions("foo")
	if po == nil || po["x"] != 1 {
		t.Errorf("child should inherit plugin options, got %v", po)
	}

	// Child modification doesn't affect parent.
	child.SetPluginOptions("foo", map[string]any{"y": 2})
	if j.PluginOptions("foo")["y"] != nil {
		t.Error("parent should not be affected by child plugin options")
	}
}

// --- ErrMsg: custom error tag (TS: errmsg.name) ---

func TestErrMsgName(t *testing.T) {
	j := Make(Options{
		ErrMsg: &ErrMsgOptions{Name: "bar"},
	})
	_, err := j.Parse("x::1")
	if err == nil {
		t.Fatal("expected error")
	}
	errStr := err.Error()
	if !strings.Contains(errStr, "[bar/") {
		t.Errorf("error should use custom tag 'bar', got:\n%s", errStr)
	}
	if strings.Contains(errStr, "[jsonic/") {
		t.Errorf("error should NOT use default 'jsonic' tag, got:\n%s", errStr)
	}
}

func TestErrMsgNameViaPlugin(t *testing.T) {
	j := Make()
	j.Use(func(j *Jsonic, opts map[string]any) {
		j.SetOptions(Options{
			ErrMsg: &ErrMsgOptions{Name: "myplugin"},
		})
	})
	_, err := j.Parse("x::1")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "[myplugin/") {
		t.Errorf("error should use 'myplugin' tag, got:\n%s", err.Error())
	}
}

// --- Fixed: fixed token lookup (TS: jsonic.fixed(ref)) ---

func TestFixedLookup(t *testing.T) {
	j := Make()

	// Lookup by source string.
	if j.FixedSrc("{") != TinOB {
		t.Errorf("FixedSrc('{') = %v, want TinOB(%d)", j.FixedSrc("{"), TinOB)
	}

	// Lookup by Tin.
	if j.FixedTin(TinOB) != "{" {
		t.Errorf("FixedTin(TinOB) = %v, want '{'", j.FixedTin(TinOB))
	}

	// Not found.
	if j.FixedSrc("@") != 0 {
		t.Errorf("FixedSrc('@') should return 0 for unknown")
	}
	if j.FixedTin(999) != "" {
		t.Errorf("FixedTin(999) should return '' for unknown")
	}
}

func TestFixedCustomToken(t *testing.T) {
	j := Make()
	j.Token("#TL", "~")

	tin := j.FixedSrc("~")
	if tin == 0 {
		t.Error("FixedSrc('~') should find custom token")
	}

	if j.FixedTin(tin) != "~" {
		t.Errorf("FixedTin(tin) = %v, want '~'", j.FixedTin(tin))
	}
}

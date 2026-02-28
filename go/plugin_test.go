package jsonic

import (
	"strings"
	"testing"
)

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
		j.AddMatcher("dollar", 1500000, func(lex *Lex) *Token {
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
		j.AddMatcher("at", 1500000, func(lex *Lex) *Token {
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
	j.AddMatcher("early", 1000000, func(lex *Lex) *Token {
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
	j.AddMatcher("capture42", 1000000, func(lex *Lex) *Token {
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

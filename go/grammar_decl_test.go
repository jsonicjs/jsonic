package jsonic

import (
	"reflect"
	"regexp"
	"strings"
	"testing"
)

// mustGrammar calls Grammar and fails the test on error.
func mustGrammar(t *testing.T, j *Jsonic, gs *GrammarSpec) {
	t.Helper()
	if err := j.Grammar(gs); err != nil {
		t.Fatal(err)
	}
}

// --- Skip sentinel ---

func TestSkipSentinel(t *testing.T) {
	if !IsSkip(Skip) {
		t.Error("IsSkip(Skip) should be true")
	}
	if IsSkip(nil) {
		t.Error("IsSkip(nil) should be false")
	}
	if IsSkip("@SKIP") {
		t.Error("IsSkip(string) should be false")
	}
}

func TestSkipInDeepMerge(t *testing.T) {
	base := map[string]any{"a": 1, "b": 2}
	over := map[string]any{"a": Skip, "b": 3}
	result := Deep(base, over).(map[string]any)

	if result["a"] != 1 {
		t.Errorf("Skip should preserve base: got a=%v", result["a"])
	}
	if result["b"] != 3 {
		t.Errorf("non-Skip should overwrite: got b=%v", result["b"])
	}
}

func TestSkipInDeepMergeArray(t *testing.T) {
	base := []any{"x", "y", "z"}
	over := []any{Skip, Skip, "w"}
	result := Deep(base, over).([]any)

	if result[0] != "x" || result[1] != "y" || result[2] != "w" {
		t.Errorf("expected [x y w], got %v", result)
	}
}

// --- ResolveFuncRefs ---

func TestResolveFuncRefsAtEscape(t *testing.T) {
	result := ResolveFuncRefs("@@myTag", nil)
	if result != "@myTag" {
		t.Errorf("expected @myTag, got %v", result)
	}
}

func TestResolveFuncRefsAtSkip(t *testing.T) {
	result := ResolveFuncRefs("@SKIP", nil)
	if !IsSkip(result) {
		t.Errorf("expected Skip sentinel, got %v", result)
	}
}

func TestResolveFuncRefsRegex(t *testing.T) {
	result := ResolveFuncRefs("@/^foo$/i", nil)
	re, ok := result.(*regexp.Regexp)
	if !ok {
		t.Fatalf("expected *regexp.Regexp, got %T", result)
	}
	if !re.MatchString("FOO") {
		t.Error("regex should match FOO (case insensitive)")
	}
	if re.MatchString("bar") {
		t.Error("regex should not match bar")
	}
}

func TestResolveFuncRefsRegexNoFlags(t *testing.T) {
	result := ResolveFuncRefs("@/^test$/", nil)
	re, ok := result.(*regexp.Regexp)
	if !ok {
		t.Fatalf("expected *regexp.Regexp, got %T", result)
	}
	if !re.MatchString("test") {
		t.Error("regex should match test")
	}
	if re.MatchString("TEST") {
		t.Error("regex without flags should not match TEST")
	}
}

func TestResolveFuncRefsFuncLookup(t *testing.T) {
	ref := map[FuncRef]any{
		"@myFunc": "hello",
	}
	result := ResolveFuncRefs("@myFunc", ref)
	if result != "hello" {
		t.Errorf("expected hello, got %v", result)
	}
}

func TestResolveFuncRefsNestedMap(t *testing.T) {
	ref := map[FuncRef]any{
		"@fn": "resolved",
	}
	input := map[string]any{
		"a": "@fn",
		"b": "@@literal",
		"c": "@SKIP",
		"d": map[string]any{"nested": "@fn"},
	}
	result := ResolveFuncRefs(input, ref).(map[string]any)

	if result["a"] != "resolved" {
		t.Errorf("a: expected resolved, got %v", result["a"])
	}
	if result["b"] != "@literal" {
		t.Errorf("b: expected @literal, got %v", result["b"])
	}
	if !IsSkip(result["c"]) {
		t.Errorf("c: expected Skip, got %v", result["c"])
	}
	nested := result["d"].(map[string]any)
	if nested["nested"] != "resolved" {
		t.Errorf("d.nested: expected resolved, got %v", nested["nested"])
	}
}

func TestResolveFuncRefsArray(t *testing.T) {
	ref := map[FuncRef]any{"@fn": 42}
	input := []any{"@fn", "@SKIP", "@@at"}
	result := ResolveFuncRefs(input, ref).([]any)

	if result[0] != 42 {
		t.Errorf("[0]: expected 42, got %v", result[0])
	}
	if !IsSkip(result[1]) {
		t.Errorf("[1]: expected Skip, got %v", result[1])
	}
	if result[2] != "@at" {
		t.Errorf("[2]: expected @at, got %v", result[2])
	}
}

// --- Grammar() method: options ---

func TestGrammarOptionsValueDef(t *testing.T) {
	j := Make()
	yes := true
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Value: &ValueOptions{
				Lex: &yes,
				Def: map[string]*ValueDef{
					"yes": {Val: true},
					"no":  {Val: false},
				},
			},
		},
	})

	result, err := j.Parse("a:yes,b:no,c:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true || m["b"] != false {
		t.Errorf("expected a:true, b:false, got %v", m)
	}
}

func TestGrammarOptionsNumberHex(t *testing.T) {
	j := Make()
	yes := true
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Number: &NumberOptions{Hex: &yes},
		},
	})

	result, err := j.Parse("a:0xFF")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(255) {
		t.Errorf("expected a:255, got %v", m["a"])
	}
}

func TestGrammarOptionsNumberSep(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Number: &NumberOptions{Sep: "_"},
		},
	})

	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1000) {
		t.Errorf("expected a:1000, got %v", m["a"])
	}
}

// --- Grammar() method: rules ---

func TestGrammarRuleConditionFuncRef(t *testing.T) {
	j := Make()
	condCalls := 0

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@topOnly": AltCond(func(r *Rule, ctx *Context) bool {
				condCalls++
				return r.D == 0
			}),
			"@wrapArr": AltAction(func(r *Rule, ctx *Context) {
				r.Node = []any{r.Node}
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{C: "@topOnly", A: "@wrapArr", G: "custom"},
				},
			},
		},
	})

	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	arr, ok := result.([]any)
	if !ok {
		t.Fatalf("expected []any, got %T: %v", result, result)
	}
	inner, ok := arr[0].(map[string]any)
	if !ok || inner["a"] != float64(1) {
		t.Errorf("expected [{a:1}], got %v", result)
	}
	if condCalls == 0 {
		t.Error("condition function was not called")
	}
}

func TestGrammarRuleConditionFalseSkips(t *testing.T) {
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@never": AltCond(func(r *Rule, ctx *Context) bool {
				return false
			}),
			"@boom": AltAction(func(r *Rule, ctx *Context) {
				panic("should not fire")
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{C: "@never", A: "@boom", G: "custom"},
				},
			},
		},
	})

	// The @boom action never fires because @never blocks the alt.
	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected {a:1}, got %v", result)
	}
}

func TestGrammarOptionsAndRulesCombined(t *testing.T) {
	j := Make()
	yes := true

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@upper": AltAction(func(r *Rule, ctx *Context) {
				if s, ok := r.Node.(string); ok {
					r.Node = s + "!"
				}
			}),
		},
		Options: &Options{
			Value: &ValueOptions{
				Lex: &yes,
				Def: map[string]*ValueDef{
					"on":  {Val: true},
					"off": {Val: false},
				},
			},
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{A: "@upper", G: "custom"},
				},
			},
		},
	})

	result, err := j.Parse("a:on")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
}

func TestGrammarMultipleCalls(t *testing.T) {
	j := Make()
	yes := true

	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Value: &ValueOptions{
				Lex: &yes,
				Def: map[string]*ValueDef{
					"yes": {Val: true},
				},
			},
		},
	})

	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Value: &ValueOptions{
				Lex: &yes,
				Def: map[string]*ValueDef{
					"no": {Val: false},
				},
			},
		},
	})

	result, err := j.Parse("a:yes,b:no")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true || m["b"] != false {
		t.Errorf("expected a:true, b:false, got %v", m)
	}
}

func TestGrammarOptionsOnly(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Number: &NumberOptions{Sep: "_"},
		},
	})

	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1000) {
		t.Errorf("expected 1000, got %v", m["a"])
	}
}

func TestGrammarRulesOnly(t *testing.T) {
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@tag": AltAction(func(r *Rule, ctx *Context) {
				if s, ok := r.Node.(string); ok {
					r.Node = "<" + s + ">"
				}
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{A: "@tag", G: "custom"},
				},
			},
		},
	})

	result, err := j.Parse("a:hello")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "<hello>" {
		t.Errorf("expected <hello>, got %v", m["a"])
	}
}

// --- Token string resolution ---

func TestResolveTokenSpecStatic(t *testing.T) {
	tests := []struct {
		input string
		want  [][]Tin
	}{
		{"#OB", [][]Tin{{TinOB}}},
		{"#ZZ", [][]Tin{{TinZZ}}},
		{"#OB #CB", [][]Tin{{TinOB}, {TinCB}}},
		{"#KEY #CL", [][]Tin{TinSetKEY, {TinCL}}},
		{"#VAL", [][]Tin{TinSetVAL}},
	}

	for _, tt := range tests {
		got := resolveTokenSpecStatic(tt.input)
		if !reflect.DeepEqual(got, tt.want) {
			t.Errorf("resolveTokenSpecStatic(%q) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

func TestResolveTokenFieldStaticSlice(t *testing.T) {
	// []string form: each element is a slot, space-separated names are alternatives.
	tests := []struct {
		input []string
		want  [][]Tin
	}{
		// Single slot with two alternatives: CB or CS
		{[]string{"#CB #CS"}, [][]Tin{{TinCB, TinCS}}},
		// Two slots: CA in slot 0, CS or ZZ in slot 1
		{[]string{"#CA", "#CS #ZZ"}, [][]Tin{{TinCA}, {TinCS, TinZZ}}},
		// Single slot with token set + individual tokens
		{[]string{"#CA #CS #VAL"}, [][]Tin{{TinCA, TinCS, TinTX, TinNR, TinST, TinVL}}},
		// Single token in single slot (equivalent to string form)
		{[]string{"#OB"}, [][]Tin{{TinOB}}},
	}

	for _, tt := range tests {
		got := resolveTokenFieldStatic(tt.input)
		if !reflect.DeepEqual(got, tt.want) {
			t.Errorf("resolveTokenFieldStatic(%v) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

// --- State action wiring ---

func TestGrammarStateActionWiring(t *testing.T) {
	j := Make()
	boCalled := false

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@val-bo": StateAction(func(r *Rule, ctx *Context) {
				boCalled = true
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {}, // Trigger rule processing to wire @val-bo
		},
	})

	_, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	if !boCalled {
		t.Error("@val-bo state action was not called")
	}
}

// --- Declarative conditions in grammar ---

func TestGrammarDeclarativeCondition(t *testing.T) {
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@mark": AltAction(func(r *Rule, ctx *Context) {
				r.Node = "marked"
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					// Only fire at depth 0 using declarative condition.
					{C: map[string]any{"d": 0}, A: "@mark", G: "custom"},
				},
			},
		},
	})

	result, err := j.Parse("hello")
	if err != nil {
		t.Fatal(err)
	}
	if result != "marked" {
		t.Errorf("expected marked, got %v", result)
	}
}

// --- Fixed tokens via Grammar ---

func TestGrammarFixedToken(t *testing.T) {
	j := Make()

	// Register a custom fixed token via the instance API.
	arrow := j.Token("#ARROW", "=>")

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@arrowAction": AltAction(func(r *Rule, ctx *Context) {
				r.Node = "<arrow>"
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Open: []*GrammarAltSpec{
					{S: "#ARROW", A: "@arrowAction"},
				},
			},
		},
	})

	_ = arrow // token registered above

	result, err := j.Parse("a:=>")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "<arrow>" {
		t.Errorf("expected <arrow>, got %v", m["a"])
	}
}

// --- Parity fix: missing FuncRef returns error ---

func TestGrammarMissingFuncRefReturnsError(t *testing.T) {
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Ref: map[FuncRef]any{},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{A: "@missing", G: "custom"},
				},
			},
		},
	})
	if err == nil {
		t.Fatal("expected error for missing FuncRef, got nil")
	}
	if !strings.Contains(err.Error(), "@missing") {
		t.Errorf("error should mention @missing, got: %s", err)
	}
}

// --- Parity fix: inject modifiers ---

func TestGrammarInjectAppend(t *testing.T) {
	// With Append: true, new alts go after existing ones.
	j := Make()
	origCloseLen := len(j.RSM()["val"].Close)

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@noop": AltAction(func(r *Rule, ctx *Context) {}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: &GrammarAltListSpec{
					Alts: []*GrammarAltSpec{
						{S: "#ZZ", A: "@noop", G: "appended"},
					},
					Inject: &GrammarInjectSpec{Append: true},
				},
			},
		},
	})

	valClose := j.RSM()["val"].Close
	// The appended alt should be at the end.
	last := valClose[len(valClose)-1]
	if last.G != "appended" {
		t.Errorf("expected last alt group=appended, got %q", last.G)
	}
	if len(valClose) != origCloseLen+1 {
		t.Errorf("expected %d close alts, got %d", origCloseLen+1, len(valClose))
	}
}

func TestGrammarInjectPrepend(t *testing.T) {
	// Default (no inject or Append:false) prepends new alts before existing ones.
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@noop": AltAction(func(r *Rule, ctx *Context) {}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", A: "@noop", G: "first"},
				},
			},
		},
	})

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@noop2": AltAction(func(r *Rule, ctx *Context) {}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", A: "@noop2", G: "second"},
				},
			},
		},
	})

	valClose := j.RSM()["val"].Close
	// Second prepend goes before first prepend.
	if valClose[0].G != "second" {
		t.Errorf("expected first alt group=second, got %q", valClose[0].G)
	}
	if valClose[1].G != "first" {
		t.Errorf("expected second alt group=first, got %q", valClose[1].G)
	}
}

// --- Parity fix: OptionsMap with FuncRef resolution ---

func TestGrammarOptionsMapMerge(t *testing.T) {
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@addMerge": func(prev, curr any, r *Rule, ctx *Context) any {
				pf, pok := prev.(float64)
				cf, cok := curr.(float64)
				if pok && cok {
					return pf + cf
				}
				return curr
			},
		},
		OptionsMap: map[string]any{
			"map": map[string]any{
				"merge": "@addMerge",
			},
		},
	})

	result, err := j.Parse("a:1,a:2")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(3) {
		t.Errorf("expected a:3, got %v", m["a"])
	}
}

func TestGrammarOptionsMapValueDef(t *testing.T) {
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"value": map[string]any{
				"lex": true,
				"def": map[string]any{
					"yes": map[string]any{"val": true},
					"no":  map[string]any{"val": false},
				},
			},
		},
	})

	result, err := j.Parse("a:yes,b:no")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true || m["b"] != false {
		t.Errorf("expected a:true b:false, got %v", m)
	}
}

func TestGrammarOptionsMapSkip(t *testing.T) {
	j := Make()

	// First: set tag
	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"tag": "original",
		},
	})
	if j.Options().Tag != "original" {
		t.Fatalf("expected tag=original, got %v", j.Options().Tag)
	}

	// Second: @SKIP preserves existing tag
	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"tag": "@SKIP",
		},
	})
	if j.Options().Tag != "original" {
		t.Errorf("expected tag=original (preserved by @SKIP), got %v", j.Options().Tag)
	}
}

func TestGrammarOptionsMapAtEscape(t *testing.T) {
	j := Make()

	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"tag": "@@literal-at",
		},
	})
	if j.Options().Tag != "@literal-at" {
		t.Errorf("expected @literal-at, got %v", j.Options().Tag)
	}
}

// --- SetOptions preserves rule modifications (clone/inherit parity) ---

func TestSetOptionsPreservesRuleModifications(t *testing.T) {
	// In TS, j.rule() then j.options() preserves the rule modification.
	// This test verifies Go matches that behavior.
	j := Make()

	// Add a custom close alt to val via Rule().
	tagged := false
	j.Rule("val", func(rs *RuleSpec) {
		rs.Close = append([]*AltSpec{{
			A: func(r *Rule, ctx *Context) { tagged = true },
			G: "custom-tag",
		}}, rs.Close...)
	})

	// Now call SetOptions — this must NOT destroy the rule modification.
	yes := true
	j.SetOptions(Options{
		Number: &NumberOptions{Hex: &yes},
	})

	// The custom alt should still be in val.Close.
	valClose := j.RSM()["val"].Close
	found := false
	for _, alt := range valClose {
		if alt.G == "custom-tag" {
			found = true
			break
		}
	}
	if !found {
		t.Error("rule modification lost after SetOptions — val.Close missing custom-tag alt")
	}

	// Parse should work and trigger the custom action.
	_, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	if !tagged {
		t.Error("custom action did not fire after SetOptions")
	}
}

func TestSetOptionsPreservesGrammarModifications(t *testing.T) {
	// Grammar() then SetOptions() should preserve the grammar modifications.
	j := Make()

	marked := false
	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@mark": AltAction(func(r *Rule, ctx *Context) {
				marked = true
			}),
		},
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{A: "@mark", G: "grammar-mod"},
				},
			},
		},
	})

	// SetOptions after Grammar should NOT destroy the grammar modification.
	sep := "_"
	j.SetOptions(Options{
		Number: &NumberOptions{Sep: sep},
	})

	_, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	if !marked {
		t.Error("grammar modification lost after SetOptions")
	}
}

func TestRuleThenOptionsThenParse(t *testing.T) {
	// The exact pattern from the user report: Rule() before Options().
	j := Make()

	customVal := ""
	j.Rule("val", func(rs *RuleSpec) {
		rs.Close = append([]*AltSpec{{
			A: func(r *Rule, ctx *Context) {
				if s, ok := r.Node.(string); ok {
					customVal = s
				}
			},
			G: "plugin-mod",
		}}, rs.Close...)
	})

	// Options change after rule modification — must not lose the modification.
	yes := true
	j.SetOptions(Options{
		Value: &ValueOptions{
			Lex: &yes,
			Def: map[string]*ValueDef{
				"yes": {Val: true},
			},
		},
	})

	result, err := j.Parse("a:hello")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "hello" {
		t.Errorf("expected a:hello, got %v", m)
	}
	if customVal != "hello" {
		t.Errorf("custom rule action should have captured hello, got %q", customVal)
	}
}

// === Regexp support tests (parity with TS grammar.test.js) ===

// TestGrammarRegexNumberExclude mirrors TS "options-regex-number-exclude".
// Uses @/…/ in OptionsMap to specify a RegExp for number.exclude.
// Uses ^0[0-9]+$ which correctly matches leading-zero numbers like "01".
func TestGrammarRegexNumberExclude(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"number": map[string]any{
				"exclude": "@/^0[0-9]+$/",
			},
		},
	})

	result, err := j.Parse("a:0")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(0) {
		t.Errorf("expected a:0, got %v", m["a"])
	}

	result, err = j.Parse("a:01")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != "01" {
		t.Errorf("expected a:'01' (text), got %v (%T)", m["a"], m["a"])
	}

	result, err = j.Parse("a:123")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != float64(123) {
		t.Errorf("expected a:123, got %v", m["a"])
	}
}

// TestGrammarRegexNumberExcludeTyped tests number.exclude with a *regexp.Regexp
// via the typed Options API (not OptionsMap).
func TestGrammarRegexNumberExcludeTyped(t *testing.T) {
	re := regexp.MustCompile(`^0[0-9]+$`)
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Number: &NumberOptions{
				Exclude: func(s string) bool {
					return re.MatchString(s)
				},
			},
		},
	})

	result, err := j.Parse("a:01")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "01" {
		t.Errorf("expected a:'01' (text), got %v (%T)", m["a"], m["a"])
	}
}

// TestGrammarRegexValueMatch mirrors TS "options-regex-value-match".
// Uses @/…/ in value.def with a FuncRef val for regex-matched values.
func TestGrammarRegexValueMatch(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@valOn":  func(match []string) any { return true },
			"@valOff": func(match []string) any { return false },
		},
		OptionsMap: map[string]any{
			"value": map[string]any{
				"def": map[string]any{
					"on":  map[string]any{"val": "@valOn", "match": "@/^on$/i"},
					"off": map[string]any{"val": "@valOff", "match": "@/^off$/i"},
				},
			},
		},
	})

	result, err := j.Parse("a:ON,b:Off,c:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v", m["b"])
	}
	if m["c"] != float64(1) {
		t.Errorf("expected c:1, got %v", m["c"])
	}

	result, err = j.Parse("a:on,b:OFF")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v", m["b"])
	}
}

// TestGrammarRegexValueMatchTyped tests value.def Match via typed API.
func TestGrammarRegexValueMatchTyped(t *testing.T) {
	j := Make()
	lex := true
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Value: &ValueOptions{
				Lex: &lex,
				Def: map[string]*ValueDef{
					"on": {
						Match:   regexp.MustCompile(`(?i)^on$`),
						ValFunc: func(m []string) any { return true },
					},
					"off": {
						Match:   regexp.MustCompile(`(?i)^off$`),
						ValFunc: func(m []string) any { return false },
					},
				},
			},
		},
	})

	result, err := j.Parse("a:ON,b:Off")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v", m["b"])
	}
}

// TestGrammarRegexWithFlags mirrors TS "options-regex-with-flags".
func TestGrammarRegexWithFlags(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@valYes": func(match []string) any { return "YES!" },
		},
		OptionsMap: map[string]any{
			"value": map[string]any{
				"def": map[string]any{
					"yes": map[string]any{"val": "@valYes", "match": "@/^yes$/i"},
				},
			},
		},
	})

	// The /i flag makes it case-insensitive.
	result, err := j.Parse("a:YES")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "YES!" {
		t.Errorf("expected a:YES!, got %v", m["a"])
	}

	result, err = j.Parse("a:Yes")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != "YES!" {
		t.Errorf("expected a:YES!, got %v", m["a"])
	}

	result, err = j.Parse("a:yes")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != "YES!" {
		t.Errorf("expected a:YES!, got %v", m["a"])
	}
}

// TestGrammarRegexNoFlags mirrors TS "options-regex-no-flags".
func TestGrammarRegexNoFlags(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"number": map[string]any{
				"exclude": "@/^0[0-9]+$/",
			},
		},
	})

	result, err := j.Parse("a:0")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(0) {
		t.Errorf("expected a:0, got %v", m["a"])
	}

	result, err = j.Parse("a:42")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != float64(42) {
		t.Errorf("expected a:42, got %v", m["a"])
	}

	result, err = j.Parse("a:01")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != "01" {
		t.Errorf("expected a:'01' (text), got %v (%T)", m["a"], m["a"])
	}
}

// TestGrammarRegexMixedWithFuncref mirrors TS "options-regex-mixed-with-funcref".
func TestGrammarRegexMixedWithFuncref(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@prepend": func(prev, curr any, r *Rule, ctx *Context) any {
				ps, pok := prev.(string)
				cs, cok := curr.(string)
				if pok && cok {
					return ps + cs
				}
				return curr
			},
		},
		OptionsMap: map[string]any{
			"map": map[string]any{
				"merge": "@prepend",
			},
			"number": map[string]any{
				"exclude": "@/^0[0-9]+$/",
			},
		},
	})

	// FuncRef merge: duplicate keys concatenate.
	result, err := j.Parse("a:x,a:y")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "xy" {
		t.Errorf("expected a:xy, got %v", m["a"])
	}

	// RegExp exclude: leading-zero numbers become text.
	result, err = j.Parse("a:007")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != "007" {
		t.Errorf("expected a:'007' (text), got %v (%T)", m["a"], m["a"])
	}

	result, err = j.Parse("a:42")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != float64(42) {
		t.Errorf("expected a:42, got %v", m["a"])
	}
}

// TestGrammarRegexInArray mirrors TS "options-regex-in-array".
// @/…/ resolution should work inside arrays (ResolveFuncRefs recurses into slices).
func TestGrammarRegexInArray(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@valT": func(match []string) any { return true },
			"@valF": func(match []string) any { return false },
		},
		OptionsMap: map[string]any{
			"value": map[string]any{
				"def": map[string]any{
					"t": map[string]any{"val": "@valT", "match": "@/^t$/i"},
					"f": map[string]any{"val": "@valF", "match": "@/^f$/i"},
				},
			},
		},
	})

	result, err := j.Parse("[T, F, 1]")
	if err != nil {
		t.Fatal(err)
	}
	arr := result.([]any)
	if len(arr) != 3 {
		t.Fatalf("expected 3 elements, got %d", len(arr))
	}
	if arr[0] != true {
		t.Errorf("expected [0]=true, got %v", arr[0])
	}
	if arr[1] != false {
		t.Errorf("expected [1]=false, got %v", arr[1])
	}
	if arr[2] != float64(1) {
		t.Errorf("expected [2]=1, got %v", arr[2])
	}
}

// TestGrammarRegexEscapeAtPrefix mirrors TS "options-escape-at-regex-like".
// @@ prevents @/…/ from being interpreted as a regex.
func TestGrammarRegexEscapeAtPrefix(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"tag": "@@/not-a-regex/",
		},
	})

	if j.Options().Tag != "@/not-a-regex/" {
		t.Errorf("expected @/not-a-regex/, got %v", j.Options().Tag)
	}
}

// TestGrammarRegexMatchToken mirrors TS "options-regex-match-token".
// Uses @/…/ to specify a RegExp for a custom match token.
func TestGrammarRegexMatchToken(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		OptionsMap: map[string]any{
			"match": map[string]any{
				"token": map[string]any{
					"#ID": "@/^[a-zA-Z_][a-zA-Z_0-9]*/",
				},
			},
			"tokenSet": map[string]any{
				"KEY": []any{"#ST", "#ID"},
				"VAL": []any{"#TX", "#NR", "#ST", "#VL", "#ID"},
			},
		},
	})

	// 'a' matches #ID and #ID is in KEY, so a:1 parses as a pair.
	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}

	result, err = j.Parse("foo:bar")
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["foo"] != "bar" {
		t.Errorf("expected foo:bar, got %v", m["foo"])
	}
}

// TestGrammarRegexMatchTokenTyped tests match.token via typed Options API.
func TestGrammarRegexMatchTokenTyped(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Match: &MatchOptions{
				Token: map[string]*regexp.Regexp{
					"#ID": regexp.MustCompile(`^[a-zA-Z_][a-zA-Z_0-9]*`),
				},
			},
			TokenSet: map[string][]string{
				"KEY": {"#ST", "#ID"},
				"VAL": {"#TX", "#NR", "#ST", "#VL", "#ID"},
			},
		},
	})

	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}
}

// TestGrammarRegexMatchValue tests match.value via OptionsMap (declarative form).
// Note: match.value runs against the forward source (remaining input), so regexps
// should NOT use $ anchor. Use value.def[name].match for extracted-text matching.
func TestGrammarRegexMatchValue(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Ref: map[FuncRef]any{
			"@valOn":  func(match []string) any { return true },
			"@valOff": func(match []string) any { return false },
		},
		OptionsMap: map[string]any{
			"match": map[string]any{
				"value": map[string]any{
					// No $ anchor — matches against forward source, not extracted text.
					"on":  map[string]any{"match": "@/^on/i", "val": "@valOn"},
					"off": map[string]any{"match": "@/^off/i", "val": "@valOff"},
				},
			},
		},
	})

	result, err := j.Parse("a:ON,b:off")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v", m["b"])
	}
}

// TestGrammarRegexMatchValueTyped tests match.value via typed Options API.
func TestGrammarRegexMatchValueTyped(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Match: &MatchOptions{
				Value: map[string]*MatchValueSpec{
					"on": {
						Match: regexp.MustCompile(`(?i)^on`),
						Val:   func(m []string) any { return true },
					},
					"off": {
						Match: regexp.MustCompile(`(?i)^off`),
						Val:   func(m []string) any { return false },
					},
				},
			},
		},
	})

	result, err := j.Parse("a:ON,b:off")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v", m["b"])
	}
}

// TestResolveFuncRefsRegexInNestedMap verifies @/…/ resolution in nested structures.
func TestResolveFuncRefsRegexInNestedMap(t *testing.T) {
	input := map[string]any{
		"number": map[string]any{
			"exclude": "@/^0[0-9]+/",
		},
		"value": map[string]any{
			"def": map[string]any{
				"on": map[string]any{
					"match": "@/^on$/i",
				},
			},
		},
	}
	result := ResolveFuncRefs(input, nil).(map[string]any)

	num := result["number"].(map[string]any)
	if _, ok := num["exclude"].(*regexp.Regexp); !ok {
		t.Errorf("number.exclude should be *regexp.Regexp, got %T", num["exclude"])
	}

	val := result["value"].(map[string]any)
	def := val["def"].(map[string]any)
	on := def["on"].(map[string]any)
	if _, ok := on["match"].(*regexp.Regexp); !ok {
		t.Errorf("value.def.on.match should be *regexp.Regexp, got %T", on["match"])
	}
}

// TestResolveFuncRefsRegexInSlice verifies @/…/ resolution inside slices.
func TestResolveFuncRefsRegexInSlice(t *testing.T) {
	input := []any{"@/^test$/i", "@SKIP", "@@at"}
	result := ResolveFuncRefs(input, nil).([]any)

	if _, ok := result[0].(*regexp.Regexp); !ok {
		t.Errorf("[0] should be *regexp.Regexp, got %T", result[0])
	}
	re := result[0].(*regexp.Regexp)
	if !re.MatchString("TEST") {
		t.Error("regex should match TEST (case insensitive)")
	}
	if !IsSkip(result[1]) {
		t.Errorf("[1] should be Skip, got %v", result[1])
	}
	if result[2] != "@at" {
		t.Errorf("[2] expected @at, got %v", result[2])
	}
}

// TestMatchTokenNilRegexpNoPanic verifies that a nil *regexp.Regexp entry
// in Match.Token is skipped during parsing instead of causing a panic.
func TestMatchTokenNilRegexpNoPanic(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Match: &MatchOptions{
				Token: map[string]*regexp.Regexp{
					"#ID": nil,
				},
			},
			TokenSet: map[string][]string{
				"KEY": {"#ST", "#ID"},
				"VAL": {"#TX", "#NR", "#ST", "#VL", "#ID"},
			},
		},
	})

	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}
}

// --- GrammarText: string grammar ---

func TestGrammarTextNumberSep(t *testing.T) {
	j := Make()
	err := j.GrammarText(`options: { number: { sep: "_" } }`)
	if err != nil {
		t.Fatal(err)
	}
	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1000) {
		t.Errorf("expected a:1000, got %v", m["a"])
	}
}

func TestGrammarTextNumberExclude(t *testing.T) {
	j := Make()
	err := j.GrammarText(`options: { number: { exclude: '@/^0[0-9]+$/' } }`)
	if err != nil {
		t.Fatal(err)
	}
	result, err := j.Parse("a:01")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != "01" {
		t.Errorf("expected a:'01' (text), got %v (%T)", m["a"], m["a"])
	}
}

func TestGrammarTextFlatOptions(t *testing.T) {
	// When there's no "options" wrapper, the entire parsed map is treated as options.
	j := Make()
	err := j.GrammarText(`number: { sep: "_" }`)
	if err != nil {
		t.Fatal(err)
	}
	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1000) {
		t.Errorf("expected a:1000, got %v", m["a"])
	}
}

func TestGrammarTextOptionsAndRules(t *testing.T) {
	// GrammarText processes both options and rule definitions from text.
	j := Make()
	err := j.GrammarText(`
		options: { number: { sep: "_" } },
		rule: {
			val: {
				close: [
					{ s: "#ZZ", g: "test,jsonic" }
				]
			}
		}
	`)
	if err != nil {
		t.Fatal(err)
	}
	// Options took effect.
	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1000) {
		t.Errorf("expected a:1000, got %v", m["a"])
	}
}

func TestGrammarTextRulesWithFuncRef(t *testing.T) {
	// GrammarText can define rules with @funcRef actions when Ref is
	// provided separately via Grammar after GrammarText sets up the structure.
	j := Make()

	// First apply rules via text with a group tag.
	err := j.GrammarText(`
		rule: {
			val: {
				close: [
					{ s: "#ZZ", g: "custom-from-text" }
				]
			}
		}
	`)
	if err != nil {
		t.Fatal(err)
	}

	// Verify the rule alt was added.
	found := false
	for _, alt := range j.RSM()["val"].Close {
		if alt.G == "custom-from-text" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected rule alt with group 'custom-from-text'")
	}
}

func TestGrammarTextWithInjectAndExclude(t *testing.T) {
	// Regression: GrammarText with {alts, inject} form was not parsed,
	// so rule alts were silently dropped, breaking string matching when
	// combined with rule.exclude.
	j := Make()
	err := j.GrammarText(`
		options: { text:{lex:false}, string:{chars:'"'}, rule:{finish:false} },
		rule: { val: { open: { alts:[{s:'#ZZ', g:jsonc}], inject:{append:true} } } }
	`)
	if err != nil {
		t.Fatal(err)
	}
	j.SetOptions(Options{Rule: &RuleOptions{Exclude: "jsonic,imp"}})

	// Complete string should parse.
	result, err := j.Parse(`"test"`)
	if err != nil {
		t.Fatalf("complete string failed: %v", err)
	}
	if result != "test" {
		t.Errorf("expected 'test', got %v", result)
	}

	// Unterminated string should produce unterminated_string, not unexpected.
	_, err = j.Parse(`"test`)
	if err == nil {
		t.Fatal("expected error for unterminated string")
	}
	if je, ok := err.(*JsonicError); ok {
		if je.Code != "unterminated_string" {
			t.Errorf("expected unterminated_string, got %s", je.Code)
		}
	}

	// JSON structures should work.
	result, err = j.Parse(`{"a":"b","c":1}`)
	if err != nil {
		t.Fatalf("JSON object failed: %v", err)
	}
	m := result.(map[string]any)
	if m["a"] != "b" || m["c"] != float64(1) {
		t.Errorf("expected {a:b, c:1}, got %v", m)
	}
}

func TestExcludeCommaTrailingComma(t *testing.T) {
	// With only "comma" excluded, trailing commas in lists should produce
	// clean output (no nil element), matching TS behavior.
	j := Make(Options{Rule: &RuleOptions{Exclude: "comma"}})

	result, err := j.Parse("[1,2,]")
	if err != nil {
		t.Fatal(err)
	}
	arr := result.([]any)
	if len(arr) != 2 || arr[0] != float64(1) || arr[1] != float64(2) {
		t.Errorf("expected [1,2], got %v", arr)
	}

	// Trailing comma in map should fail.
	_, err = j.Parse(`{"a":1,}`)
	if err == nil {
		t.Fatal("expected error for trailing comma in map")
	}

	// Normal cases still work.
	result, err = j.Parse(`{"a":null}`)
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != nil {
		t.Errorf("expected a:nil, got %v", m["a"])
	}
}

func TestGrammarTextThenSetOptionsPreserved(t *testing.T) {
	// GrammarText sets options and rules. A subsequent SetOptions must
	// preserve both the options (via deep merge) and the rule modifications.
	j := Make()

	// Apply options and a rule alt via GrammarText.
	err := j.GrammarText(`
		options: { number: { sep: "_" } },
		rule: {
			val: {
				close: [
					{ s: "#ZZ", g: "from-text" }
				]
			}
		}
	`)
	if err != nil {
		t.Fatal(err)
	}

	// Now call SetOptions with an unrelated option change.
	yes := true
	j.SetOptions(Options{Number: &NumberOptions{Hex: &yes}})

	// Options from GrammarText should still be in effect (number.sep).
	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1000) {
		t.Errorf("expected a:1000 (number.sep preserved), got %v", m["a"])
	}

	// Rule alt from GrammarText should still exist.
	found := false
	for _, alt := range j.RSM()["val"].Close {
		if alt.G == "from-text" {
			found = true
			break
		}
	}
	if !found {
		t.Error("rule alt 'from-text' lost after SetOptions")
	}
}

func TestGrammarTextInvalidSource(t *testing.T) {
	j := Make()
	// Empty string should not error (jsonic allows empty source by default).
	err := j.GrammarText("")
	if err != nil {
		t.Fatal(err)
	}
}

// --- MapToOptions coverage for previously missing options ---

func TestGrammarTextRuleExclude(t *testing.T) {
	j := Make()
	err := j.GrammarText(`options: { rule: { exclude: "jsonic" } }`)
	if err != nil {
		t.Fatal(err)
	}
	// Strict JSON should work.
	result, err := j.Parse(`{"a":1}`)
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}
	// Implicit map (jsonic extension) should fail.
	_, err = j.Parse("a:1")
	if err == nil {
		t.Fatal("expected error for implicit map after excluding jsonic via GrammarText")
	}
}

func TestGrammarTextTextLex(t *testing.T) {
	j := Make()
	err := j.GrammarText(`options: { text: { lex: false } }`)
	if err != nil {
		t.Fatal(err)
	}
	// Bare text should fail, but value keywords still work.
	result, err := j.Parse(`{"a":true}`)
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
}

func TestGrammarTextLexEmpty(t *testing.T) {
	j := Make()
	err := j.GrammarText(`options: { lex: { empty: false } }`)
	if err != nil {
		t.Fatal(err)
	}
	_, err = j.Parse("")
	if err == nil {
		t.Fatal("expected error for empty source after disabling via GrammarText")
	}
}

func TestMapToOptionsListChild(t *testing.T) {
	// list.child is a grammar-level option, so must be set at Make() time.
	// This tests that MapToOptions correctly parses the list options.
	j := Make(MapToOptions(map[string]any{
		"list": map[string]any{"child": true},
	}))
	result, err := j.Parse("[:1,a,b]")
	if err != nil {
		t.Fatal(err)
	}
	lr := result.(ListRef)
	if lr.Child != float64(1) {
		t.Errorf("expected child=1, got %v", lr.Child)
	}
}

func TestMapToOptionsMapChild(t *testing.T) {
	j := Make(MapToOptions(map[string]any{
		"map": map[string]any{"child": true},
	}))
	result, err := j.Parse("{:1,a:2}")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["child$"] != float64(1) {
		t.Errorf("expected child$=1, got %v", m["child$"])
	}
}

func TestMapToOptionsEnder(t *testing.T) {
	// Verify MapToOptions parses the ender option correctly.
	opts := MapToOptions(map[string]any{"ender": ";"})
	if len(opts.Ender) != 1 || opts.Ender[0] != ";" {
		t.Errorf("expected Ender=[;], got %v", opts.Ender)
	}
}

// --- SetOptions applies lex.empty ---

func TestSetOptionsLexEmpty(t *testing.T) {
	// lex.empty can be set via SetOptions after Make(), matching TS behavior.
	j := Make()

	// Default: empty source is allowed.
	result, err := j.Parse("")
	if err != nil {
		t.Fatalf("empty source should be allowed by default: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil for empty source, got %v", result)
	}

	// Disable empty source via SetOptions.
	no := false
	j.SetOptions(Options{Lex: &LexOptions{Empty: &no}})

	_, err = j.Parse("")
	if err == nil {
		t.Fatal("expected error for empty source after disabling lex.empty")
	}

	// Re-enable via SetOptions.
	yes := true
	j.SetOptions(Options{Lex: &LexOptions{Empty: &yes}})

	result, err = j.Parse("")
	if err != nil {
		t.Fatalf("empty source should be allowed again: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil, got %v", result)
	}
}

// --- text.lex=false should not disable value keywords ---

func TestTextLexFalseValueKeywordsStillWork(t *testing.T) {
	// In TS, text.lex:false disables bare text tokens but value keywords
	// (true, false, null) still match. Go must behave the same way.
	no := false
	j := Make(Options{Text: &TextOptions{Lex: &no}})

	// Value keywords should still work.
	result, err := j.Parse(`{"a":true,"b":false,"c":null}`)
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v (%T)", m["b"], m["b"])
	}
	if m["c"] != nil {
		t.Errorf("expected c:nil, got %v", m["c"])
	}

	// Bare text should NOT work (should error or not parse as text).
	_, err = j.Parse("hello")
	if err == nil {
		t.Fatal("expected error for bare text when text.lex=false")
	}
}

func TestTextLexFalseCustomValueDef(t *testing.T) {
	// Custom value.def keywords should also work with text.lex=false.
	no := false
	yes := true
	j := Make(Options{
		Text: &TextOptions{Lex: &no},
		Value: &ValueOptions{
			Lex: &yes,
			Def: map[string]*ValueDef{
				"yes": {Val: true},
				"no":  {Val: false},
			},
		},
	})

	result, err := j.Parse(`{"a":yes,"b":no}`)
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v", m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v", m["b"])
	}
}

func TestGroupTagsValidFormat(t *testing.T) {
	// All group tags (G fields) in grammar alts must be comma-separated
	// lowercase identifiers [a-z] only. No dots, spaces, or other chars.
	// Regression guard for the "elem.jsonic" typo (TS grammar.ts:737).
	j := Make()
	tagRe := regexp.MustCompile(`^[a-z]+$`)
	for name, rs := range j.RSM() {
		for _, alt := range rs.Open {
			if alt.G != "" {
				for _, tag := range strings.Split(alt.G, ",") {
					if !tagRe.MatchString(tag) {
						t.Errorf("rule %s open: invalid group tag %q in G=%q "+
							"(must be comma-separated lowercase [a-z] identifiers)",
							name, tag, alt.G)
					}
				}
			}
		}
		for _, alt := range rs.Close {
			if alt.G != "" {
				for _, tag := range strings.Split(alt.G, ",") {
					if !tagRe.MatchString(tag) {
						t.Errorf("rule %s close: invalid group tag %q in G=%q "+
							"(must be comma-separated lowercase [a-z] identifiers)",
							name, tag, alt.G)
					}
				}
			}
		}
	}
}

func TestSetOptionsRuleExclude(t *testing.T) {
	// rule.exclude can be set via SetOptions after Make().
	j := Make()

	// Before exclude: jsonic extensions are active (implicit maps work).
	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}

	// Exclude jsonic extensions: only strict JSON syntax works.
	j.SetOptions(Options{Rule: &RuleOptions{Exclude: "jsonic"}})

	// Strict JSON should still work.
	result, err = j.Parse(`{"a":1}`)
	if err != nil {
		t.Fatal(err)
	}
	m = result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}

	// Implicit map (jsonic extension) should now fail.
	_, err = j.Parse("a:1")
	if err == nil {
		t.Fatal("expected error for implicit map after excluding jsonic")
	}
}

func TestGrammarLexEmpty(t *testing.T) {
	// lex.empty can be set via Grammar, not just Make().
	j := Make()
	no := false
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{Lex: &LexOptions{Empty: &no}},
	})

	_, err := j.Parse("")
	if err == nil {
		t.Fatal("expected error for empty source after Grammar sets lex.empty=false")
	}
}

// --- Info marker key protection ---

func TestInfoMarkerKeyDropped(t *testing.T) {
	// User keys matching the info marker are dropped when info.map is enabled.
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true)}})
	result, err := j.Parse(`a:1,__info__:2,b:3`)
	if err != nil {
		t.Fatal(err)
	}
	mr := result.(MapRef)
	if mr.Val["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", mr.Val["a"])
	}
	if mr.Val["b"] != float64(3) {
		t.Errorf("expected b:3, got %v", mr.Val["b"])
	}
	if _, exists := mr.Val["__info__"]; exists {
		t.Error("__info__ key should have been dropped")
	}
}

func TestInfoMarkerKeyDroppedJSON(t *testing.T) {
	// Also works in strict JSON syntax path.
	j := Make(Options{Info: &InfoOptions{Map: boolPtr(true)}})
	result, err := j.Parse(`{"a":1,"__info__":2}`)
	if err != nil {
		t.Fatal(err)
	}
	mr := result.(MapRef)
	if _, exists := mr.Val["__info__"]; exists {
		t.Error("__info__ key should have been dropped in JSON path")
	}
}

func TestInfoMarkerKeyNotDroppedWhenOff(t *testing.T) {
	// When info.map is off, the key is NOT dropped.
	j := Make()
	result, err := j.Parse(`a:1,__info__:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["__info__"] != float64(2) {
		t.Errorf("expected __info__:2, got %v", m["__info__"])
	}
}

// TestValueDefReUsesValWhenValFuncNil verifies that regex-based value.def
// entries return ValueDef.Val (not the matched source text) when ValFunc is nil.
func TestValueDefReUsesValWhenValFuncNil(t *testing.T) {
	j := Make()
	lex := true
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Value: &ValueOptions{
				Lex: &lex,
				Def: map[string]*ValueDef{
					"yes": {
						Val:   true,
						Match: regexp.MustCompile(`(?i)^yes$`),
					},
					"no": {
						Val:   false,
						Match: regexp.MustCompile(`(?i)^no$`),
					},
				},
			},
		},
	})

	result, err := j.Parse("a:YES,b:No")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != true {
		t.Errorf("expected a:true, got %v (%T)", m["a"], m["a"])
	}
	if m["b"] != false {
		t.Errorf("expected b:false, got %v (%T)", m["b"], m["b"])
	}
}

// TestMatchValueNilSpecNoPanic verifies that nil entries in Match.Value
// are skipped rather than causing a nil-pointer panic in buildConfig.
func TestMatchValueNilSpecNoPanic(t *testing.T) {
	j := Make()
	mustGrammar(t, j, &GrammarSpec{
		Options: &Options{
			Match: &MatchOptions{
				Value: map[string]*MatchValueSpec{
					"x": nil,
				},
			},
		},
	})

	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	m := result.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}
}

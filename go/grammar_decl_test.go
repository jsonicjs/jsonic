package jsonic

import (
	"reflect"
	"regexp"
	"testing"
)

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
	j.Grammar(&GrammarSpec{
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
	j.Grammar(&GrammarSpec{
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
	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
		Options: &Options{
			Value: &ValueOptions{
				Lex: &yes,
				Def: map[string]*ValueDef{
					"yes": {Val: true},
				},
			},
		},
	})

	j.Grammar(&GrammarSpec{
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
	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

	j.Grammar(&GrammarSpec{
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

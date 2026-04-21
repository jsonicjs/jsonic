package jsonic

import "testing"

// TestFnrefDedupeByFunctionIdentity verifies that registering the same
// StateAction twice via Grammar() installs it only once, while distinct
// functions for the same phase both install. Mirrors JS behaviour.
func TestFnrefDedupeByFunctionIdentity(t *testing.T) {
	j := Make()

	sameFnCount := 0
	sameFn := StateAction(func(r *Rule, ctx *Context) { sameFnCount++ })

	diffFnCount := 0
	diffFn := StateAction(func(r *Rule, ctx *Context) { diffFnCount++ })

	// Register sameFn twice (two Grammar() calls, same function) — should install once.
	if err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{"pair": {}},
		Ref:  map[FuncRef]any{"@pair-bc": sameFn},
	}); err != nil {
		t.Fatalf("Grammar 1: %v", err)
	}
	if err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{"pair": {}},
		Ref:  map[FuncRef]any{"@pair-bc": sameFn},
	}); err != nil {
		t.Fatalf("Grammar 2: %v", err)
	}

	// Register a DIFFERENT function — should install additionally.
	if err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{"pair": {}},
		Ref:  map[FuncRef]any{"@pair-bc": diffFn},
	}); err != nil {
		t.Fatalf("Grammar 3: %v", err)
	}

	if _, err := j.Parse("a:1"); err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if sameFnCount != 1 {
		t.Errorf("sameFn fired %d times, want 1 (dedup by identity)", sameFnCount)
	}
	if diffFnCount != 1 {
		t.Errorf("diffFn fired %d times, want 1 (distinct function installs)", diffFnCount)
	}
}

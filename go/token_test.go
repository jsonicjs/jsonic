package jsonic

import "testing"

// Mirrors TS src/lexer.ts:115 — when Token.Val is a function, ResolveVal
// invokes it with (rule, ctx) rather than returning the function itself.

func TestResolveVal_StaticValue(t *testing.T) {
	tk := &Token{Val: 42}
	if got := tk.ResolveVal(nil, nil); got != 42 {
		t.Errorf("expected 42, got %v", got)
	}
}

func TestResolveVal_NilValueUnchanged(t *testing.T) {
	tk := &Token{Val: nil}
	if got := tk.ResolveVal(nil, nil); got != nil {
		t.Errorf("expected nil, got %v", got)
	}
}

func TestResolveVal_LazyFunction(t *testing.T) {
	calls := 0
	tk := &Token{Val: TokenValFunc(func(r *Rule, ctx *Context) any {
		calls++
		return "lazy"
	})}
	if got := tk.ResolveVal(nil, nil); got != "lazy" {
		t.Errorf("expected 'lazy', got %v", got)
	}
	if calls != 1 {
		t.Errorf("expected 1 call, got %d", calls)
	}
}

func TestResolveVal_LazyFunctionReceivesRuleAndCtx(t *testing.T) {
	var seenRule *Rule
	var seenCtx *Context
	tk := &Token{Val: TokenValFunc(func(r *Rule, ctx *Context) any {
		seenRule = r
		seenCtx = ctx
		return nil
	})}
	rule := &Rule{}
	ctx := &Context{}
	tk.ResolveVal(rule, ctx)
	if seenRule != rule {
		t.Errorf("rule not forwarded: got %p want %p", seenRule, rule)
	}
	if seenCtx != ctx {
		t.Errorf("ctx not forwarded: got %p want %p", seenCtx, ctx)
	}
}

// Integration: a custom matcher emits a Token whose Val is a TokenValFunc.
// The parser must call it at resolution time, not store the function.
func TestResolveVal_LazyValueThroughParser(t *testing.T) {
	matcher := LexMatcher(func(lex *Lex, _ *Rule) *Token {
		if lex.pnt.SI >= len(lex.Src) || lex.Src[lex.pnt.SI] != '@' {
			return nil
		}
		start := lex.pnt.SI
		lex.pnt.SI++
		return &Token{
			Name: "#TX",
			Tin:  TinTX,
			Src:  lex.Src[start:lex.pnt.SI],
			Val: TokenValFunc(func(r *Rule, ctx *Context) any {
				return "resolved"
			}),
			SI: start,
			RI: lex.pnt.RI,
			CI: lex.pnt.CI,
		}
	})

	j := Make(Options{
		Lex: &LexOptions{
			Match: map[string]*MatchSpec{
				"at": {
					Order: 1,
					Make: func(_ *LexConfig, _ *Options) LexMatcher {
						return matcher
					},
				},
			},
		},
	})

	out, err := j.Parse(`@`)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	if out != "resolved" {
		t.Errorf("expected 'resolved', got %v", out)
	}
}

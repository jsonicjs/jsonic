package jsonic

import (
	"testing"
)

// --- LexCheck hooks ---

func TestFixedCheckHookFires(t *testing.T) {
	called := 0
	check := func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}
	j := Make(Options{Fixed: &FixedOptions{Check: check}})

	if _, err := j.Parse("{a:1}"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("FixedCheck was never invoked by the lexer")
	}
}

func TestSpaceCheckHookFires(t *testing.T) {
	called := 0
	j := Make(Options{Space: &SpaceOptions{Check: func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}}})
	if _, err := j.Parse("a: 1"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("SpaceCheck was never invoked")
	}
}

func TestLineCheckHookFires(t *testing.T) {
	called := 0
	j := Make(Options{Line: &LineOptions{Check: func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}}})
	if _, err := j.Parse("a:1\nb:2"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("LineCheck was never invoked")
	}
}

func TestTextCheckHookFires(t *testing.T) {
	called := 0
	j := Make(Options{Text: &TextOptions{Check: func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}}})
	if _, err := j.Parse("a:foo"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("TextCheck was never invoked")
	}
}

func TestNumberCheckHookFires(t *testing.T) {
	called := 0
	j := Make(Options{Number: &NumberOptions{Check: func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}}})
	if _, err := j.Parse("a:42"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("NumberCheck was never invoked")
	}
}

func TestStringCheckHookFires(t *testing.T) {
	called := 0
	j := Make(Options{String: &StringOptions{Check: func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}}})
	if _, err := j.Parse(`a:"hi"`); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("StringCheck was never invoked")
	}
}

func TestCommentCheckHookFires(t *testing.T) {
	called := 0
	j := Make(Options{Comment: &CommentOptions{Check: func(lex *Lex) *LexCheckResult {
		called++
		return nil
	}}})
	if _, err := j.Parse("# hi\na:1"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("CommentCheck was never invoked")
	}
}

func TestLexCheckCanOverrideResult(t *testing.T) {
	// A Done result short-circuits the matcher.  Here FixedCheck returns a
	// synthetic comma token for every fixed-token lookup attempt, which
	// effectively disables {,},[,],: — parsing a map then fails.
	j := Make(Options{Fixed: &FixedOptions{Check: func(lex *Lex) *LexCheckResult {
		return &LexCheckResult{Done: true, Token: nil}
	}}})
	if _, err := j.Parse("{a:1}"); err == nil {
		t.Error("expected fixed matcher suppression to break parsing")
	}
}

// --- info.marker ---

func TestInfoMarkerDefault(t *testing.T) {
	yes := true
	j := Make(Options{Info: &InfoOptions{Map: &yes}})
	if m := j.parser.Config.InfoMarker; m != "__info__" {
		t.Errorf("expected default marker '__info__', got %q", m)
	}
}

func TestInfoMarkerOverride(t *testing.T) {
	yes := true
	j := Make(Options{Info: &InfoOptions{Map: &yes, Marker: "$meta"}})
	if m := j.parser.Config.InfoMarker; m != "$meta" {
		t.Errorf("expected marker '$meta', got %q", m)
	}
}

func TestInfoMarkerFromText(t *testing.T) {
	// info.marker via SetOptionsText round-trips.
	j, err := Make().SetOptionsText(`info: { map: true, marker: "$$info" }`)
	if err != nil {
		t.Fatal(err)
	}
	if m := j.parser.Config.InfoMarker; m != "$$info" {
		t.Errorf("expected '$$info', got %q", m)
	}
}

// --- parse.prepare ---

func TestParsePrepareHooksRunInOrder(t *testing.T) {
	var order []string
	j := Make(Options{Parse: &ParseOptions{Prepare: map[string]func(ctx *Context){
		"b-second": func(ctx *Context) { order = append(order, "second") },
		"a-first":  func(ctx *Context) { order = append(order, "first") },
	}}})

	if _, err := j.Parse("a:1"); err != nil {
		t.Fatal(err)
	}
	if len(order) != 2 || order[0] != "first" || order[1] != "second" {
		t.Errorf("expected [first second] by key-sorted order, got %v", order)
	}
}

func TestParsePrepareSkipsNil(t *testing.T) {
	// Nil callbacks are dropped; remaining ones still run.
	called := false
	j := Make(Options{Parse: &ParseOptions{Prepare: map[string]func(ctx *Context){
		"a": nil,
		"b": func(ctx *Context) { called = true },
	}}})
	if _, err := j.Parse("a:1"); err != nil {
		t.Fatal(err)
	}
	if !called {
		t.Error("non-nil prepare hook did not fire")
	}
}

// --- match.check ---

func TestMatchCheckHookFires(t *testing.T) {
	// Enable match lex so the MatchCheck branch is reached.
	yes := true
	called := 0
	j := Make(Options{Match: &MatchOptions{
		Lex:   &yes,
		Check: func(lex *Lex) *LexCheckResult { called++; return nil },
	}})
	if _, err := j.Parse("a:1"); err != nil {
		t.Fatal(err)
	}
	if called == 0 {
		t.Error("MatchCheck was never invoked")
	}
}

// --- errmsg.suffix field round-trip ---

func TestErrMsgSuffixRoundTripString(t *testing.T) {
	j, err := Make().SetOptionsText(`errmsg: { name: "foo", suffix: "bar" }`)
	if err != nil {
		t.Fatal(err)
	}
	opts := j.Options()
	if opts.ErrMsg == nil || opts.ErrMsg.Suffix != "bar" {
		t.Errorf("expected suffix 'bar', got %#v", opts.ErrMsg)
	}
}

func TestErrMsgSuffixRoundTripBool(t *testing.T) {
	j, err := Make().SetOptionsText(`errmsg: { suffix: false }`)
	if err != nil {
		t.Fatal(err)
	}
	opts := j.Options()
	if opts.ErrMsg == nil {
		t.Fatal("errmsg options not populated")
	}
	if v, ok := opts.ErrMsg.Suffix.(bool); !ok || v != false {
		t.Errorf("expected suffix=false bool, got %#v", opts.ErrMsg.Suffix)
	}
}

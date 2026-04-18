package jsonic

import (
	"testing"
)

// N-token lookahead tests. Previously Go's ParseAlts only inspected
// alt.S[0] and alt.S[1]; anything at alt.S[2] and beyond was silently
// ignored. These tests exercise the generalized N-position match loop.

// TestNLookaheadThreeTokens verifies that a three-position alt.S
// matches all three consecutive tokens and populates both the new
// rule.O slice and the legacy O0/O1 aliases.
func TestNLookaheadThreeTokens(t *testing.T) {
	j := Make()
	TA := j.Token("#TA", "A")
	TB := j.Token("#TB", "B")
	TC := j.Token("#TC", "C")

	var gotO []string
	var gotLegacy string

	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{{
			S: [][]Tin{{TA}, {TB}, {TC}},
			A: func(r *Rule, ctx *Context) {
				for _, tkn := range r.O {
					gotO = append(gotO, string(tkn.Src))
				}
				gotLegacy = string(r.O0.Src) + string(r.O1.Src)
				r.Node = "ABC"
			},
		}}, rs.Open...)
	})

	result, err := j.Parse("ABC")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "ABC" {
		t.Errorf("expected ABC, got %v", result)
	}
	if len(gotO) != 3 || gotO[0] != "A" || gotO[1] != "B" || gotO[2] != "C" {
		t.Errorf("expected r.O to be [A B C], got %v", gotO)
	}
	if gotLegacy != "AB" {
		t.Errorf("expected legacy O0+O1 = AB, got %s", gotLegacy)
	}
}

// TestNLookaheadFiveTokensNoCap confirms there is no fixed cap -
// five-token lookahead matches as expected.
func TestNLookaheadFiveTokensNoCap(t *testing.T) {
	j := Make()
	TA := j.Token("#TA", "A")
	TB := j.Token("#TB", "B")
	TC := j.Token("#TC", "C")
	TD := j.Token("#TD", "D")
	TE := j.Token("#TE", "E")

	var matchedN int

	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{{
			S: [][]Tin{{TA}, {TB}, {TC}, {TD}, {TE}},
			A: func(r *Rule, ctx *Context) {
				matchedN = r.ON
				r.Node = "five"
			},
		}}, rs.Open...)
	})

	result, err := j.Parse("ABCDE")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "five" {
		t.Errorf("expected 'five', got %v", result)
	}
	if matchedN != 5 {
		t.Errorf("expected ON=5, got %d", matchedN)
	}
}

// TestNLookaheadFirstMatchWins verifies that alts with longer S
// sequences are attempted before shorter ones, and that a deeper
// mismatch correctly falls through to the next alt.
func TestNLookaheadFirstMatchWins(t *testing.T) {
	j := Make()
	TA := j.Token("#TA", "A")
	TB := j.Token("#TB", "B")
	TC := j.Token("#TC", "C")
	TD := j.Token("#TD", "D")

	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{
			{
				S: [][]Tin{{TA}, {TB}, {TC}},
				A: func(r *Rule, ctx *Context) { r.Node = "abc" },
			},
			{
				S: [][]Tin{{TA}, {TB}, {TD}},
				A: func(r *Rule, ctx *Context) { r.Node = "abd" },
			},
			{
				S: [][]Tin{{TA}, {TB}},
				A: func(r *Rule, ctx *Context) { r.Node = "ab" },
			},
			{
				S: [][]Tin{{TA}},
				A: func(r *Rule, ctx *Context) { r.Node = "a" },
			},
		}, rs.Open...)
	})

	cases := []struct {
		in   string
		want string
	}{
		{"ABC", "abc"},
		{"ABD", "abd"},
		{"AB", "ab"},
		{"A", "a"},
	}
	for _, tc := range cases {
		got, err := j.Parse(tc.in)
		if err != nil {
			t.Errorf("%q: unexpected error: %v", tc.in, err)
			continue
		}
		if got != tc.want {
			t.Errorf("%q: want %s, got %v", tc.in, tc.want, got)
		}
	}
}

// TestNLookaheadCtxTSlice verifies that ctx.T is populated with every
// fetched lookahead slot and stays in sync with the legacy T0 / T1.
func TestNLookaheadCtxTSlice(t *testing.T) {
	j := Make()
	TA := j.Token("#TA", "A")
	TB := j.Token("#TB", "B")
	TC := j.Token("#TC", "C")

	var seenT0, seenT1, seenT2 string
	var seenLegacyT0, seenLegacyT1 string

	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{{
			S: [][]Tin{{TA}, {TB}, {TC}},
			C: func(r *Rule, ctx *Context) bool {
				// After the lookahead fetch but before the alt is
				// committed, ctx.T[0..2] are populated and the legacy
				// aliases mirror T[0] / T[1].
				if len(ctx.T) >= 3 {
					seenT0 = string(ctx.T[0].Src)
					seenT1 = string(ctx.T[1].Src)
					seenT2 = string(ctx.T[2].Src)
				}
				seenLegacyT0 = string(ctx.T0.Src)
				seenLegacyT1 = string(ctx.T1.Src)
				return true
			},
			A: func(r *Rule, ctx *Context) {
				r.Node = "ok"
			},
		}}, rs.Open...)
	})

	_, err := j.Parse("ABC")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if seenT0 != "A" || seenT1 != "B" || seenT2 != "C" {
		t.Errorf("ctx.T[0..2] want A B C, got %s %s %s", seenT0, seenT1, seenT2)
	}
	if seenLegacyT0 != "A" || seenLegacyT1 != "B" {
		t.Errorf("legacy T0/T1 want A B, got %s %s", seenLegacyT0, seenLegacyT1)
	}
}

// TestNLookaheadBacktrackN3 verifies that a three-token match with
// b: 3 leaves all three tokens in ctx.T for the child / next rule to
// consume. The consumed count becomes 0 so the buffer is not shifted.
func TestNLookaheadBacktrackN3(t *testing.T) {
	j := Make()
	TA := j.Token("#TA", "A")
	TB := j.Token("#TB", "B")
	TC := j.Token("#TC", "C")

	var seen []string

	// val: match A B C with b:3, push to `collect`.
	// collect: consume A, then B, then C one at a time, logging each.
	j.Rule("val", func(rs *RuleSpec) {
		rs.Open = append([]*AltSpec{{
			S: [][]Tin{{TA}, {TB}, {TC}},
			B: 3,
			P: "collect",
		}}, rs.Open...)
	})

	j.Rule("collect", func(rs *RuleSpec) {
		rs.Open = []*AltSpec{{
			S: [][]Tin{{TA}},
			A: func(r *Rule, ctx *Context) {
				seen = append(seen, string(r.O[0].Src))
			},
			R: "collectB",
		}}
		rs.Close = []*AltSpec{{}}
	})

	j.Rule("collectB", func(rs *RuleSpec) {
		rs.Open = []*AltSpec{{
			S: [][]Tin{{TB}},
			A: func(r *Rule, ctx *Context) {
				seen = append(seen, string(r.O[0].Src))
			},
			R: "collectC",
		}}
		rs.Close = []*AltSpec{{}}
	})

	j.Rule("collectC", func(rs *RuleSpec) {
		rs.Open = []*AltSpec{{
			S: [][]Tin{{TC}},
			A: func(r *Rule, ctx *Context) {
				seen = append(seen, string(r.O[0].Src))
				r.Node = "done"
			},
		}}
		rs.Close = []*AltSpec{{}}
	})

	_, err := j.Parse("ABC")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(seen) != 3 || seen[0] != "A" || seen[1] != "B" || seen[2] != "C" {
		t.Errorf("expected [A B C], got %v", seen)
	}
}

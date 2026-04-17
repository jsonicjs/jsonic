package jsonic

import (
	"sort"
	"strings"
	"testing"
)

// --- Helpers ---

// altGTags returns, for the named rule and state ("open"/"close"), a slice
// of sorted tag slices — one per alt. Simplifies assertions that don't
// care about tag ordering.
func altGTags(t *testing.T, j *Jsonic, rulename, state string) [][]string {
	t.Helper()
	rs, ok := j.RSM()[rulename]
	if !ok {
		t.Fatalf("rule %q not found", rulename)
	}
	var alts []*AltSpec
	switch state {
	case "open":
		alts = rs.Open
	case "close":
		alts = rs.Close
	default:
		t.Fatalf("bad state %q", state)
	}
	out := make([][]string, 0, len(alts))
	for _, a := range alts {
		if a == nil {
			continue
		}
		tags := splitGroupTags(a.G)
		sort.Strings(tags)
		out = append(out, tags)
	}
	return out
}

// hasTags checks whether the alt list contains exactly one alt whose sorted
// tag slice equals the provided expected slice.
func containsTagSet(tagSets [][]string, want []string) bool {
	sort.Strings(want)
	for _, ts := range tagSets {
		if len(ts) != len(want) {
			continue
		}
		eq := true
		for i := range ts {
			if ts[i] != want[i] {
				eq = false
				break
			}
		}
		if eq {
			return true
		}
	}
	return false
}

// --- Grammar setting: rule.alt.g append (typed) ---

func TestGrammarSettingAltGStringAppended(t *testing.T) {
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "alpha"},
					{S: "#CA", G: "beta,gamma"},
				},
			},
		},
	}, &GrammarSetting{
		Rule: &GrammarSettingRule{
			Alt: &GrammarSettingAlt{G: "extraa,extrab"},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tags := altGTags(t, j, "val", "close")
	if !containsTagSet(tags, []string{"alpha", "extraa", "extrab"}) {
		t.Errorf("missing alpha+extras, got %v", tags)
	}
	if !containsTagSet(tags, []string{"beta", "extraa", "extrab", "gamma"}) {
		t.Errorf("missing beta/gamma+extras, got %v", tags)
	}
}

func TestGrammarSettingAltGArrayAppended(t *testing.T) {
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{{S: "#ZZ", G: "alpha"}, {S: "#CA"}},
			},
		},
	}, &GrammarSetting{
		Rule: &GrammarSettingRule{
			Alt: &GrammarSettingAlt{G: []string{"p1", "p2"}},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tags := altGTags(t, j, "val", "close")
	if !containsTagSet(tags, []string{"alpha", "p1", "p2"}) {
		t.Errorf("missing alpha+extras, got %v", tags)
	}
	if !containsTagSet(tags, []string{"p1", "p2"}) {
		t.Errorf("missing pure-extras alt, got %v", tags)
	}
}

func TestGrammarSettingNilIsNoop(t *testing.T) {
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{{S: "#ZZ", G: "alpha,beta"}},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tags := altGTags(t, j, "val", "close")
	if !containsTagSet(tags, []string{"alpha", "beta"}) {
		t.Errorf("nil setting mutated tags: %v", tags)
	}
}

func TestGrammarSettingEmptyGIsNoop(t *testing.T) {
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{{S: "#ZZ", G: "alpha"}},
			},
		},
	}, &GrammarSetting{Rule: &GrammarSettingRule{Alt: &GrammarSettingAlt{G: ""}}})
	if err != nil {
		t.Fatal(err)
	}
	tags := altGTags(t, j, "val", "close")
	if !containsTagSet(tags, []string{"alpha"}) {
		t.Errorf("empty-string setting mutated tags: %v", tags)
	}
}

func TestGrammarSettingPreservesInput(t *testing.T) {
	gs := &GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{{S: "#ZZ", G: "alpha"}},
			},
		},
	}
	original := gs.Rule["val"].Close.([]*GrammarAltSpec)[0].G

	j := Make()
	err := j.Grammar(gs, &GrammarSetting{
		Rule: &GrammarSettingRule{Alt: &GrammarSettingAlt{G: "extra"}},
	})
	if err != nil {
		t.Fatal(err)
	}

	after := gs.Rule["val"].Close.([]*GrammarAltSpec)[0].G
	if after != original {
		t.Errorf("Grammar mutated caller's GrammarAltSpec.G: %q -> %q", original, after)
	}
}

func TestGrammarSettingInjectFormApplied(t *testing.T) {
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: &GrammarAltListSpec{
					Alts:   []*GrammarAltSpec{{S: "#ZZ", G: "solo"}},
					Inject: &GrammarInjectSpec{Append: true},
				},
			},
		},
	}, &GrammarSetting{
		Rule: &GrammarSettingRule{Alt: &GrammarSettingAlt{G: "shared"}},
	})
	if err != nil {
		t.Fatal(err)
	}

	tags := altGTags(t, j, "val", "close")
	if !containsTagSet(tags, []string{"shared", "solo"}) {
		t.Errorf("expected shared+solo alt, got %v", tags)
	}
}

// --- GrammarText setting ---

func TestGrammarTextSettingAppendsTags(t *testing.T) {
	j := Make()
	err := j.GrammarText(`
		rule: {
			val: {
				close: [
					{ s: "#ZZ", g: "first" },
					{ s: "#CA", g: "second" }
				]
			}
		}
	`, &GrammarSetting{
		Rule: &GrammarSettingRule{Alt: &GrammarSettingAlt{G: "common"}},
	})
	if err != nil {
		t.Fatal(err)
	}

	tags := altGTags(t, j, "val", "close")
	if !containsTagSet(tags, []string{"common", "first"}) {
		t.Errorf("missing first+common, got %v", tags)
	}
	if !containsTagSet(tags, []string{"common", "second"}) {
		t.Errorf("missing second+common, got %v", tags)
	}
}

// --- g tag validation in NormAlt ---

func TestValidateGroupTagsRejects(t *testing.T) {
	// Bad: uppercase, leading digit, punctuation, spaces, single-char.
	bad := []string{"Foo", "1foo", "foo!", "foo bar", "FOO", "a", "x"}
	for _, b := range bad {
		if err := ValidateGroupTags(b); err == nil {
			t.Errorf("expected rejection of %q", b)
		}
	}
}

func TestValidateGroupTagsAccepts(t *testing.T) {
	// Good: letter + one or more letters/digits/hyphens.
	good := []string{
		"", "a1", "ab", "abc", "a1b2", "foo", "z99",
		"fo-o", "custom-from-text", "foo,bar", "a1,b2", "alpha-beta,gamma",
	}
	for _, g := range good {
		if err := ValidateGroupTags(g); err != nil {
			t.Errorf("expected %q to be accepted, got %v", g, err)
		}
	}
}

func TestNormAltReturnsErrorOnInvalidTag(t *testing.T) {
	err := NormAlt(&AltSpec{G: "BAD"})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "invalid group tag") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestGrammarInvalidGTagReturnsError(t *testing.T) {
	// An invalid tag supplied via Grammar surfaces as an error — no panic.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {Close: []*GrammarAltSpec{{S: "#ZZ", G: "BAD"}}},
		},
	})
	if err == nil {
		t.Fatal("expected error for invalid grammar tag")
	}
	if !strings.Contains(err.Error(), "invalid group tag") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestGrammarSettingInvalidTagReturnsError(t *testing.T) {
	// A setting-supplied bad tag is also validated via the error return.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {Close: []*GrammarAltSpec{{S: "#ZZ", G: "ok1"}}},
		},
	}, &GrammarSetting{
		Rule: &GrammarSettingRule{Alt: &GrammarSettingAlt{G: "BAD"}},
	})
	if err == nil {
		t.Fatal("expected error for invalid setting tag")
	}
	if !strings.Contains(err.Error(), "invalid group tag") {
		t.Errorf("unexpected error: %v", err)
	}
}

// --- SetOptionsText ---

func TestSetOptionsTextBasic(t *testing.T) {
	j := Make()
	if _, err := j.SetOptionsText(`number: { sep: "_" }`); err != nil {
		t.Fatal(err)
	}
	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	if m := result.(map[string]any); m["a"] != float64(1000) {
		t.Errorf("expected a:1000, got %v", m["a"])
	}
}

func TestSetOptionsTextEmptyIsNoop(t *testing.T) {
	j := Make()
	if _, err := j.SetOptionsText(""); err != nil {
		t.Fatal(err)
	}
	result, err := j.Parse("a:1")
	if err != nil {
		t.Fatal(err)
	}
	if m := result.(map[string]any); m["a"] != float64(1) {
		t.Errorf("expected a:1, got %v", m["a"])
	}
}

func TestSetOptionsTextMergesWithSetOptions(t *testing.T) {
	j := Make()
	if _, err := j.SetOptionsText(`number: { sep: "_" }`); err != nil {
		t.Fatal(err)
	}
	yes := true
	j.SetOptions(Options{Number: &NumberOptions{Hex: &yes}})

	// Separator from text still applies.
	result, err := j.Parse("a:1_000")
	if err != nil {
		t.Fatal(err)
	}
	if m := result.(map[string]any); m["a"] != float64(1000) {
		t.Errorf("expected a:1000 after merge, got %v", m["a"])
	}

	// Hex from later SetOptions also applies.
	result2, err := j.Parse("b:0xff")
	if err != nil {
		t.Fatal(err)
	}
	if m := result2.(map[string]any); m["b"] != float64(255) {
		t.Errorf("expected b:255, got %v", m["b"])
	}
}

func TestSetOptionsTextInvalidSource(t *testing.T) {
	// Jsonic is lenient about missing closing braces, so the error must
	// come from a lexer-level failure — here, an unterminated string.
	j := Make()
	if _, err := j.SetOptionsText(`number: { sep: "`); err == nil {
		t.Error("expected parse error on malformed options text")
	}
}

func TestSetOptionsTextReturnsInstance(t *testing.T) {
	j := Make()
	returned, err := j.SetOptionsText(`tag: "abc"`)
	if err != nil {
		t.Fatal(err)
	}
	if returned != j {
		t.Error("SetOptionsText should return the receiver")
	}
}


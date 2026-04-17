package jsonic

import (
	"strings"
	"testing"
)

// --- include-only filter ---

func TestRuleIncludeKeepsOnlyTaggedAlts(t *testing.T) {
	// Seed a rule with alts carrying different tag sets, then apply
	// rule.include = "keep" and verify only keep-tagged alts survive.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "keep,json"},
					{S: "#CA", G: "drop"},
					{S: "#CS", G: "keep"},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	j.SetOptions(Options{Rule: &RuleOptions{Include: "keep"}})

	kept := j.RSM()["val"].Close

	// Expected: the two alts tagged "keep" are preserved; the "drop"
	// alt and all built-in val-close alts without "keep" are gone.
	countByTag := func(alts []*AltSpec, tag string) int {
		n := 0
		for _, a := range alts {
			for _, part := range strings.Split(a.G, ",") {
				if strings.TrimSpace(part) == tag {
					n++
				}
			}
		}
		return n
	}
	if got := countByTag(kept, "keep"); got != 2 {
		t.Errorf("expected 2 alts with 'keep', got %d", got)
	}
	if got := countByTag(kept, "drop"); got != 0 {
		t.Errorf("expected 0 alts with 'drop', got %d", got)
	}
}

func TestRuleIncludeDropsUntaggedAlts(t *testing.T) {
	// Alts with no G tag are dropped when include is active — matches TS.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "keep"},
					{S: "#CA"}, // no G
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	j.SetOptions(Options{Rule: &RuleOptions{Include: "keep"}})

	for _, a := range j.RSM()["val"].Close {
		if a.G == "" {
			t.Error("expected alts with no G to be dropped by include filter")
		}
	}
}

func TestRuleIncludeEmptyIsNoop(t *testing.T) {
	// Empty include string must not filter anything.
	j := Make()
	originalCount := len(j.RSM()["val"].Close)

	j.SetOptions(Options{Rule: &RuleOptions{Include: ""}})

	if got := len(j.RSM()["val"].Close); got != originalCount {
		t.Errorf("empty Include should be noop; before=%d after=%d", originalCount, got)
	}
}

func TestRuleIncludeMultipleTags(t *testing.T) {
	// Comma-separated includes: an alt survives if it matches any listed tag.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "alpha"},
					{S: "#CA", G: "beta"},
					{S: "#CS", G: "gamma"},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	j.SetOptions(Options{Rule: &RuleOptions{Include: "alpha,gamma"}})

	// We expect the alpha and gamma alts preserved; beta dropped.
	sawAlpha := false
	sawBeta := false
	sawGamma := false
	for _, a := range j.RSM()["val"].Close {
		for _, part := range strings.Split(a.G, ",") {
			switch strings.TrimSpace(part) {
			case "alpha":
				sawAlpha = true
			case "beta":
				sawBeta = true
			case "gamma":
				sawGamma = true
			}
		}
	}
	if !sawAlpha || !sawGamma {
		t.Errorf("expected alpha and gamma preserved, sawAlpha=%v sawGamma=%v", sawAlpha, sawGamma)
	}
	if sawBeta {
		t.Error("expected beta dropped by include=alpha,gamma")
	}
}

// --- include + exclude ordering ---

func TestRuleIncludeThenExclude(t *testing.T) {
	// Apply include first, then exclude, within a single SetOptions call.
	// An alt tagged "keep,drop" makes it past include but is removed by
	// exclude — verifying the documented ordering.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "keep"},
					{S: "#CA", G: "keep,drop"},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	j.SetOptions(Options{Rule: &RuleOptions{Include: "keep", Exclude: "drop"}})

	gotKeepOnly := false
	for _, a := range j.RSM()["val"].Close {
		if a.G == "keep" {
			gotKeepOnly = true
		}
		if strings.Contains(a.G, "drop") {
			t.Errorf("expected 'drop'-tagged alt removed, got G=%q", a.G)
		}
	}
	if !gotKeepOnly {
		t.Error("expected the solo 'keep'-tagged alt to survive")
	}
}

// --- text + grammar-text paths ---

func TestGrammarTextAppliesInclude(t *testing.T) {
	// rule.include declared in a jsonic grammar text string is honoured.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "keep"},
					{S: "#CA", G: "other"},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := j.GrammarText(`options: { rule: { include: "keep" } }`); err != nil {
		t.Fatal(err)
	}

	for _, a := range j.RSM()["val"].Close {
		if a.G == "" {
			t.Error("untagged alt should be dropped by include")
		}
		matched := false
		for _, tag := range strings.Split(a.G, ",") {
			if strings.TrimSpace(tag) == "keep" {
				matched = true
				break
			}
		}
		if !matched {
			t.Errorf("alt with G=%q survived include=keep", a.G)
		}
	}
}

func TestSetOptionsTextInclude(t *testing.T) {
	// SetOptionsText can flip the include filter via a jsonic snippet.
	j := Make()
	err := j.Grammar(&GrammarSpec{
		Rule: map[string]*GrammarRuleSpec{
			"val": {
				Close: []*GrammarAltSpec{
					{S: "#ZZ", G: "picked"},
					{S: "#CA", G: "dropped"},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	if _, err := j.SetOptionsText(`rule: { include: "picked" }`); err != nil {
		t.Fatal(err)
	}

	for _, a := range j.RSM()["val"].Close {
		for _, tag := range strings.Split(a.G, ",") {
			if strings.TrimSpace(tag) == "dropped" {
				t.Errorf("alt with G=%q survived include=picked", a.G)
			}
		}
	}
}

// --- end-to-end parse behaviour ---

func TestRuleIncludePreservesParsingForTaggedAlts(t *testing.T) {
	// Walk every rule in the default grammar and directly mutate each
	// AltSpec.G to prefix "json," — this simulates a "json"-tagged
	// variant that includes every existing alt. Then include="json"
	// must keep the whole grammar, so normal parsing still works.
	j := Make()
	for _, rs := range j.RSM() {
		for _, a := range rs.Open {
			a.G = appendTag(a.G, "json")
		}
		for _, a := range rs.Close {
			a.G = appendTag(a.G, "json")
		}
	}

	j.SetOptions(Options{Rule: &RuleOptions{Include: "json"}})

	out, err := j.Parse(`{"a":1,"b":[2,3]}`)
	if err != nil {
		t.Fatal(err)
	}
	m, ok := out.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", out)
	}
	if m["a"] != float64(1) {
		t.Errorf("a: expected 1, got %v", m["a"])
	}
	l, ok := m["b"].([]any)
	if !ok || len(l) != 2 || l[0] != float64(2) || l[1] != float64(3) {
		t.Errorf("b: expected [2,3], got %v", m["b"])
	}
}

func TestRuleIncludeBreaksParsingWhenGrammarHasNoMatchingTags(t *testing.T) {
	// If nothing in the grammar is tagged with the include group, the
	// filter wipes out every alt — parsing the simplest input must fail.
	j := Make()
	j.SetOptions(Options{Rule: &RuleOptions{Include: "doesnotexist"}})

	if _, err := j.Parse(`{"a":1}`); err == nil {
		t.Error("expected parse error after include wiped the grammar")
	}
}

// appendTag returns g with "tag" appended; handles the empty-G case.
func appendTag(g, tag string) string {
	if g == "" {
		return tag
	}
	return g + "," + tag
}

package jsonic

import (
	"strings"
	"testing"
)

// --- Line comment suffixes ---

func TestCommentLineSuffixSingleString(t *testing.T) {
	// Suffix `@@` terminates the comment and is consumed. The following
	// `b:2` is then parsed as a normal pair.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash-inline": {Line: true, Start: "#", Lex: &yes, Suffix: "@@"},
		},
	}})

	out, err := j.Parse(`a:1,# mid @@b:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["a"] != float64(1) {
		t.Errorf("a: got %v", m["a"])
	}
	if m["b"] != float64(2) {
		t.Errorf("b: got %v (suffix didn't terminate the comment)", m["b"])
	}
}

func TestCommentLineSuffixMultiple(t *testing.T) {
	// Any of the listed suffixes terminates the comment. The suffix is
	// consumed, so the input after STOP parses cleanly as b:2.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", Lex: &yes, Suffix: []string{"END", "STOP"}},
		},
	}})

	out, err := j.Parse(`a:1,# noise STOPb:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["b"] != float64(2) {
		t.Errorf("expected STOP to terminate and be consumed, got %v", m)
	}
}

func TestCommentLineSuffixPreferredLongestFirst(t *testing.T) {
	// Given overlapping suffixes, the longer match wins and is fully
	// consumed — so only `b:2` remains after the comment.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", Lex: &yes, Suffix: []string{"@", "@@"}},
		},
	}})

	out, err := j.Parse(`a:1,# stop@@b:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["b"] != float64(2) {
		t.Errorf("expected '@@' to terminate and consume, got %v", m)
	}
	// `@` alone must not survive either, or it would become text.
	if _, stray := m["@"]; stray {
		t.Errorf("stray '@' key: %v", m)
	}
}

func TestCommentLineSuffixIsConsumed(t *testing.T) {
	// The suffix is eaten by the comment, so the key's value is the
	// implicit-null of a bare `a:` (no text follows).
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", Lex: &yes, Suffix: "@@"},
		},
	}})

	// Suffix runs until `@@`, which is consumed — nothing follows.
	out, err := j.Parse(`a:# noise @@`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if _, has := m["a"]; !has {
		t.Errorf("expected 'a' key to exist with implicit value, got %v", m)
	}
}

func TestCommentLineSuffixFallsBackToNewline(t *testing.T) {
	// When no suffix marker appears, the line-char still terminates.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", Lex: &yes, Suffix: "END"},
		},
	}})

	out, err := j.Parse("a:1\n# no-marker\nb:2")
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["a"] != float64(1) || m["b"] != float64(2) {
		t.Errorf("line fallback broken: %v", m)
	}
}

// --- EatLine interaction ---

func TestCommentLineSuffixBeatsEatLine(t *testing.T) {
	// EatLine only runs when termination came from a line-char.
	// Suffix-terminated comments leave newlines for the next matcher.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {
				Line:    true,
				Start:   "#",
				Lex:     &yes,
				EatLine: &yes,
				Suffix:  "@@",
			},
		},
	}})

	// `@@` consumes the suffix; the following newline stays in input so
	// `b:2` on the next line is parsed as its own pair.
	out, err := j.Parse("a:1,# note @@\nb:2")
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["a"] != float64(1) || m["b"] != float64(2) {
		t.Errorf("eatline-with-suffix misbehaved: %v", m)
	}
}

// --- Block comment suffixes ---

func TestCommentBlockSuffixEarlyTermination(t *testing.T) {
	// A suffix inside a block comment terminates and is consumed, so a
	// missing End marker is no longer an error.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"block": {
				Line:   false,
				Start:  "/*",
				End:    "*/",
				Lex:    &yes,
				Suffix: "!!",
			},
		},
	}})

	// No `*/` at all; `!!` ends the comment and is consumed.
	out, err := j.Parse(`a:/* note !!1,b:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["a"] != float64(1) || m["b"] != float64(2) {
		t.Errorf("block suffix early-termination failed: %v", m)
	}
}

func TestCommentBlockSuffixStillHonoursEnd(t *testing.T) {
	// When neither suffix nor end is present, unterminated is still bad.
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"block": {
				Line:   false,
				Start:  "/*",
				End:    "*/",
				Lex:    &yes,
				Suffix: "!!",
			},
		},
	}})

	if _, err := j.Parse(`a:/* never ends`); err == nil {
		t.Error("expected unterminated_comment error")
	} else if !strings.Contains(err.Error(), "unterminated") {
		t.Errorf("wrong error: %v", err)
	}
}

func TestCommentBlockSuffixLosesToEndWhenCloser(t *testing.T) {
	// If End appears before any suffix, End wins (and is consumed).
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"block": {
				Line:   false,
				Start:  "/*",
				End:    "*/",
				Lex:    &yes,
				Suffix: "!!",
			},
		},
	}})

	// End arrives first — comment consumes through `*/`.
	out, err := j.Parse(`a:/* note */1,b:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["a"] != float64(1) || m["b"] != float64(2) {
		t.Errorf("end-first path broke: %v", m)
	}
}

// --- LexMatcher-form suffix ---

func TestCommentSuffixLexMatcherTerminates(t *testing.T) {
	// A LexMatcher that returns a 2-char token at the `!!` boundary
	// terminates the comment body and consumes 2 chars.
	yes := true
	matcher := LexMatcher(func(lex *Lex, _ *Rule) *Token {
		if lex.pnt.SI+2 <= len(lex.Src) && lex.Src[lex.pnt.SI:lex.pnt.SI+2] == "!!" {
			return &Token{Src: "!!"}
		}
		return nil
	})
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", Lex: &yes, Suffix: matcher},
		},
	}})

	// `!!` fires the matcher and is consumed; `b` is the value of `a`.
	out, err := j.Parse(`a:# noise !!b`)
	if err != nil {
		t.Fatal(err)
	}
	if m := out.(map[string]any); m["a"] != "b" {
		t.Errorf("expected suffix matcher to consume !!, got %v", m["a"])
	}
}

func TestCommentSuffixLexMatcherCannotAdvance(t *testing.T) {
	// A misbehaving suffix matcher that tries to advance the point must
	// be prevented from doing so — the point is snapshotted/restored.
	// This matcher returns an empty-Src token, so len(Src)==0 means the
	// probe does not terminate, and parsing simply proceeds to EOL.
	yes := true
	matcher := LexMatcher(func(lex *Lex, _ *Rule) *Token {
		lex.pnt.SI += 100  // malicious advance
		return &Token{Src: ""}
	})
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", Lex: &yes, Suffix: matcher},
		},
	}})

	// The comment runs to end-of-input safely. `a` is an implicit-null
	// binding.
	out, err := j.Parse(`a:#noisy`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if _, has := m["a"]; !has {
		t.Errorf("expected 'a' key to survive, got %v", m)
	}
}

// --- Text round-trip ---

func TestCommentSuffixFromTextString(t *testing.T) {
	// Use `!!` so ResolveFuncRefs (which collapses `@@x` → `@x`) does not
	// rewrite our suffix.
	j := Make()
	if err := j.GrammarText(`options: {
		comment: {
			def: { hash: { line: true, start: "#", lex: true, suffix: "!!" } }
		}
	}`); err != nil {
		t.Fatal(err)
	}

	out, err := j.Parse(`a:1,# note !!b:2`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["b"] != float64(2) {
		t.Errorf("text-form suffix ignored: %v", m)
	}
}

func TestCommentSuffixFromTextArray(t *testing.T) {
	j := Make()
	if err := j.GrammarText(`options: {
		comment: {
			def: { hash: { line: true, start: "#", lex: true, suffix: ["!!", "?!"] } }
		}
	}`); err != nil {
		t.Fatal(err)
	}

	// `?!` ends the comment and is consumed; `c:3` survives.
	out, err := j.Parse(`a:1,# note ?!c:3`)
	if err != nil {
		t.Fatal(err)
	}
	m := out.(map[string]any)
	if m["c"] != float64(3) {
		t.Errorf("array-form suffix ignored: %v", m)
	}
}

// --- Config-level normalization ---

func TestNormalizeCommentSuffixStringForms(t *testing.T) {
	strs, fn := normalizeCommentSuffix("abc")
	if len(strs) != 1 || strs[0] != "abc" || fn != nil {
		t.Errorf("string form: got %v fn=%v", strs, fn != nil)
	}

	strs, fn = normalizeCommentSuffix([]string{"a", "bbb", "cc"})
	// Sorted longest-first, then lexicographic.
	if len(strs) != 3 || strs[0] != "bbb" || strs[1] != "cc" || strs[2] != "a" {
		t.Errorf("longest-first sort broken: %v", strs)
	}
	if fn != nil {
		t.Errorf("unexpected fn for string-slice form")
	}
}

func TestNormalizeCommentSuffixNilAndEmpty(t *testing.T) {
	strs, fn := normalizeCommentSuffix(nil)
	if len(strs) != 0 || fn != nil {
		t.Errorf("nil should yield empty: %v %v", strs, fn != nil)
	}
	strs, fn = normalizeCommentSuffix("")
	if len(strs) != 0 || fn != nil {
		t.Errorf("empty string should yield empty: %v %v", strs, fn != nil)
	}
}

package jsonic

// Alignment tests validate that Go behavior matches the authoritative TypeScript
// implementation. Tests are split into two categories:
//
// 1. Shared TSV tests (alignment-*.tsv) - input/expected pairs that both TS and
//    Go runners validate, ensuring identical parse results.
//
// 2. Direct Go tests - for features requiring custom options, error checking, or
//    Go-specific APIs that cannot be expressed in a simple TSV format.

import (
	"path/filepath"
	"strings"
	"testing"
)

// =====================================================================
// Shared TSV tests (also run by TS in test/alignment.test.js)
// =====================================================================

// TestAlignmentValues tests that NaN, Infinity, etc. are parsed as text, not
// as special float values. TS has never had these in default value.def.
func TestAlignmentValues(t *testing.T) {
	runParserTSV(t, "alignment-values.tsv", Make())
}

// TestAlignmentSafeKey tests that __proto__ and constructor keys are blocked
// when safe.key is true (the default).
func TestAlignmentSafeKey(t *testing.T) {
	runParserTSV(t, "alignment-safe-key.tsv", Make())
}

// TestAlignmentMapMerge tests duplicate-key deep merge behavior with default
// map.extend=true setting.
func TestAlignmentMapMerge(t *testing.T) {
	runParserTSV(t, "alignment-map-merge.tsv", Make())
}

// TestAlignmentNumberText tests that number-like strings followed by text
// characters are parsed as text (e.g. "1a" -> "1a").
func TestAlignmentNumberText(t *testing.T) {
	runParserTSV(t, "alignment-number-text.tsv", Make())
}

// TestAlignmentStructure tests auto-close behavior for unclosed structures.
func TestAlignmentStructure(t *testing.T) {
	runParserTSV(t, "alignment-structure.tsv", Make())
}

// TestAlignmentEmpty tests that empty/comment-only inputs return null.
func TestAlignmentEmpty(t *testing.T) {
	path := filepath.Join(specDir(), "alignment-empty.tsv")
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load alignment-empty.tsv: %v", err)
	}

	j := Make()
	for _, row := range rows {
		if len(row.cols) < 2 {
			continue
		}
		input := preprocessEscapes(row.cols[0])
		expectedStr := row.cols[1]

		// "null" in the expected column means nil result.
		if expectedStr != "null" {
			t.Errorf("line %d: unexpected expected value %q (only null supported)", row.lineNo, expectedStr)
			continue
		}

		got, err := j.Parse(input)
		if err != nil {
			t.Errorf("line %d: Parse(%q) error: %v", row.lineNo, input, err)
			continue
		}
		gotPlain := stripRefs(got)
		if gotPlain != nil {
			t.Errorf("line %d: Parse(%q) got %s, expected nil",
				row.lineNo, input, formatValue(gotPlain))
		}
	}
}

// TestAlignmentErrors tests that specific inputs produce parse errors.
// TSV format: input<TAB>ERROR:<code>
func TestAlignmentErrors(t *testing.T) {
	path := filepath.Join(specDir(), "alignment-errors.tsv")
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load alignment-errors.tsv: %v", err)
	}

	j := Make()
	for _, row := range rows {
		if len(row.cols) < 2 {
			continue
		}
		input := preprocessEscapes(row.cols[0])
		expectedStr := row.cols[1]

		if !strings.HasPrefix(expectedStr, "ERROR:") {
			t.Errorf("line %d: expected column must start with ERROR:, got %q", row.lineNo, expectedStr)
			continue
		}
		expectedCode := strings.TrimPrefix(expectedStr, "ERROR:")

		_, parseErr := j.Parse(input)
		if parseErr == nil {
			t.Errorf("line %d: Parse(%q) should have returned error (expected %s), got nil",
				row.lineNo, input, expectedCode)
			continue
		}
		je, ok := parseErr.(*JsonicError)
		if !ok {
			t.Errorf("line %d: Parse(%q) error should be *JsonicError, got %T: %v",
				row.lineNo, input, parseErr, parseErr)
			continue
		}
		if je.Code != expectedCode {
			t.Errorf("line %d: Parse(%q) error code got %q, want %q",
				row.lineNo, input, je.Code, expectedCode)
		}
	}
}

// --- Error TSV runner (2-column: input, ERROR:<code>) ---

func runErrorTSV(t *testing.T, file string, j *Jsonic) {
	t.Helper()
	path := filepath.Join(specDir(), file)
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load %s: %v", file, err)
	}

	for _, row := range rows {
		if len(row.cols) < 2 {
			continue
		}
		input := preprocessEscapes(row.cols[0])
		expectedStr := row.cols[1]

		if !strings.HasPrefix(expectedStr, "ERROR:") {
			t.Errorf("line %d: expected must start with ERROR:, got %q", row.lineNo, expectedStr)
			continue
		}
		expectedCode := strings.TrimPrefix(expectedStr, "ERROR:")

		_, parseErr := j.Parse(input)
		if parseErr == nil {
			t.Errorf("line %d: Parse(%q) should error (want %s), got nil", row.lineNo, input, expectedCode)
			continue
		}
		je, ok := parseErr.(*JsonicError)
		if !ok {
			t.Errorf("line %d: Parse(%q) error should be *JsonicError, got %T", row.lineNo, input, parseErr)
			continue
		}
		if je.Code != expectedCode {
			t.Errorf("line %d: Parse(%q) error code got %q, want %q", row.lineNo, input, je.Code, expectedCode)
		}
	}
}

// --- Lex error propagation tests ---
// Verifies that lex-level errors are not masked by generic "unexpected"
// in any parser state.

func TestLexErrorsDefault(t *testing.T) {
	runErrorTSV(t, "lex-errors.tsv", Make())
}

func TestLexErrorsExcludeJsonicImp(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Exclude: "jsonic,imp"}})
	runErrorTSV(t, "lex-errors.tsv", j)
}

func TestLexErrorsExcludeJsonicImpComma(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Exclude: "jsonic,imp,comma"}})
	runErrorTSV(t, "lex-errors.tsv", j)
}

// --- Exclude group TSV tests ---

func TestExcludeStrictJSON(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Exclude: "jsonic,imp"}})
	runParserTSV(t, "exclude-strict-json.tsv", j)
}

func TestExcludeStrictJSONErrors(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Exclude: "jsonic,imp"}})
	runErrorTSV(t, "exclude-strict-json-errors.tsv", j)
}

func TestExcludeComma(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Exclude: "comma"}})
	runParserTSV(t, "exclude-comma.tsv", j)
}

func TestExcludeCommaErrors(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Exclude: "comma"}})
	runErrorTSV(t, "exclude-comma-errors.tsv", j)
}

// --- Include group TSV tests (parity for rule.include) ---

// TestIncludeJSON runs the shared include-json.tsv to confirm that
// include="json" produces the same strict-JSON surface as the
// TypeScript runner.
func TestIncludeJSON(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Include: "json"}})
	runParserTSV(t, "include-json.tsv", j)
}

func TestIncludeJSONErrors(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Include: "json"}})
	runErrorTSV(t, "include-json-errors.tsv", j)
}

// --- Comment suffix TSV tests (parity for comment.def.suffix) ---

// TestFeatureCommentSuffixLine exercises the shared comment-suffix-line
// TSV with a hash line-comment that terminates at a custom '@@' suffix.
func TestFeatureCommentSuffixLine(t *testing.T) {
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash":  {Line: true, Start: "#", Lex: &yes, Suffix: "@@"},
			"line":  {Line: true, Start: "//", Lex: &yes},
			"block": {Line: false, Start: "/*", End: "*/", Lex: &yes},
		},
	}})
	runParserTSV(t, "feature-comment-suffix-line.tsv", j)
}

// TestFeatureCommentSuffixBlock exercises the shared
// comment-suffix-block TSV with a /* */ block comment that also
// accepts a '!!' suffix to terminate early.
func TestFeatureCommentSuffixBlock(t *testing.T) {
	yes := true
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash":  {Line: true, Start: "#", Lex: &yes},
			"line":  {Line: true, Start: "//", Lex: &yes},
			"block": {Line: false, Start: "/*", End: "*/", Lex: &yes, Suffix: "!!"},
		},
	}})
	runParserTSV(t, "feature-comment-suffix-block.tsv", j)
}

// =====================================================================
// Direct Go tests for option-dependent alignment features
// =====================================================================

// --- Map merge: extend=false (overwrite, no deep merge) ---

func TestAlignmentMapExtendFalse(t *testing.T) {
	j := Make(Options{Map: &MapOptions{Extend: boolPtr(false)}})

	// With extend=false, duplicate keys overwrite (no deep merge).
	got, err := j.Parse("{a:{b:1},a:{c:2}}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("a", m("c", 2.0))
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("map.extend=false: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}
}

// --- Map merge: custom merge function ---

func TestAlignmentMapMergeFunc(t *testing.T) {
	// Custom merge: always keep the previous value (ignore new).
	j := Make(Options{Map: &MapOptions{
		Merge: func(prev, val any, r *Rule, ctx *Context) any {
			return prev // always keep prev
		},
	}})

	got, err := j.Parse("{a:1,a:2}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("a", 1.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("map.merge func: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}
}

// --- safe.key on arrays: __proto__ blocked in lists ---

func TestAlignmentSafeKeyArray(t *testing.T) {
	j := Make() // safe.key=true by default

	// On objects: __proto__ is allowed (Go maps have no prototypes,
	// same as TS's Object.create(null)).
	got, err := j.Parse("{__proto__:1,a:2}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("__proto__", 1.0, "a", 2.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("safe.key on object: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}

	// On arrays with list.property: __proto__ key is blocked.
	// [1,2,__proto__:x] should produce [1,2] with __proto__ pair dropped.
	j2 := Make(Options{List: &ListOptions{Property: boolPtr(true)}})
	got2, err2 := j2.Parse("[1,2,__proto__:3]")
	if err2 != nil {
		t.Fatalf("unexpected error: %v", err2)
	}
	expected2 := a(1.0, 2.0)
	if !valuesEqual(stripRefs(got2), expected2) {
		t.Errorf("safe.key on array: got %s, want %s", formatValue(stripRefs(got2)), formatValue(expected2))
	}
}

// --- safe.key=false allows __proto__ on arrays ---

func TestAlignmentSafeKeyFalse(t *testing.T) {
	j := Make(Options{Safe: &SafeOptions{Key: boolPtr(false)}})

	got, err := j.Parse("{__proto__:1,a:2}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("__proto__", 1.0, "a", 2.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("safe.key=false: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}
}

// --- String escape errors produce error tokens ---

func TestAlignmentStringEscapeErrors(t *testing.T) {
	j := Make(Options{String: &StringOptions{AllowUnknown: boolPtr(false)}})

	// With allowUnknown=false, unknown escape like \w should error.
	_, err := j.Parse(`"\w"`)
	if err == nil {
		t.Error(`Parse("\\w") with allowUnknown=false should error`)
	}
}

// --- String abandon: fallthrough on error ---

func TestAlignmentStringAbandon(t *testing.T) {
	j := Make(Options{String: &StringOptions{Abandon: boolPtr(true)}})

	// With abandon=true, an unterminated string returns nil from matcher,
	// allowing subsequent matchers to try. This means the quote char becomes
	// part of text or causes a different error.
	// In TS: string.abandon=true means the string matcher returns undefined on
	// failure, falling through to subsequent matchers.
	// The input `"abc` with abandon starts with `"` which fails as string,
	// then text matcher picks up `"abc` as text.
	got, err := j.Parse(`"abc`)
	if err != nil {
		// With abandon, the string matcher falls through. The quote char
		// may still cause an error depending on what other matchers do,
		// but it should NOT be "unterminated_string".
		if je, ok := err.(*JsonicError); ok && je.Code == "unterminated_string" {
			t.Errorf("string.abandon=true should not produce unterminated_string error, got: %v", err)
		}
	}
	// If no error, the input was parsed as text (which is the TS behavior).
	_ = got
}

// --- String replace: character replacement during scanning ---

func TestAlignmentStringReplace(t *testing.T) {
	j := Make(Options{String: &StringOptions{
		Replace: map[rune]string{
			'A': "B",
			'D': "",
		},
	}})

	got, err := j.Parse(`"aAc"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "aBc" {
		t.Errorf(`string.replace: Parse("aAc") got %q, want "aBc"`, got)
	}

	got, err = j.Parse(`"aAcDe"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "aBce" {
		t.Errorf(`string.replace: Parse("aAcDe") got %q, want "aBce"`, got)
	}
}

// --- Number exclude: reject certain number-like strings ---

func TestAlignmentNumberExclude(t *testing.T) {
	j := Make(Options{Number: &NumberOptions{
		Exclude: func(s string) bool {
			// Exclude numbers starting with "00"
			return strings.HasPrefix(s, "00")
		},
	}})

	// "0099" matches exclude pattern, so it's parsed as text.
	got, err := j.Parse("0099")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "0099" {
		t.Errorf(`number.exclude: Parse("0099") got %v (%T), want string "0099"`, got, got)
	}

	// "99" does not match exclude, so it's still a number.
	got, err = j.Parse("99")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 99.0 {
		t.Errorf(`number.exclude: Parse("99") got %v (%T), want 99.0`, got, got)
	}
}

// --- Line single: separate token per newline ---

func TestAlignmentLineSingle(t *testing.T) {
	// line.single primarily affects lexer behavior. We test via parsing since
	// multiple newlines between values should still parse correctly.
	j := Make(Options{Line: &LineOptions{Single: boolPtr(true)}})

	got, err := j.Parse("a\n\nb")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := a("a", "b")
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("line.single: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}
}

// --- Comment eatline: consume trailing line chars ---

func TestAlignmentCommentEatLine(t *testing.T) {
	j := Make(Options{Comment: &CommentOptions{
		Def: map[string]*CommentDef{
			"hash": {Line: true, Start: "#", EatLine: boolPtr(true)},
			"line": {Line: true, Start: "//"},
			"block": {Line: false, Start: "/*", End: "*/"},
		},
	}})

	// With eatline, the comment consumes the trailing newline too.
	// "a#x\nb" - # comment eats the \n, so b follows directly.
	got, err := j.Parse("a:1#x\nb:2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("a", 1.0, "b", 2.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("comment.eatline: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}
}

// --- Text modify: transform text values ---

func TestAlignmentTextModify(t *testing.T) {
	j := Make(Options{Text: &TextOptions{
		Modify: []ValModifier{
			func(val any) any {
				if s, ok := val.(string); ok {
					return strings.ToUpper(s)
				}
				return val
			},
		},
	}})

	got, err := j.Parse("hello")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "HELLO" {
		t.Errorf(`text.modify: Parse("hello") got %q, want "HELLO"`, got)
	}

	// Quoted strings are NOT affected by text.modify (only unquoted text).
	got, err = j.Parse(`"hello"`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "hello" {
		t.Errorf(`text.modify: Parse('"hello"') got %q, want "hello"`, got)
	}
}

// --- list.property guard: error when disabled ---

func TestAlignmentListPropertyGuard(t *testing.T) {
	j := Make(Options{List: &ListOptions{
		Property: boolPtr(false),
		Pair:     boolPtr(false),
	}})

	// [a:1] should error when list.property and list.pair are both false.
	_, err := j.Parse("[a:1]")
	if err == nil {
		t.Error("Parse(\"[a:1]\") with list.property=false should return error")
	}
}

// --- Exclude (alt.g tags): strict JSON mode ---

// TestAlignmentGrammarGTags validates that every grammar alt G-tag in Go
// matches the authoritative TypeScript grammar (dist/grammar.js).
// The TS grammar builds rules in two phases (JSON base + jsonic extensions)
// with append/prepend/delete/move operations. The final alt order and tags
// must be identical.
func TestAlignmentGrammarGTags(t *testing.T) {
	j := Make()

	// Expected G-tags per rule, per state, in order.
	// Source of truth: TS dist/grammar.js after JSON + jsonic extension phases.
	type ruleGTags struct {
		name  string
		open  []string
		close []string
	}

	expected := []ruleGTags{
		{
			name: "val",
			open: []string{
				"map,json",                  // #OB -> map
				"list,json",                 // #OS -> list
				"pair,jsonic,top",           // #KEY #CL d=0 -> map
				"pair,jsonic",               // #KEY #CL -> map (dive)
				"val,json",                  // #VAL
				"val,imp,null,jsonic",       // #CB|#CS impl null
				"list,imp,jsonic",           // #CA d=0 -> list
				"list,val,imp,null,jsonic",  // #CA impl null
				"jsonic",                    // #ZZ
			},
			close: []string{
				"end,json",                  // #ZZ end
				"val,json,close",            // #CB|#CS close error
				"list,val,imp,comma,jsonic", // #CA -> list (comma)
				"list,val,imp,space,jsonic", // imp list (space)
				"jsonic",                    // #ZZ jsonic
				"more,json",                 // b:1 more
			},
		},
		{
			name: "map",
			open: []string{
				"end,jsonic",              // #OB #ZZ autoclose
				"map,json",                // #OB #CB empty
				"map,json,pair",           // #OB -> pair
				"pair,list,val,imp,jsonic", // #KEY #CL -> pair (imp)
			},
			close: []string{
				"end,json",        // #CB n.pk<=0
				"path,jsonic",     // #CB path dive
				"end,path,jsonic", // #CA|#CS|#VAL end path
				"end,jsonic",      // #ZZ autoclose
			},
		},
		{
			name: "list",
			open: []string{
				"",                          // implist cond (no tag)
				"list,json",                 // #OS #CS empty
				"list,elem,json",            // #OS -> elem
				"list,elem,val,imp,jsonic",  // #CA -> elem (imp)
				"list,elem,jsonic",          // -> elem default
			},
			close: []string{
				"end,json",   // #CS end
				"end,jsonic", // #ZZ autoclose
			},
		},
		{
			name: "pair",
			open: []string{
				"map,pair,key,json",    // #KEY #CL -> val
				"map,pair,comma,jsonic", // #CA comma
			},
			close: []string{
				"map,pair,json",             // #CB n.pk<=0
				"map,pair,comma,jsonic",     // #CA #CB trailing comma
				"end,jsonic",                // #CA #ZZ end
				"map,pair,json",             // #CA n.pk<=0 -> pair
				"map,pair,jsonic",           // #CA n.dmap<=1 -> pair
				"map,pair,imp,jsonic",       // #KEY n.dmap<=1 -> pair
				"map,pair,imp,path,jsonic",  // #CB|#CA|#CS|#KEY n.pk>0 path
				"end,jsonic",                // #CS error
				"map,pair,json",             // #ZZ @finish
				"map,pair,imp,jsonic",       // -> pair (catchall)
			},
		},
		{
			name: "elem",
			open: []string{
				"list,elem,imp,null,jsonic", // #CA #CA double comma
				"list,elem,imp,null,jsonic", // #CA single comma
				"elem,pair,jsonic",          // #KEY #CL -> val (pair)
				// Note: ListChild alt ("elem,child,jsonic") only present when cfg.ListChild is true.
				"list,elem,val,json",        // -> val default
			},
			close: []string{
				"list,elem,comma,jsonic", // #CA, #CS|#ZZ trailing comma
				"list,elem,json",         // #CA -> elem
				"list,elem,json",         // #CS end
				"list,elem,json",         // #ZZ @finish
				"end,jsonic",             // #CB error
				"list,elem,imp,jsonic",   // -> elem (catchall)
			},
		},
	}

	for _, exp := range expected {
		rs, ok := j.parser.RSM[exp.name]
		if !ok {
			t.Errorf("rule %q not found in grammar", exp.name)
			continue
		}

		// Check open alts.
		if len(rs.Open) != len(exp.open) {
			t.Errorf("rule %q open: got %d alts, want %d", exp.name, len(rs.Open), len(exp.open))
		} else {
			for i, alt := range rs.Open {
				if alt.G != exp.open[i] {
					t.Errorf("rule %q open[%d]: G=%q, want %q", exp.name, i, alt.G, exp.open[i])
				}
			}
		}

		// Check close alts.
		if len(rs.Close) != len(exp.close) {
			t.Errorf("rule %q close: got %d alts, want %d", exp.name, len(rs.Close), len(exp.close))
		} else {
			for i, alt := range rs.Close {
				if alt.G != exp.close[i] {
					t.Errorf("rule %q close[%d]: G=%q, want %q", exp.name, i, alt.G, exp.close[i])
				}
			}
		}
	}
}

func TestAlignmentExclude(t *testing.T) {
	// Exclude removes alternates tagged with matching group tags.
	// Verify the mechanism works by checking that alternates are removed.
	j := Make()

	// Count alternates before and after exclude.
	valSpec := j.parser.RSM["val"]
	openBefore := len(valSpec.Open)
	closeBefore := len(valSpec.Close)

	j.SetOptions(Options{Rule: &RuleOptions{Exclude: "jsonic"}})

	openAfter := len(valSpec.Open)
	closeAfter := len(valSpec.Close)

	// After excluding "jsonic", there should be fewer alternates.
	if openAfter >= openBefore {
		t.Errorf("exclude: val.Open should have fewer alts after exclude, got %d >= %d",
			openAfter, openBefore)
	}
	if closeAfter >= closeBefore {
		t.Errorf("exclude: val.Close should have fewer alts after exclude, got %d >= %d",
			closeAfter, closeBefore)
	}

	// Remaining alts should not contain the "jsonic" tag.
	for _, alt := range valSpec.Open {
		for _, tag := range strings.Split(alt.G, ",") {
			if strings.TrimSpace(tag) == "jsonic" {
				t.Errorf("exclude: val.Open alt still has jsonic tag in %q", alt.G)
			}
		}
	}
	for _, alt := range valSpec.Close {
		for _, tag := range strings.Split(alt.G, ",") {
			if strings.TrimSpace(tag) == "jsonic" {
				t.Errorf("exclude: val.Close alt still has jsonic tag in %q", alt.G)
			}
		}
	}
}

// --- result.fail: reject specific result values ---

func TestAlignmentResultFail(t *testing.T) {
	j := Make(Options{Property: &PropertyOptions{
		ConfigModify: map[string]ConfigModifier{
			"result-fail": func(cfg *LexConfig, opts *Options) {
				cfg.ResultFail = []any{"FAIL"}
			},
		},
	}})

	// A result matching a fail sentinel should cause an error.
	_, err := j.Parse("FAIL")
	if err == nil {
		t.Error("Parse(\"FAIL\") with result.fail=[\"FAIL\"] should return error")
	}

	// Normal values should still work.
	got, err := j.Parse("OK")
	if err != nil {
		t.Fatalf("Parse(\"OK\") unexpected error: %v", err)
	}
	if got != "OK" {
		t.Errorf("Parse(\"OK\") got %q, want \"OK\"", got)
	}
}

// --- parse.prepare: hooks before parsing ---

func TestAlignmentParsePrepare(t *testing.T) {
	prepared := false
	j := Make(Options{Property: &PropertyOptions{
		ConfigModify: map[string]ConfigModifier{
			"prepare": func(cfg *LexConfig, opts *Options) {
				cfg.ParsePrepare = append(cfg.ParsePrepare, func(ctx *Context) {
					prepared = true
				})
			},
		},
	}})

	_, err := j.Parse("a:1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !prepared {
		t.Error("parse.prepare hook was not called")
	}
}

// --- Empty source with empty=false ---

func TestAlignmentEmptyDisabled(t *testing.T) {
	j := Make(Options{Lex: &LexOptions{Empty: boolPtr(false)}})

	_, err := j.Parse("")
	if err == nil {
		t.Error("Parse(\"\") with lex.empty=false should return error")
	}
}

// --- Custom value definitions ---

func TestAlignmentCustomValues(t *testing.T) {
	j := Make(Options{Value: &ValueOptions{
		Def: map[string]*ValueDef{
			"true":  {Val: true},
			"false": {Val: false},
			"null":  {Val: nil},
			"NaN":   {Val: "NaN-custom"},
		},
	}})

	got, err := j.Parse("NaN")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "NaN-custom" {
		t.Errorf(`custom value: Parse("NaN") got %v, want "NaN-custom"`, got)
	}

	// true/false/null still work.
	got, err = j.Parse("true")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != true {
		t.Errorf(`custom value: Parse("true") got %v, want true`, got)
	}
}

// --- Deep merge on Options structs (reflection path) ---

func TestAlignmentDeepOptions(t *testing.T) {
	// Deep should work directly on Options structs, matching TS deep() on options objects.
	base := Options{
		Number:  &NumberOptions{Lex: boolPtr(true), Hex: boolPtr(true)},
		Comment: &CommentOptions{Lex: boolPtr(true)},
		Error:   map[string]string{"a": "1"},
	}
	over := Options{
		Number: &NumberOptions{Hex: boolPtr(false)},
		Error:  map[string]string{"b": "2"},
		Tag:    "test",
	}

	result := Deep(base, over)
	merged, ok := result.(Options)
	if !ok {
		t.Fatalf("Deep(Options, Options) returned %T, want Options", result)
	}

	// Number.Lex preserved from base (zero in over).
	if merged.Number == nil || merged.Number.Lex == nil || !*merged.Number.Lex {
		t.Error("expected Number.Lex to remain true")
	}
	// Number.Hex overridden.
	if merged.Number.Hex == nil || *merged.Number.Hex {
		t.Error("expected Number.Hex to be false")
	}
	// Comment preserved from base (nil in over).
	if merged.Comment == nil || merged.Comment.Lex == nil || !*merged.Comment.Lex {
		t.Error("expected Comment.Lex to remain true")
	}
	// Error maps merged.
	if merged.Error["a"] != "1" || merged.Error["b"] != "2" {
		t.Errorf("expected Error map merged, got %v", merged.Error)
	}
	// Tag from over.
	if merged.Tag != "test" {
		t.Errorf("expected Tag 'test', got %q", merged.Tag)
	}
}

func TestAlignmentDeepOptionsPointer(t *testing.T) {
	// Deep should also handle pointer-to-struct fields correctly.
	base := Options{
		String: &StringOptions{
			Lex:      boolPtr(true),
			Chars:    "'\"",
			Escape:   map[string]string{"n": "\n"},
			Abandon:  boolPtr(false),
		},
	}
	over := Options{
		String: &StringOptions{
			Escape:  map[string]string{"t": "\t"},
			Abandon: boolPtr(true),
		},
	}

	result := Deep(base, over).(Options)

	// Lex preserved.
	if result.String.Lex == nil || !*result.String.Lex {
		t.Error("expected String.Lex true")
	}
	// Chars preserved.
	if result.String.Chars != "'\"" {
		t.Errorf("expected String.Chars preserved, got %q", result.String.Chars)
	}
	// Escape maps merged.
	if result.String.Escape["n"] != "\n" || result.String.Escape["t"] != "\t" {
		t.Errorf("expected Escape merged, got %v", result.String.Escape)
	}
	// Abandon overridden.
	if result.String.Abandon == nil || !*result.String.Abandon {
		t.Error("expected String.Abandon true")
	}
}

// --- Deep merge with Undefined sentinel ---

func TestAlignmentDeepUndefined(t *testing.T) {
	// Undefined in the overlay should preserve the base value.
	base := map[string]any{"a": 1.0, "b": 2.0}
	over := map[string]any{"a": Undefined, "b": 3.0}

	result := Deep(base, over)
	rm, ok := result.(map[string]any)
	if !ok {
		t.Fatalf("Deep() returned %T, want map[string]any", result)
	}

	// "a" should be preserved from base (Undefined means "don't override").
	if rm["a"] != 1.0 {
		t.Errorf("Deep() a: got %v, want 1.0", rm["a"])
	}
	// "b" should be overridden.
	if rm["b"] != 3.0 {
		t.Errorf("Deep() b: got %v, want 3.0", rm["b"])
	}
}

// --- ModList: delete-move-filter order ---

func TestAlignmentModListOrder(t *testing.T) {
	// Verify that delete happens before move (TS behavior).
	// Input: [A, B, C, D, E] with delete=[1] (B), move=[3,0] (move index 3→0)
	// After delete: [A, C, D, E] (indices shift)
	// After move: move old-index-3 (D in original, but after delete adjustment)
	// This tests the order sensitivity.
	input := []any{"A", "B", "C", "D", "E"}
	result := ModList(input, &ModListOpts{
		Delete: []int{1},
		Move:   []int{3, 0},
	})

	// After delete [1]: [A, C, D, E]
	// Move [3,0] moves the item at original-index-3 (D) to position 0.
	// In TS: delete marks, then move operates on original indices, then filter.
	// Expected: [D, A, C, E]
	expected := []any{"D", "A", "C", "E"}
	if !valuesEqual(result, expected) {
		t.Errorf("ModList order: got %s, want %s", formatValue(result), formatValue(expected))
	}
}

// --- Number followed by fixed token (subMatchFixed alignment) ---

func TestAlignmentNumberFixedToken(t *testing.T) {
	// "123}" at top level should see 123 as a number, then } triggers error
	// since it's an unexpected close at top level.
	j := Make()

	// In a valid context: {a:123} - number followed by }
	got, err := j.Parse("{a:123}")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := m("a", 123.0)
	if !valuesEqual(stripRefs(got), expected) {
		t.Errorf("number+fixed: got %s, want %s", formatValue(stripRefs(got)), formatValue(expected))
	}

	// [1,2] - number followed by , and ]
	got, err = j.Parse("[1,2]")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expectedArr := a(1.0, 2.0)
	if !valuesEqual(stripRefs(got), expectedArr) {
		t.Errorf("number+fixed: got %s, want %s", formatValue(stripRefs(got)), formatValue(expectedArr))
	}
}

// --- Lex subscriber receives tokens ---

func TestAlignmentLexSubscriber(t *testing.T) {
	j := Make()
	var tokens []Tin
	j.Sub(func(tk *Token, r *Rule, ctx *Context) {
		tokens = append(tokens, tk.Tin)
	}, nil)

	_, err := j.Parse("a:1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tokens) == 0 {
		t.Error("lex subscriber was not called")
	}
}

// --- Rule subscriber fires before process ---

func TestAlignmentRuleSubscriberTiming(t *testing.T) {
	j := Make()
	var states []RuleState
	j.Sub(nil, func(r *Rule, ctx *Context) {
		states = append(states, r.State)
	})

	_, err := j.Parse("1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Subscriber fires BEFORE process, so the first call should see OPEN state.
	if len(states) == 0 {
		t.Fatal("rule subscriber was not called")
	}
	if states[0] != OPEN {
		t.Errorf("first rule subscriber call: state=%q, want %q (subscriber should fire before process)",
			states[0], OPEN)
	}
}

// --- Error propagation from alt.E ---

func TestAlignmentErrorPropagation(t *testing.T) {
	// Closing brace at top level should produce an error.
	j := Make()

	_, err := j.Parse("}")
	if err == nil {
		t.Fatal("Parse(\"}\") should return error")
	}
	je, ok := err.(*JsonicError)
	if !ok {
		t.Fatalf("error should be *JsonicError, got %T", err)
	}
	if je.Code != "unexpected" {
		t.Errorf("error code: got %q, want \"unexpected\"", je.Code)
	}

	_, err = j.Parse("]")
	if err == nil {
		t.Fatal("Parse(\"]\") should return error")
	}
	je, ok = err.(*JsonicError)
	if !ok {
		t.Fatalf("error should be *JsonicError, got %T", err)
	}
	if je.Code != "unexpected" {
		t.Errorf("error code: got %q, want \"unexpected\"", je.Code)
	}
}

// --- Trailing content detection ---

func TestAlignmentTrailingContent(t *testing.T) {
	j := Make()

	// "a:1,2" - after parsing a:1 as a map, the ,2 is trailing content
	// that can't fit into the map (TS throws unexpected).
	_, err := j.Parse("a:1,2")
	if err == nil {
		t.Error("Parse(\"a:1,2\") should return error for unexpected trailing content")
	}
}

// --- FinishRule=false: unclosed structures error ---

func TestAlignmentFinishRuleFalse(t *testing.T) {
	j := Make(Options{Rule: &RuleOptions{Finish: boolPtr(false)}})

	// With finish=false, unclosed { should error instead of auto-closing.
	_, err := j.Parse("{a:1")
	if err == nil {
		t.Error("Parse(\"{a:1\") with rule.finish=false should return error")
	}
}

// --- Snip: match TS snip() behavior ---

func TestAlignmentSnip(t *testing.T) {
	tests := []struct {
		input  string
		maxlen int
		expect string
	}{
		{"hello", 5, "hello"},
		{"hello", 3, "hel"},
		{"hello", 0, ""},
		{"hello", -1, ""},
		{"a\nb\tc\rd", 10, "a.b.c.d"},
		{"a\nb\tc\rd", 3, "a.b"},
		{"", 5, ""},
		{"\n\n\n", 3, "..."},
	}
	for _, tt := range tests {
		got := Snip(tt.input, tt.maxlen)
		if got != tt.expect {
			t.Errorf("Snip(%q, %d) = %q, want %q", tt.input, tt.maxlen, got, tt.expect)
		}
	}
}

// --- Str: match TS str() + snip() pipeline ---

func TestAlignmentStrNil(t *testing.T) {
	// TS: str(null) → JSON.stringify(null) → "null"
	got := Str(nil, 44)
	if got != "null" {
		t.Errorf("Str(nil, 44) = %q, want %q", got, "null")
	}
}

func TestAlignmentStrWhitespace(t *testing.T) {
	// TS: str() calls snip() which replaces \r\n\t with '.'
	got := Str("a\tb\nc", 44)
	if got != "a.b.c" {
		t.Errorf("Str(\"a\\tb\\nc\", 44) = %q, want %q", got, "a.b.c")
	}
}

func TestAlignmentStrTruncateWhitespace(t *testing.T) {
	// Truncation then snip: "12\t45" with maxlen 4 → truncate to "1..." → snip "1..."
	got := Str("12\t45", 4)
	if got != "1..." {
		t.Errorf("Str(\"12\\t45\", 4) = %q, want %q", got, "1...")
	}
}

// --- ModList: custom callback ---

func TestAlignmentModListCustom(t *testing.T) {
	// TS modlist supports mods.custom callback.
	input := []any{"a", "b", "c"}
	result := ModList(input, &ModListOpts{
		Custom: func(list []any) []any {
			// Reverse the list.
			n := len(list)
			reversed := make([]any, n)
			for i, v := range list {
				reversed[n-1-i] = v
			}
			return reversed
		},
	})
	expected := []any{"c", "b", "a"}
	if !valuesEqual(result, expected) {
		t.Errorf("ModList custom: got %v, want %v", result, expected)
	}
}

func TestAlignmentModListCustomNil(t *testing.T) {
	// When custom returns nil, the original list is preserved (matches TS).
	input := []any{"a", "b"}
	result := ModList(input, &ModListOpts{
		Custom: func(list []any) []any {
			return nil
		},
	})
	expected := []any{"a", "b"}
	if !valuesEqual(result, expected) {
		t.Errorf("ModList custom nil: got %v, want %v", result, expected)
	}
}

func TestAlignmentModListDeleteThenCustom(t *testing.T) {
	// Custom runs after delete+filter (matches TS order).
	input := []any{"a", "b", "c"}
	var customInput []any
	result := ModList(input, &ModListOpts{
		Delete: []int{1}, // delete "b"
		Custom: func(list []any) []any {
			customInput = append([]any{}, list...) // capture what custom sees
			return list
		},
	})
	// Custom should see ["a", "c"] (after "b" was deleted).
	expectedCustom := []any{"a", "c"}
	if !valuesEqual(customInput, expectedCustom) {
		t.Errorf("ModList custom saw %v, want %v", customInput, expectedCustom)
	}
	if !valuesEqual(result, expectedCustom) {
		t.Errorf("ModList result: got %v, want %v", result, expectedCustom)
	}
}

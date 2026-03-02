package jsonic

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"testing"
)

// stripRefs recursively unwraps ListRef, MapRef, and Text back to plain
// Go values ([]any, map[string]any, string) so they can be compared against
// JSON-unmarshaled expected values from TSV files.
func stripRefs(v any) any {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case ListRef:
		result := make([]any, len(val.Val))
		for i, elem := range val.Val {
			result[i] = stripRefs(elem)
		}
		return result
	case MapRef:
		result := make(map[string]any)
		for k, elem := range val.Val {
			result[k] = stripRefs(elem)
		}
		return result
	case Text:
		return val.Str
	case map[string]any:
		result := make(map[string]any)
		for k, elem := range val {
			result[k] = stripRefs(elem)
		}
		return result
	case []any:
		result := make([]any, len(val))
		for i, elem := range val {
			result[i] = stripRefs(elem)
		}
		return result
	default:
		return v
	}
}

// --- Standard parser TSV runner with custom options ---

// runParserTSV runs a standard 2-column TSV (input, expected) with a custom parser.
func runParserTSV(t *testing.T, file string, j *Jsonic) {
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
		input := row.cols[0]
		expectedStr := row.cols[1]

		expected, err := parseExpected(expectedStr)
		if err != nil {
			t.Errorf("line %d: failed to parse expected %q: %v", row.lineNo, expectedStr, err)
			continue
		}

		got, err := j.Parse(preprocessEscapes(input))
		if err != nil {
			t.Errorf("line %d: Parse(%q) error: %v", row.lineNo, input, err)
			continue
		}

		// Strip ListRef/MapRef/Text wrappers for JSON comparison.
		gotPlain := stripRefs(got)
		if !valuesEqual(gotPlain, expected) {
			t.Errorf("line %d: Parse(%q)\n  got:      %s\n  expected: %s",
				row.lineNo, input, formatValue(gotPlain), formatValue(expected))
		}
	}
}

// --- List-child TSV runner (3-column: input, expected_array, expected_child) ---

// runListChildTSV runs a list-child TSV file.
func runListChildTSV(t *testing.T, file string, j *Jsonic) {
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
		input := row.cols[0]
		expectedArrStr := row.cols[1]
		expectedChildStr := ""
		if len(row.cols) >= 3 {
			expectedChildStr = row.cols[2]
		}

		expectedArr, err := parseExpected(expectedArrStr)
		if err != nil {
			t.Errorf("line %d: failed to parse expected_array %q: %v", row.lineNo, expectedArrStr, err)
			continue
		}

		var expectedChild any
		if expectedChildStr != "" {
			expectedChild, err = parseExpected(expectedChildStr)
			if err != nil {
				t.Errorf("line %d: failed to parse expected_child %q: %v", row.lineNo, expectedChildStr, err)
				continue
			}
		}

		got, err := j.Parse(preprocessEscapes(input))
		if err != nil {
			t.Errorf("line %d: Parse(%q) error: %v", row.lineNo, input, err)
			continue
		}

		lr, ok := got.(ListRef)
		if !ok {
			t.Errorf("line %d: Parse(%q) expected ListRef, got %T: %s",
				row.lineNo, input, got, formatValue(got))
			continue
		}

		// Compare Val (strip inner refs for JSON comparison).
		gotArr := stripRefs(lr.Val)
		if !valuesEqual(gotArr, expectedArr) {
			t.Errorf("line %d: Parse(%q) Val\n  got:      %s\n  expected: %s",
				row.lineNo, input, formatValue(gotArr), formatValue(expectedArr))
		}

		// Compare Child.
		gotChild := stripRefs(lr.Child)
		if !valuesEqual(gotChild, expectedChild) {
			t.Errorf("line %d: Parse(%q) Child\n  got:      %s\n  expected: %s",
				row.lineNo, input, formatValue(gotChild), formatValue(expectedChild))
		}
	}
}

// --- feature-list-child.tsv ---

func TestTSVFeatureListChild(t *testing.T) {
	j := Make(Options{List: &ListOptions{Child: boolPtr(true)}})
	runListChildTSV(t, "feature-list-child.tsv", j)
}

// --- feature-list-child-deep.tsv ---

func TestTSVFeatureListChildDeep(t *testing.T) {
	j := Make(Options{List: &ListOptions{Child: boolPtr(true)}})
	runListChildTSV(t, "feature-list-child-deep.tsv", j)
}

// --- feature-list-child-pair.tsv ---

func TestTSVFeatureListChildPair(t *testing.T) {
	j := Make(Options{List: &ListOptions{
		Child: boolPtr(true),
		Pair:  boolPtr(true),
	}})
	runListChildTSV(t, "feature-list-child-pair.tsv", j)
}

// --- feature-list-child-pair-deep.tsv ---

func TestTSVFeatureListChildPairDeep(t *testing.T) {
	j := Make(Options{List: &ListOptions{
		Child: boolPtr(true),
		Pair:  boolPtr(true),
	}})
	runListChildTSV(t, "feature-list-child-pair-deep.tsv", j)
}

// --- feature-list-pair.tsv ---

func TestTSVFeatureListPair(t *testing.T) {
	j := Make(Options{List: &ListOptions{Pair: boolPtr(true)}})
	runParserTSV(t, "feature-list-pair.tsv", j)
}

// --- feature-map-child.tsv ---

func TestTSVFeatureMapChild(t *testing.T) {
	j := Make(Options{Map: &MapOptions{Child: boolPtr(true)}})
	runParserTSV(t, "feature-map-child.tsv", j)
}

// --- feature-map-child-deep.tsv ---

func TestTSVFeatureMapChildDeep(t *testing.T) {
	// Deep tests combine map.child with list.child for nested structures.
	j := Make(Options{
		Map:  &MapOptions{Child: boolPtr(true)},
		List: &ListOptions{Child: boolPtr(true)},
	})
	runParserTSV(t, "feature-map-child-deep.tsv", j)
}

// --- Verify formatValue handles ListRef for debugging ---

func TestStripRefsBasic(t *testing.T) {
	lr := ListRef{
		Val:      []any{MapRef{Val: map[string]any{"a": 1.0}, Implicit: false}, "hello"},
		Implicit: true,
		Child:    Text{Str: "world", Quote: `"`},
	}
	got := stripRefs(lr)
	expected := []any{map[string]any{"a": 1.0}, "hello"}
	if !valuesEqual(got, expected) {
		b, _ := json.Marshal(got)
		t.Errorf("stripRefs: got %s, expected %s", string(b), fmt.Sprintf("%v", expected))
	}
}

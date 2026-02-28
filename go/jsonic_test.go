package jsonic

import (
	"bufio"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"testing"
)

// tsvRow holds a row from a TSV file.
type tsvRow struct {
	cols   []string
	lineNo int
}

// loadTSV reads a TSV file and returns its rows (excluding the header).
func loadTSV(path string) ([]tsvRow, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var rows []tsvRow
	scanner := bufio.NewScanner(f)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		if lineNo == 1 {
			continue // skip header
		}
		line := scanner.Text()
		if line == "" {
			continue
		}
		cols := strings.Split(line, "\t")
		rows = append(rows, tsvRow{cols: cols, lineNo: lineNo})
	}
	return rows, scanner.Err()
}

// parseExpected parses the expected JSON string into a Go value.
func parseExpected(s string) (any, error) {
	if s == "" {
		return nil, nil
	}
	var val any
	err := json.Unmarshal([]byte(s), &val)
	if err != nil {
		return nil, err
	}
	return val, nil
}

// normalizeValue normalizes parsed results for comparison:
// float64 whole numbers should compare correctly with JSON unmarshaled values.
func normalizeValue(v any) any {
	switch val := v.(type) {
	case map[string]any:
		result := make(map[string]any)
		for k, v := range val {
			result[k] = normalizeValue(v)
		}
		return result
	case []any:
		result := make([]any, len(val))
		for i, v := range val {
			result[i] = normalizeValue(v)
		}
		return result
	case float64:
		// Normalize -0 to 0
		if val == 0 {
			return float64(0)
		}
		return val
	default:
		return v
	}
}

// valuesEqual compares two values deeply, handling float64 precision.
func valuesEqual(got, expected any) bool {
	got = normalizeValue(got)
	expected = normalizeValue(expected)
	return deepCompare(got, expected)
}

func deepCompare(a, b any) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	switch av := a.(type) {
	case map[string]any:
		bv, ok := b.(map[string]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for k, v := range av {
			bVal, ok := bv[k]
			if !ok {
				return false
			}
			if !deepCompare(v, bVal) {
				return false
			}
		}
		return true
	case []any:
		bv, ok := b.([]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for i := range av {
			if !deepCompare(av[i], bv[i]) {
				return false
			}
		}
		return true
	case float64:
		bv, ok := b.(float64)
		if !ok {
			return false
		}
		if math.IsNaN(av) && math.IsNaN(bv) {
			return true
		}
		return av == bv
	case string:
		bv, ok := b.(string)
		return ok && av == bv
	case bool:
		bv, ok := b.(bool)
		return ok && av == bv
	default:
		return reflect.DeepEqual(a, b)
	}
}

// formatValue formats a value for display in test output.
func formatValue(v any) string {
	if v == nil {
		return "nil"
	}
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprintf("%v", v)
	}
	return string(b)
}

// specDir returns the path to the spec directory.
func specDir() string {
	return filepath.Join("..", "test", "spec")
}

// parserTSVFiles lists all parser-related TSV files (excluding utility-* files).
var parserTSVFiles = []string{
	"jsonic-basic-json.tsv",
	"jsonic-basic-array-tree.tsv",
	"jsonic-basic-mixed-tree.tsv",
	"jsonic-basic-object-tree.tsv",
	"jsonic-funky-keys.tsv",
	"jsonic-process-array.tsv",
	"jsonic-process-implicit-object.tsv",
	"jsonic-process-mixed-nodes.tsv",
	"jsonic-process-object-tree.tsv",
	"jsonic-process-scalars.tsv",
	"jsonic-process-text.tsv",
	"jsonic-process-whitespace.tsv",
	"comma-implicit-comma.tsv",
	"comma-optional-comma.tsv",
	"feature-debug-cases.tsv",
	"feature-implicit-map.tsv",
	"feature-implicit-object.tsv",
	"fv-arrays.tsv",
	"fv-comma.tsv",
	"fv-deep.tsv",
	"fv-drop-outs.tsv",
	"fv-numbers.tsv",
	"fv-subobj.tsv",
	"fv-types.tsv",
	"fv-works.tsv",
	"happy.tsv",
}

func TestParserTSVFiles(t *testing.T) {
	for _, file := range parserTSVFiles {
		t.Run(file, func(t *testing.T) {
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

				got := Parse(preprocessEscapes(input))

				if !valuesEqual(got, expected) {
					t.Errorf("line %d: Parse(%q)\n  got:      %s\n  expected: %s",
						row.lineNo, input, formatValue(got), formatValue(expected))
				}
			}
		})
	}
}

// --- Utility tests ---

func TestUtilityDeep(t *testing.T) {
	path := filepath.Join(specDir(), "utility-deep.tsv")
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load utility-deep.tsv: %v", err)
	}

	for _, row := range rows {
		// Columns: arg1, arg2, arg3, arg4, expected
		// Empty columns mean the argument is not provided
		if len(row.cols) < 5 {
			continue
		}

		args := make([]any, 0)
		for i := 0; i < 4; i++ {
			col := row.cols[i]
			if col == "" {
				break
			}
			val, err := parseExpected(col)
			if err != nil {
				t.Errorf("line %d: failed to parse arg%d %q: %v", row.lineNo, i+1, col, err)
				continue
			}
			args = append(args, val)
		}

		expectedStr := row.cols[4]
		expected, err := parseExpected(expectedStr)
		if err != nil {
			t.Errorf("line %d: failed to parse expected %q: %v", row.lineNo, expectedStr, err)
			continue
		}

		if len(args) == 0 {
			continue
		}

		got := Deep(args[0], args[1:]...)

		if !valuesEqual(got, expected) {
			t.Errorf("line %d: Deep(%s)\n  got:      %s\n  expected: %s",
				row.lineNo, formatArgs(args), formatValue(got), formatValue(expected))
		}
	}
}

func TestUtilityStr(t *testing.T) {
	path := filepath.Join(specDir(), "utility-str.tsv")
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load utility-str.tsv: %v", err)
	}

	for _, row := range rows {
		// Columns: input, maxlen, expected
		if len(row.cols) < 3 {
			continue
		}

		inputStr := row.cols[0]
		maxlenStr := row.cols[1]
		expectedStr := row.cols[2]

		// Parse input (it's a JSON value)
		var input any
		if inputStr != "" {
			if err := json.Unmarshal([]byte(inputStr), &input); err != nil {
				t.Errorf("line %d: failed to parse input %q: %v", row.lineNo, inputStr, err)
				continue
			}
		}

		// Parse maxlen
		maxlen := 44 // default
		if maxlenStr != "" {
			ml, err := strconv.Atoi(maxlenStr)
			if err != nil {
				t.Errorf("line %d: failed to parse maxlen %q: %v", row.lineNo, maxlenStr, err)
				continue
			}
			maxlen = ml
		}

		got := Str(input, maxlen)

		if got != expectedStr {
			t.Errorf("line %d: Str(%s, %d)\n  got:      %q\n  expected: %q",
				row.lineNo, inputStr, maxlen, got, expectedStr)
		}
	}
}

func TestUtilityStrInject(t *testing.T) {
	path := filepath.Join(specDir(), "utility-strinject.tsv")
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load utility-strinject.tsv: %v", err)
	}

	for _, row := range rows {
		// Columns: template, values, expected
		if len(row.cols) < 3 {
			continue
		}

		template := row.cols[0]
		valuesStr := row.cols[1]
		expectedStr := row.cols[2]

		// Parse values
		var vals any
		if valuesStr != "" {
			if err := json.Unmarshal([]byte(valuesStr), &vals); err != nil {
				t.Errorf("line %d: failed to parse values %q: %v", row.lineNo, valuesStr, err)
				continue
			}
		}

		got := StrInject(template, vals)

		if got != expectedStr {
			t.Errorf("line %d: StrInject(%q, %s)\n  got:      %q\n  expected: %q",
				row.lineNo, template, valuesStr, got, expectedStr)
		}
	}
}

func TestUtilityModList(t *testing.T) {
	path := filepath.Join(specDir(), "utility-modlist.tsv")
	rows, err := loadTSV(path)
	if err != nil {
		t.Fatalf("failed to load utility-modlist.tsv: %v", err)
	}

	for _, row := range rows {
		// Columns: input, opts, expected
		if len(row.cols) < 3 {
			continue
		}

		inputStr := row.cols[0]
		optsStr := row.cols[1]
		expectedStr := row.cols[2]

		// Parse input array
		var input []any
		if err := json.Unmarshal([]byte(inputStr), &input); err != nil {
			t.Errorf("line %d: failed to parse input %q: %v", row.lineNo, inputStr, err)
			continue
		}

		// Parse opts
		var opts *ModListOpts
		if optsStr != "" {
			var rawOpts map[string]any
			if err := json.Unmarshal([]byte(optsStr), &rawOpts); err != nil {
				t.Errorf("line %d: failed to parse opts %q: %v", row.lineNo, optsStr, err)
				continue
			}
			opts = &ModListOpts{}
			if del, ok := rawOpts["delete"]; ok {
				if delArr, ok := del.([]any); ok {
					for _, d := range delArr {
						if df, ok := d.(float64); ok {
							opts.Delete = append(opts.Delete, int(df))
						}
					}
				}
			}
			if mv, ok := rawOpts["move"]; ok {
				if mvArr, ok := mv.([]any); ok {
					for _, m := range mvArr {
						if mf, ok := m.(float64); ok {
							opts.Move = append(opts.Move, int(mf))
						}
					}
				}
			}
		}

		// Parse expected
		var expected []any
		if err := json.Unmarshal([]byte(expectedStr), &expected); err != nil {
			t.Errorf("line %d: failed to parse expected %q: %v", row.lineNo, expectedStr, err)
			continue
		}

		got := ModList(input, opts)

		if !valuesEqual(got, expected) {
			t.Errorf("line %d: ModList(%s, %s)\n  got:      %s\n  expected: %s",
				row.lineNo, inputStr, optsStr, formatValue(got), formatValue(expected))
		}
	}
}

func formatArgs(args []any) string {
	parts := make([]string, len(args))
	for i, a := range args {
		parts[i] = formatValue(a)
	}
	return strings.Join(parts, ", ")
}

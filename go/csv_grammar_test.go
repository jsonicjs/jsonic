package jsonic

import (
	"reflect"
	"testing"
)

// Minimal CSV grammar built directly on the jsonic parser API.
// Mirrors test/csv-grammar.test.js — the grammar treats comma-separated
// values as cells, newline-separated rows as records, and single tokens
// (text, number, string, keyword) as cell values. Empty cells become "";
// empty rows are dropped.
func makeCSV() *Jsonic {
	j := Make()

	// pushBack keeps the replaced-rule chain in sync so the parent rule
	// always sees the latest slice through r.Parent.Child.Node. Go's
	// append may reallocate, which means a bare tail-call replacement
	// would leave the original row.Node stale — unlike JS arrays.
	pushBack := func(r *Rule) {
		if r.Parent != NoRule && r.Parent != nil &&
			r.Parent.Child != NoRule && r.Parent.Child != nil {
			r.Parent.Child.Node = r.Node
		}
	}

	appendCell := func(r *Rule, val any) {
		arr, _ := r.Node.([]any)
		r.Node = append(arr, val)
		pushBack(r)
	}

	// csv: outer list of rows. Fresh bo resets Node for each new parse.
	j.Rule("csv", func(rs *RuleSpec) {
		rs.BO = []StateAction{func(r *Rule, ctx *Context) {
			r.Node = []any{}
		}}
		rs.Open = []*AltSpec{
			{S: [][]Tin{{TinZZ}}},
			{P: "row"},
		}
		rs.Close = []*AltSpec{
			{S: [][]Tin{{TinLN}, {TinZZ}}},
			{S: [][]Tin{{TinLN}}, R: "csvcont"},
			{S: [][]Tin{{TinZZ}}},
		}
		rs.BC = []StateAction{func(r *Rule, ctx *Context) {
			if cells, ok := r.Child.Node.([]any); ok && len(cells) > 0 {
				outer, _ := r.Node.([]any)
				r.Node = append(outer, cells)
			}
		}}
	})

	// csvcont: tail-call sibling of csv. Inherits the outer-list node so
	// the replace chain carries the rows accumulated so far.
	j.Rule("csvcont", func(rs *RuleSpec) {
		rs.Open = []*AltSpec{
			{S: [][]Tin{{TinZZ}}},
			{P: "row"},
		}
		rs.Close = []*AltSpec{
			{S: [][]Tin{{TinLN}, {TinZZ}}},
			{S: [][]Tin{{TinLN}}, R: "csvcont"},
			{S: [][]Tin{{TinZZ}}},
		}
		rs.BC = []StateAction{func(r *Rule, ctx *Context) {
			if cells, ok := r.Child.Node.([]any); ok && len(cells) > 0 {
				outer, _ := r.Node.([]any)
				r.Node = append(outer, cells)
			}
		}}
	})

	// row: handles the first cell (initialising the row slice) then hands
	// the continuation to rowcont. Row-ending tokens at open produce an
	// empty row, which csv.bc drops.
	j.Rule("row", func(rs *RuleSpec) {
		rs.Open = []*AltSpec{
			{S: [][]Tin{TinSetVAL}, A: func(r *Rule, ctx *Context) {
				r.Node = []any{r.O[0].Val}
			}},
			{S: [][]Tin{{TinCA}}, B: 1, A: func(r *Rule, ctx *Context) {
				r.Node = []any{""}
			}},
			{S: [][]Tin{{TinLN}}, B: 1, A: func(r *Rule, ctx *Context) {
				r.Node = []any{}
			}},
			{S: [][]Tin{{TinZZ}}, B: 1, A: func(r *Rule, ctx *Context) {
				r.Node = []any{}
			}},
		}
		rs.Close = []*AltSpec{
			{S: [][]Tin{{TinCA}}, R: "rowcont"},
			{S: [][]Tin{{TinLN}}, B: 1},
			{S: [][]Tin{{TinZZ}}, B: 1},
		}
	})

	// rowcont: continues appending cells into the row slice. pushBack
	// keeps row.Node (the node parent rule reads) synced after append.
	j.Rule("rowcont", func(rs *RuleSpec) {
		rs.Open = []*AltSpec{
			{S: [][]Tin{TinSetVAL}, A: func(r *Rule, ctx *Context) {
				appendCell(r, r.O[0].Val)
			}},
			{S: [][]Tin{{TinCA}}, B: 1, A: func(r *Rule, ctx *Context) {
				appendCell(r, "")
			}},
			{S: [][]Tin{{TinLN}}, B: 1, A: func(r *Rule, ctx *Context) {
				appendCell(r, "")
			}},
			{S: [][]Tin{{TinZZ}}, B: 1, A: func(r *Rule, ctx *Context) {
				appendCell(r, "")
			}},
		}
		rs.Close = []*AltSpec{
			{S: [][]Tin{{TinCA}}, R: "rowcont"},
			{S: [][]Tin{{TinLN}}, B: 1},
			{S: [][]Tin{{TinZZ}}, B: 1},
		}
	})

	// Select the custom start rule and drop jsonic-only extensions.
	// Keep #SP and #CM in IGNORE but let #LN reach the parser.
	j.SetOptions(Options{
		Rule: &RuleOptions{Start: "csv", Exclude: "jsonic,imp"},
		Lex:  &LexOptions{EmptyResult: []any{}},
		TokenSet: map[string][]string{
			"IGNORE": {"#SP", "#CM"},
		},
	})

	return j
}

func runCSV(t *testing.T, name, src string, want []any) {
	t.Helper()
	j := makeCSV()
	got, err := j.Parse(src)
	if err != nil {
		t.Fatalf("%s: Parse(%q) error: %v", name, src, err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("%s: Parse(%q)\n  got:      %#v\n  expected: %#v",
			name, src, got, want)
	}
}

func TestCSVEmptyInput(t *testing.T) {
	runCSV(t, "empty-input", "", []any{})
}

func TestCSVSingleRow(t *testing.T) {
	runCSV(t, "single-row", "a,b,c",
		[]any{[]any{"a", "b", "c"}})
}

func TestCSVMultipleRows(t *testing.T) {
	runCSV(t, "multiple-rows", "a,b\nc,d",
		[]any{[]any{"a", "b"}, []any{"c", "d"}})
}

func TestCSVTrailingNewline(t *testing.T) {
	runCSV(t, "trailing-newline", "a,b,c\n",
		[]any{[]any{"a", "b", "c"}})
}

func TestCSVBlankLinesSkipped(t *testing.T) {
	runCSV(t, "blank-lines", "a,b\n\nc,d\n",
		[]any{[]any{"a", "b"}, []any{"c", "d"}})
}

func TestCSVNumbersParsed(t *testing.T) {
	runCSV(t, "numbers", "1,2,3",
		[]any{[]any{float64(1), float64(2), float64(3)}})
}

func TestCSVQuotedStrings(t *testing.T) {
	runCSV(t, "quoted", `"hello","world"`,
		[]any{[]any{"hello", "world"}})
}

func TestCSVMixedTypes(t *testing.T) {
	runCSV(t, "mixed", `a,1,"x",true`,
		[]any{[]any{"a", float64(1), "x", true}})
}

func TestCSVEmptyLeadingField(t *testing.T) {
	runCSV(t, "leading-empty", ",a,b",
		[]any{[]any{"", "a", "b"}})
}

func TestCSVEmptyMiddleField(t *testing.T) {
	runCSV(t, "middle-empty", "a,,b",
		[]any{[]any{"a", "", "b"}})
}

func TestCSVEmptyTrailingField(t *testing.T) {
	runCSV(t, "trailing-empty", "a,b,",
		[]any{[]any{"a", "b", ""}})
}

func TestCSVSingleCellRow(t *testing.T) {
	runCSV(t, "single-cell", "x\ny",
		[]any{[]any{"x"}, []any{"y"}})
}

func TestCSVKeywords(t *testing.T) {
	runCSV(t, "keywords", "true,false,null",
		[]any{[]any{true, false, nil}})
}

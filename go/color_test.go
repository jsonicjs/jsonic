package jsonic

import (
	"strings"
	"testing"
)

// --- Defaults: active, matches TS ---

func TestColorDefaultsActive(t *testing.T) {
	// With no Color option supplied, the resolved palette is active and
	// uses the TS default codes.
	j := Make()
	if !j.parser.Config.Color.Active {
		t.Fatal("Color.Active should default to true")
	}
	if j.parser.Config.Color.Reset != "\x1b[0m" {
		t.Errorf("Reset: got %q, want %q", j.parser.Config.Color.Reset, "\x1b[0m")
	}
	if j.parser.Config.Color.Hi != "\x1b[91m" {
		t.Errorf("Hi: got %q, want %q", j.parser.Config.Color.Hi, "\x1b[91m")
	}
	if j.parser.Config.Color.Lo != "\x1b[2m" {
		t.Errorf("Lo: got %q, want %q", j.parser.Config.Color.Lo, "\x1b[2m")
	}
	if j.parser.Config.Color.Line != "\x1b[34m" {
		t.Errorf("Line: got %q, want %q", j.parser.Config.Color.Line, "\x1b[34m")
	}
}

// --- Active true (default): error output carries ANSI ---

func TestColorActiveWrapsHeader(t *testing.T) {
	j := Make()
	_, err := j.Parse(`"unterminated`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	msg := err.Error()
	// Header "[jsonic/unterminated_string]:" should be wrapped by the Hi
	// code before and Reset after.
	want := "\x1b[91m[jsonic/unterminated_string]:\x1b[0m"
	if !strings.Contains(msg, want) {
		t.Errorf("expected header to be colour-wrapped, got:\n%q", msg)
	}
}

func TestColorActiveWrapsArrow(t *testing.T) {
	j := Make()
	_, err := j.Parse(`"unterminated`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	msg := err.Error()
	// The source-location arrow gets the Line code then Reset.
	want := "\x1b[34m-->\x1b[0m"
	if !strings.Contains(msg, want) {
		t.Errorf("expected --> to be colour-wrapped, got:\n%q", msg)
	}
}

func TestColorActiveWrapsCaret(t *testing.T) {
	j := Make()
	_, err := j.Parse(`"unterminated`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	msg := err.Error()
	// The caret row starts with the Line code and ends with Reset.
	if !strings.Contains(msg, "\x1b[34m^") {
		t.Errorf("caret line should start with Line ANSI code, got:\n%q", msg)
	}
	if !strings.Contains(msg, "\x1b[0m") {
		t.Errorf("caret line should contain Reset, got:\n%q", msg)
	}
}

// --- Disabled: no ANSI codes anywhere ---

func TestColorDisabledSuppressesAll(t *testing.T) {
	no := false
	j := Make(Options{Color: &ColorOptions{Active: &no}})
	_, err := j.Parse(`"unterminated`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	msg := err.Error()
	if strings.Contains(msg, "\x1b[") {
		t.Errorf("expected no ANSI escapes, got:\n%q", msg)
	}
	// Plain text still reaches the caller.
	if !strings.Contains(msg, "[jsonic/unterminated_string]:") {
		t.Errorf("expected plain header, got:\n%q", msg)
	}
	if !strings.Contains(msg, "-->") {
		t.Errorf("expected plain arrow, got:\n%q", msg)
	}
}

// --- Custom codes override defaults ---

func TestColorCustomOverrides(t *testing.T) {
	yes := true
	j := Make(Options{Color: &ColorOptions{
		Active: &yes,
		Reset:  "<R>",
		Hi:     "<HI>",
		Line:   "<LN>",
	}})
	_, err := j.Parse(`"unterminated`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	msg := err.Error()
	if !strings.Contains(msg, "<HI>[jsonic/") {
		t.Errorf("expected custom Hi, got:\n%q", msg)
	}
	if !strings.Contains(msg, "<LN>-->") {
		t.Errorf("expected custom Line, got:\n%q", msg)
	}
	if !strings.Contains(msg, "]:<R>") {
		t.Errorf("expected custom Reset, got:\n%q", msg)
	}
	// Lo defaults to the TS ANSI code since we didn't override it;
	// but Lo is not used in the current Go formatter's output lines,
	// so just verify the explicitly-set codes work without asserting Lo.
}

// --- SetOptions path re-applies colour ---

func TestColorToggleViaSetOptions(t *testing.T) {
	// Start with defaults (active); flip off via SetOptions.
	j := Make()
	no := false
	j.SetOptions(Options{Color: &ColorOptions{Active: &no}})

	_, err := j.Parse(`"unterminated`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	if strings.Contains(err.Error(), "\x1b[") {
		t.Errorf("SetOptions didn't disable colour, got:\n%q", err.Error())
	}
}

// --- Text round-trip ---

func TestColorFromTextDisable(t *testing.T) {
	j, err := Make().SetOptionsText(`color: { active: false }`)
	if err != nil {
		t.Fatal(err)
	}
	_, perr := j.Parse(`"unterminated`)
	if perr == nil {
		t.Fatal("expected parse error")
	}
	if strings.Contains(perr.Error(), "\x1b[") {
		t.Errorf("text-form disable failed, got:\n%q", perr.Error())
	}
}

func TestColorFromTextCustomCodes(t *testing.T) {
	// Use non-ANSI placeholders so the assertion is unambiguous.
	j, err := Make().SetOptionsText(`color: {
		active: true,
		hi: "<HI>",
		lo: "<LO>",
		line: "<LN>",
		reset: "<R>"
	}`)
	if err != nil {
		t.Fatal(err)
	}
	_, perr := j.Parse(`"unterminated`)
	if perr == nil {
		t.Fatal("expected parse error")
	}
	msg := perr.Error()
	if !strings.Contains(msg, "<HI>[jsonic/") || !strings.Contains(msg, "]:<R>") {
		t.Errorf("custom codes not applied, got:\n%q", msg)
	}
	if !strings.Contains(msg, "<LN>-->") {
		t.Errorf("line colour not applied, got:\n%q", msg)
	}
}

// --- Caret colour applies to lexer-path errors too ---

func TestColorAppliesToLexerError(t *testing.T) {
	// "unterminated_string" comes from the lexer. We verify the ANSI
	// codes appear on that path too (not just parser-generated errors).
	j := Make()
	_, err := j.Parse(`a:"abc`)
	if err == nil {
		t.Fatal("expected parse error")
	}
	msg := err.Error()
	if !strings.Contains(msg, "\x1b[91m[jsonic/unterminated_string]:\x1b[0m") {
		t.Errorf("lex-path error missing ANSI, got:\n%q", msg)
	}
}

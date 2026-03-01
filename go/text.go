package jsonic

// Text represents a string value with metadata about how it was quoted
// in the source. When the TextInfo option is enabled, string and text
// values in the output are wrapped in Text instead of plain strings.
type Text struct {
	// Quote is the quote character used in the source.
	// For quoted strings: `"`, `'`, or "`".
	// For unquoted text: "" (empty string).
	Quote string

	// Str is the actual string value (with escapes processed for quoted strings).
	Str string
}

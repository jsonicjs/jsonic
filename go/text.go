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

// ListRef wraps a list value with metadata about how it was created.
// When the ListRef option is enabled, list values in the output are
// returned as ListRef instead of plain []any slices.
type ListRef struct {
	// Val is the list contents.
	Val []any

	// Implicit is true when the list was created implicitly
	// (e.g. comma-separated or space-separated values without brackets),
	// and false when brackets were used explicitly.
	Implicit bool
}

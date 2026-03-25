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
// ListRef is created early (in the BO phase) so that custom parsers
// can store additional information in the Meta map during parsing.
type ListRef struct {
	// Val is the list contents.
	Val []any

	// Implicit is true when the list was created implicitly
	// (e.g. comma-separated or space-separated values without brackets),
	// and false when brackets were used explicitly.
	Implicit bool

	// Child is the optional child value set by bare colon syntax (:value)
	// inside a list. Enabled by the List.Child option.
	// For example, `[:1, a, b]` produces Val=[a, b] with Child=1.
	// Multiple child values are merged (deep merge if Map.Extend is true).
	// Nil when no child value is present.
	Child any

	// Meta is a map for custom parsers to attach additional information
	// during parsing. It is initialized when the ListRef is created in
	// the BO (before-open) phase.
	Meta map[string]any
}

// MapRef wraps a map value with metadata about how it was created.
// When the MapRef option is enabled, map values in the output are
// returned as MapRef instead of plain map[string]any.
// MapRef is created early (in the BO phase) so that custom parsers
// can store additional information in the Meta map during parsing.
type MapRef struct {
	// Val is the map contents.
	Val map[string]any

	// Implicit is true when the map was created implicitly
	// (e.g. key:value pairs without braces),
	// and false when braces were used explicitly.
	Implicit bool

	// Meta is a map for custom parsers to attach additional information
	// during parsing. It is initialized when the MapRef is created in
	// the BO (before-open) phase.
	Meta map[string]any
}

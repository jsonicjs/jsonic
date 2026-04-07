# Syntax Reference

jsonic accepts standard JSON and extends it with the relaxations described
below. All extensions are optional -- valid JSON always parses correctly.

## Objects

Standard JSON objects work as expected. jsonic also supports:

### Unquoted Keys

Keys do not need quotes when they contain only word characters (letters,
digits, underscore) or spaces followed by a colon.

```
{a: 1, b: 2}         → {"a": 1, "b": 2}
{my key: "value"}     → {"my key": "value"}
```

### Implicit Top-Level Object

The outer `{}` braces are optional when the input contains key-value pairs.

```
a:1, b:2              → {"a": 1, "b": 2}
```

### Object Merging

When the same key appears multiple times, object values are deep-merged.

```
a:{b:1}, a:{c:2}      → {"a": {"b": 1, "c": 2}}
```

### Path Diving

Nested objects can be expressed inline using chained colons.

```
a:b:1, a:c:2          → {"a": {"b": 1, "c": 2}}
```

## Arrays

Standard JSON arrays work as expected. jsonic also supports:

### Implicit Top-Level Array

When the input contains comma- or newline-separated values without colons,
it is parsed as an array.

```
a, b, c               → ["a", "b", "c"]
1, 2, 3               → [1, 2, 3]
```

### Named Properties in Arrays

By default, key-value pairs inside arrays are allowed.

```
[a:1, b:2]            → [{"a": 1}, {"b": 2}]
```

This can be controlled with the `list.property` option.

## Strings

### Quoted Strings

Double quotes, single quotes, and backticks all work as string delimiters.

```
"hello"   'hello'   `hello`
```

### Unquoted Strings

Values that are not numbers, booleans, or null are treated as unquoted strings.
Unquoted strings extend to the next structural character (comma, colon,
bracket, brace) or end of line.

```
{a: hello world}      → {"a": "hello world"}
```

### Multiline Strings

Backtick strings can span multiple lines. Newlines are preserved.

```
`line one
line two`             → "line one\nline two"
```

### Indent-Adjusted Strings

Triple-quoted strings (`'''...'''`) strip the common leading indentation.

```
  '''
  line one
  line two
  '''                 → "line one\nline two"
```

## Numbers

All standard JSON number formats, plus:

| Format | Example | Value |
|---|---|---|
| Decimal | `42`, `3.14`, `.5` | 42, 3.14, 0.5 |
| Signed | `+1`, `-1` | 1, -1 |
| Scientific | `1e2`, `1.5e-3` | 100, 0.0015 |
| Hexadecimal | `0xFF`, `0x0a` | 255, 10 |
| Octal | `0o17` | 15 |
| Binary | `0b1010` | 10 |
| Separators | `1_000_000` | 1000000 |

## Comments

Three comment styles are supported by default:

```
# hash line comment
// slash line comment
/* block
   comment */
```

Comments are discarded and do not appear in the output.

## Keywords

The following keywords are recognized (case-sensitive):

| Keyword | Value |
|---|---|
| `true` | `true` |
| `false` | `false` |
| `null` | `null` |

Custom keywords can be added via the `value.def` option.

## Trailing Commas

Trailing commas are always allowed and ignored.

```
{a:1, b:2,}           → {"a": 1, "b": 2}
[1, 2, 3,]            → [1, 2, 3]
```

## Auto-Close

Unclosed `{` or `[` at end-of-input are closed automatically. This can be
disabled with the `rule.finish` option.

```
{a:1                  → {"a": 1}
[1, 2                 → [1, 2]
```

## Escape Sequences

Standard JSON escape sequences work in all quoted strings:

| Sequence | Character |
|---|---|
| `\\` | Backslash |
| `\"` | Double quote |
| `\'` | Single quote |
| `\n` | Newline |
| `\r` | Carriage return |
| `\t` | Tab |
| `\b` | Backspace |
| `\f` | Form feed |
| `\uXXXX` | Unicode code point |
| `\xXX` | ASCII code point |

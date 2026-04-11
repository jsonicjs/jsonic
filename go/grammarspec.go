package jsonic

import (
	"fmt"
	"regexp"
	"strings"
)

// FuncRef is a string starting with "@" that references a function in a Ref map.
type FuncRef = string

// GrammarSpec defines a declarative grammar specification.
// Mirrors the TypeScript GrammarSpec type.
type GrammarSpec struct {
	// Ref maps FuncRef strings (like "@finish") to Go functions.
	Ref map[FuncRef]any

	// Options to merge into the Jsonic instance before processing rules.
	// Can be a typed *Options struct or a map[string]any with FuncRef resolution.
	Options *Options

	// OptionsMap is an alternative to Options that accepts a map[string]any.
	// FuncRef strings in values are resolved via Ref before applying.
	// Use for JSON-serializable grammars where function fields use "@name" refs.
	OptionsMap map[string]any

	// Rule defines open/close alternates per rule name.
	Rule map[string]*GrammarRuleSpec
}

// GrammarRuleSpec defines open and close alternates for a single rule.
// Open and Close can be a plain []*GrammarAltSpec or a *GrammarAltListSpec
// with inject modifiers (append, delete, move).
type GrammarRuleSpec struct {
	Open  any // []*GrammarAltSpec or *GrammarAltListSpec
	Close any // []*GrammarAltSpec or *GrammarAltListSpec
}

// GrammarAltListSpec wraps alt specs with injection modifiers.
type GrammarAltListSpec struct {
	Alts   []*GrammarAltSpec
	Inject *GrammarInjectSpec
}

// GrammarInjectSpec controls how alts are merged into existing rule alternates.
type GrammarInjectSpec struct {
	Append bool  // If true, append; if false, prepend (default).
	Delete []int // Indices to delete (supports negative).
	Move   []int // Pairs: [from, to, from, to, ...].
}

// GrammarAltSpec is a declarative alternate specification using string references.
// Token fields use "#NAME" strings resolved via Token/TokenSet lookup.
// Function fields use "@name" FuncRef strings resolved via the Ref map.
type GrammarAltSpec struct {
	// Token spec. Either a string or []string.
	//   string:   "#OB", "#KEY #CL" — each space-separated name is a slot.
	//   []string: ["#CB #CS"] — each element is a slot; within an element,
	//             space-separated names are alternatives for that slot.
	S any
	B any             // Backtrack: int or FuncRef string
	P string          // Push rule name or FuncRef
	R string          // Replace rule name or FuncRef
	A FuncRef         // Action function ref
	E FuncRef         // Error function ref
	H FuncRef         // Modifier function ref
	C any             // Condition: FuncRef string or map[string]any for declarative
	N map[string]int  // Counter increments
	U map[string]any  // Custom props
	K map[string]any  // Propagated custom props
	G string          // Group tags (comma-separated)
}

// Grammar applies a declarative grammar specification to this Jsonic instance.
// Options are applied first, then rules are processed.
// Returns the Jsonic instance for chaining.
func (j *Jsonic) Grammar(gs *GrammarSpec) *Jsonic {
	// Apply typed Options directly.
	if gs.Options != nil {
		j.SetOptions(*gs.Options)
	}

	// Apply OptionsMap with FuncRef resolution.
	if gs.OptionsMap != nil {
		resolved := ResolveFuncRefs(gs.OptionsMap, gs.Ref)
		if resolvedMap, ok := resolved.(map[string]any); ok {
			opts := mapToOptions(resolvedMap)
			j.SetOptions(opts)
		}
	}

	if gs.Rule != nil {
		for rulename, rulespec := range gs.Rule {
			ref := gs.Ref
			j.Rule(rulename, func(rs *RuleSpec) {
				// Process Open alts.
				if rulespec.Open != nil {
					applyGrammarAlts(j, rs, rulespec.Open, ref, true)
				}

				// Process Close alts.
				if rulespec.Close != nil {
					applyGrammarAlts(j, rs, rulespec.Close, ref, false)
				}

				// Auto-wire reserved FuncRef names for state actions.
				if ref != nil {
					wireStateActions(rs, ref)
				}
			})
		}
	}

	return j
}

// applyGrammarAlts resolves and applies grammar alts to a rule spec.
// Handles both plain []*GrammarAltSpec and *GrammarAltListSpec with inject.
func applyGrammarAlts(j *Jsonic, rs *RuleSpec, spec any, ref map[FuncRef]any, isOpen bool) {
	var gas []*GrammarAltSpec
	var inject *GrammarInjectSpec

	switch v := spec.(type) {
	case []*GrammarAltSpec:
		gas = v
	case *GrammarAltListSpec:
		gas = v.Alts
		inject = v.Inject
	default:
		return
	}

	resolved := j.resolveGrammarAlts(gas, ref)

	dest := &rs.Close
	if isOpen {
		dest = &rs.Open
	}

	// Apply inject modifiers (delete, move) to existing alts first.
	if inject != nil && (len(inject.Delete) > 0 || len(inject.Move) > 0) {
		*dest = modifyAltList(*dest, &AltModListOpts{
			Delete: inject.Delete,
			Move:   inject.Move,
		})
	}

	// Insert resolved alts: append or prepend (default: prepend).
	if inject != nil && inject.Append {
		*dest = append(*dest, resolved...)
	} else {
		*dest = append(resolved, *dest...)
	}
}

// resolveGrammarAlts converts a slice of GrammarAltSpec to concrete AltSpec.
func (j *Jsonic) resolveGrammarAlts(gas []*GrammarAltSpec, ref map[FuncRef]any) []*AltSpec {
	alts := make([]*AltSpec, 0, len(gas))
	for _, ga := range gas {
		alts = append(alts, j.resolveGrammarAlt(ga, ref))
	}
	return alts
}

// resolveGrammarAlt converts a single GrammarAltSpec to a concrete AltSpec.
func (j *Jsonic) resolveGrammarAlt(ga *GrammarAltSpec, ref map[FuncRef]any) *AltSpec {
	alt := &AltSpec{}

	// Resolve S (token spec: string or []string → [][]Tin)
	if ga.S != nil {
		alt.S = j.resolveTokenField(ga.S)
	}

	// Resolve B (backtrack: int or FuncRef)
	switch v := ga.B.(type) {
	case int:
		alt.B = v
	case float64:
		alt.B = int(v)
	case string:
		fn := requireRef(ref, v, "backtrack")
		if bf, ok := fn.(func(*Rule, *Context) int); ok {
			alt.BF = bf
		} else {
			panic(fmt.Sprintf("Grammar: ref %q is not a backtrack function", v))
		}
	}

	// Resolve P (push: rule name or FuncRef)
	if ga.P != "" {
		if isFuncRef(ga.P) {
			fn := requireRef(ref, ga.P, "push")
			if pf, ok := fn.(func(*Rule, *Context) string); ok {
				alt.PF = pf
			} else {
				panic(fmt.Sprintf("Grammar: ref %q is not a push function", ga.P))
			}
		} else {
			alt.P = ga.P
		}
	}

	// Resolve R (replace: rule name or FuncRef)
	if ga.R != "" {
		if isFuncRef(ga.R) {
			fn := requireRef(ref, ga.R, "replace")
			if rf, ok := fn.(func(*Rule, *Context) string); ok {
				alt.RF = rf
			} else {
				panic(fmt.Sprintf("Grammar: ref %q is not a replace function", ga.R))
			}
		} else {
			alt.R = ga.R
		}
	}

	// Resolve A (action)
	if ga.A != "" {
		fn := requireRef(ref, ga.A, "action")
		if af, ok := fn.(AltAction); ok {
			alt.A = af
		} else {
			panic(fmt.Sprintf("Grammar: ref %q is not an AltAction", ga.A))
		}
	}

	// Resolve E (error)
	if ga.E != "" {
		fn := requireRef(ref, ga.E, "error")
		if ef, ok := fn.(AltError); ok {
			alt.E = ef
		} else {
			panic(fmt.Sprintf("Grammar: ref %q is not an AltError", ga.E))
		}
	}

	// Resolve H (modifier)
	if ga.H != "" {
		fn := requireRef(ref, ga.H, "modifier")
		if hf, ok := fn.(AltModifier); ok {
			alt.H = hf
		} else {
			panic(fmt.Sprintf("Grammar: ref %q is not an AltModifier", ga.H))
		}
	}

	// Resolve C (condition: FuncRef or declarative map)
	switch cv := ga.C.(type) {
	case string:
		fn := requireRef(ref, cv, "condition")
		if cf, ok := fn.(AltCond); ok {
			alt.C = cf
		} else {
			panic(fmt.Sprintf("Grammar: ref %q is not an AltCond", cv))
		}
	case map[string]any:
		alt.CD = cv
	}

	// Copy simple fields
	if ga.N != nil {
		alt.N = make(map[string]int, len(ga.N))
		for k, v := range ga.N {
			alt.N[k] = v
		}
	}
	if ga.U != nil {
		alt.U = make(map[string]any, len(ga.U))
		for k, v := range ga.U {
			alt.U[k] = v
		}
	}
	if ga.K != nil {
		alt.K = make(map[string]any, len(ga.K))
		for k, v := range ga.K {
			alt.K[k] = v
		}
	}
	alt.G = ga.G

	// Normalize declarative conditions
	NormAlt(alt)

	return alt
}

// resolveTokenField resolves the S field of a GrammarAltSpec.
// Accepts string or []string.
//
//	string:     "#KEY #CL" — each space-separated name is a separate slot.
//	[]string:   ["#CB #CS"] — each element is a slot; within an element,
//	            space-separated names are alternatives for that slot.
func (j *Jsonic) resolveTokenField(s any) [][]Tin {
	switch v := s.(type) {
	case string:
		if v == "" {
			return nil
		}
		return j.resolveTokenSpec(v)
	case []string:
		result := make([][]Tin, len(v))
		for i, slot := range v {
			var tins []Tin
			for _, name := range strings.Fields(slot) {
				tins = append(tins, j.resolveTokenName(name)...)
			}
			result[i] = tins
		}
		return result
	}
	return nil
}

// resolveTokenSpec resolves a token spec string into [][]Tin.
// Each space-separated name becomes a separate slot.
func (j *Jsonic) resolveTokenSpec(s string) [][]Tin {
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return nil
	}
	result := make([][]Tin, len(parts))
	for i, part := range parts {
		result[i] = j.resolveTokenName(part)
	}
	return result
}

// resolveTokenName resolves a single token name (like "#OB" or "#KEY") to a []Tin.
func (j *Jsonic) resolveTokenName(name string) []Tin {
	setName := strings.TrimPrefix(name, "#")
	if tins := j.TokenSet(setName); tins != nil {
		return tins
	}
	tin := j.Token(name)
	return []Tin{tin}
}

// isFuncRef checks if a string is a function reference (starts with "@").
func isFuncRef(s string) bool {
	return len(s) > 0 && s[0] == '@'
}

// requireRef looks up a FuncRef in the ref map and panics if not found.
// Matches TS behavior which throws on missing refs.
func requireRef(ref map[FuncRef]any, name string, kind string) any {
	if ref == nil {
		panic(fmt.Sprintf("Grammar: unknown %s function reference: %s (no ref map)", kind, name))
	}
	fn, ok := ref[name]
	if !ok {
		panic(fmt.Sprintf("Grammar: unknown %s function reference: %s", kind, name))
	}
	return fn
}

// lookupRef looks up a FuncRef in the ref map. Returns nil if not found.
func lookupRef(ref map[FuncRef]any, name string) any {
	if ref == nil {
		return nil
	}
	return ref[name]
}

// wireStateActions auto-wires reserved FuncRef names to state action slices.
// Names: @{rulename}-bo, @{rulename}-ao, @{rulename}-bc, @{rulename}-ac
// Variants: /prepend prepends, /append or plain appends.
func wireStateActions(rs *RuleSpec, ref map[FuncRef]any) {
	type target struct {
		suffix string
		dest   *[]StateAction
	}
	targets := []target{
		{"bo", &rs.BO},
		{"ao", &rs.AO},
		{"bc", &rs.BC},
		{"ac", &rs.AC},
	}
	for _, t := range targets {
		base := "@" + rs.Name + "-" + t.suffix
		append_ := true
		fn := ref[base+"/prepend"]
		if fn != nil {
			append_ = false
		} else {
			fn = ref[base+"/append"]
			if fn == nil {
				fn = ref[base]
			}
		}
		if fn != nil {
			if sa, ok := fn.(StateAction); ok {
				if append_ {
					*t.dest = append(*t.dest, sa)
				} else {
					*t.dest = append([]StateAction{sa}, *t.dest...)
				}
			}
		}
	}
}

// mapToOptions converts a map[string]any (with resolved FuncRefs) to an Options struct.
// Only handles fields that are commonly set via grammar options.
func mapToOptions(m map[string]any) Options {
	var opts Options

	if v, ok := m["tag"].(string); ok {
		opts.Tag = v
	}

	if vm, ok := m["value"].(map[string]any); ok {
		opts.Value = &ValueOptions{}
		if lex, ok := vm["lex"].(bool); ok {
			opts.Value.Lex = &lex
		}
		if defm, ok := vm["def"].(map[string]any); ok {
			opts.Value.Def = make(map[string]*ValueDef, len(defm))
			for k, v := range defm {
				switch vv := v.(type) {
				case map[string]any:
					vd := &ValueDef{}
					if val, ok := vv["val"]; ok {
						vd.Val = val
					}
					opts.Value.Def[k] = vd
				case nil, bool:
					// nil or false removes the value def
				}
			}
		}
	}

	if nm, ok := m["number"].(map[string]any); ok {
		opts.Number = &NumberOptions{}
		if hex, ok := nm["hex"].(bool); ok {
			opts.Number.Hex = &hex
		}
		if oct, ok := nm["oct"].(bool); ok {
			opts.Number.Oct = &oct
		}
		if bin, ok := nm["bin"].(bool); ok {
			opts.Number.Bin = &bin
		}
		if sep, ok := nm["sep"].(string); ok {
			opts.Number.Sep = sep
		}
		if fn, ok := nm["exclude"].(func(string) bool); ok {
			opts.Number.Exclude = fn
		}
	}

	if mm, ok := m["map"].(map[string]any); ok {
		opts.Map = &MapOptions{}
		if ext, ok := mm["extend"].(bool); ok {
			opts.Map.Extend = &ext
		}
		if fn, ok := mm["merge"].(func(any, any, *Rule, *Context) any); ok {
			opts.Map.Merge = fn
		}
	}

	if sm, ok := m["string"].(map[string]any); ok {
		opts.String = &StringOptions{}
		if esc, ok := sm["escape"].(map[string]any); ok {
			opts.String.Escape = make(map[string]string, len(esc))
			for k, v := range esc {
				if s, ok := v.(string); ok {
					opts.String.Escape[k] = s
				}
			}
		}
		if rep, ok := sm["replace"].(map[string]any); ok {
			opts.String.Replace = make(map[rune]string, len(rep))
			for k, v := range rep {
				if len(k) > 0 {
					if s, ok := v.(string); ok {
						opts.String.Replace[rune(k[0])] = s
					}
				}
			}
		}
	}

	if cm, ok := m["comment"].(map[string]any); ok {
		opts.Comment = &CommentOptions{}
		if lex, ok := cm["lex"].(bool); ok {
			opts.Comment.Lex = &lex
		}
	}

	if rm, ok := m["rule"].(map[string]any); ok {
		opts.Rule = &RuleOptions{}
		if start, ok := rm["start"].(string); ok {
			opts.Rule.Start = start
		}
		if finish, ok := rm["finish"].(bool); ok {
			opts.Rule.Finish = &finish
		}
	}

	if safe, ok := m["safe"].(map[string]any); ok {
		opts.Safe = &SafeOptions{}
		if key, ok := safe["key"].(bool); ok {
			opts.Safe.Key = &key
		}
	}

	return opts
}

// builtinTins maps standard token names to their Tin values.
var builtinTins = map[string]Tin{
	"#BD": TinBD, "#ZZ": TinZZ, "#UK": TinUK, "#AA": TinAA,
	"#SP": TinSP, "#LN": TinLN, "#CM": TinCM, "#NR": TinNR,
	"#ST": TinST, "#TX": TinTX, "#VL": TinVL, "#OB": TinOB,
	"#CB": TinCB, "#OS": TinOS, "#CS": TinCS, "#CL": TinCL,
	"#CA": TinCA,
}

// builtinTokenSets maps standard token set names to their Tin slices.
var builtinTokenSets = map[string][]Tin{
	"VAL": TinSetVAL,
	"KEY": TinSetKEY,
}

// resolveTokenFieldStatic resolves a string or []string S field using built-in tokens.
func resolveTokenFieldStatic(s any) [][]Tin {
	switch v := s.(type) {
	case string:
		if v == "" {
			return nil
		}
		return resolveTokenSpecStatic(v)
	case []string:
		result := make([][]Tin, len(v))
		for i, slot := range v {
			var tins []Tin
			for _, name := range strings.Fields(slot) {
				tins = append(tins, resolveTokenNameStatic(name)...)
			}
			result[i] = tins
		}
		return result
	}
	return nil
}

// resolveTokenSpecStatic resolves a token spec string using built-in tokens only.
func resolveTokenSpecStatic(s string) [][]Tin {
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return nil
	}
	result := make([][]Tin, len(parts))
	for i, part := range parts {
		result[i] = resolveTokenNameStatic(part)
	}
	return result
}

func resolveTokenNameStatic(name string) []Tin {
	setName := strings.TrimPrefix(name, "#")
	if tins, ok := builtinTokenSets[setName]; ok {
		result := make([]Tin, len(tins))
		copy(result, tins)
		return result
	}
	if tin, ok := builtinTins[name]; ok {
		return []Tin{tin}
	}
	panic("resolveTokenNameStatic: unknown token: " + name)
}

// resolveGrammarAltStatic converts a GrammarAltSpec to a concrete AltSpec
// using only built-in token resolution. Used by the internal Grammar().
func resolveGrammarAltStatic(ga *GrammarAltSpec, ref map[FuncRef]any) *AltSpec {
	alt := &AltSpec{}

	if ga.S != nil {
		alt.S = resolveTokenFieldStatic(ga.S)
	}

	switch v := ga.B.(type) {
	case int:
		alt.B = v
	case float64:
		alt.B = int(v)
	case string:
		fn := requireRef(ref, v, "backtrack")
		if bf, ok := fn.(func(*Rule, *Context) int); ok {
			alt.BF = bf
		}
	}

	if ga.P != "" {
		if isFuncRef(ga.P) {
			fn := requireRef(ref, ga.P, "push")
			if pf, ok := fn.(func(*Rule, *Context) string); ok {
				alt.PF = pf
			}
		} else {
			alt.P = ga.P
		}
	}

	if ga.R != "" {
		if isFuncRef(ga.R) {
			fn := requireRef(ref, ga.R, "replace")
			if rf, ok := fn.(func(*Rule, *Context) string); ok {
				alt.RF = rf
			}
		} else {
			alt.R = ga.R
		}
	}

	if ga.A != "" {
		fn := requireRef(ref, ga.A, "action")
		alt.A = fn.(AltAction)
	}
	if ga.E != "" {
		fn := requireRef(ref, ga.E, "error")
		alt.E = fn.(AltError)
	}
	if ga.H != "" {
		fn := requireRef(ref, ga.H, "modifier")
		alt.H = fn.(AltModifier)
	}

	switch cv := ga.C.(type) {
	case string:
		fn := requireRef(ref, cv, "condition")
		alt.C = fn.(AltCond)
	case map[string]any:
		alt.CD = cv
	}

	if ga.N != nil {
		alt.N = ga.N
	}
	if ga.U != nil {
		alt.U = ga.U
	}
	if ga.K != nil {
		alt.K = ga.K
	}
	alt.G = ga.G

	NormAlt(alt)
	return alt
}

// ResolveFuncRefs recursively resolves FuncRef strings in a map[string]any:
//   - "@@prefix" → literal "@prefix"
//   - "@SKIP" → Skip sentinel
//   - "@/pattern/flags" → *regexp.Regexp
//   - "@name" → function from ref map
func ResolveFuncRefs(obj any, ref map[FuncRef]any) any {
	if obj == nil {
		return nil
	}
	if s, ok := obj.(string); ok && len(s) > 0 && s[0] == '@' {
		// Escape: @@ → literal @-prefixed string
		if len(s) > 1 && s[1] == '@' {
			return s[1:]
		}
		// Sentinel: @SKIP → Skip
		if s == "@SKIP" {
			return Skip
		}
		// Regex: @/pattern/flags → *regexp.Regexp
		if len(s) > 2 && s[1] == '/' {
			if idx := strings.LastIndex(s, "/"); idx > 1 {
				pattern := s[2:idx]
				flags := s[idx+1:]
				if flags != "" {
					pattern = "(?" + flags + ")" + pattern
				}
				re, err := regexp.Compile(pattern)
				if err == nil {
					return re
				}
			}
		}
		// FuncRef: @name → function from ref
		if ref != nil {
			if fn, ok := ref[s]; ok {
				return fn
			}
		}
		return obj
	}

	// Recurse into maps
	if m, ok := obj.(map[string]any); ok {
		out := make(map[string]any, len(m))
		for k, v := range m {
			out[k] = ResolveFuncRefs(v, ref)
		}
		return out
	}

	// Recurse into slices
	if arr, ok := obj.([]any); ok {
		out := make([]any, len(arr))
		for i, v := range arr {
			out[i] = ResolveFuncRefs(v, ref)
		}
		return out
	}

	return obj
}

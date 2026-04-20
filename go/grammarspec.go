package jsonic

import (
	"fmt"
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
	// Applied via SetOptions.
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

// GrammarSetting carries optional settings applied when a grammar
// spec (Grammar/GrammarText) is installed. If Rule.Alt.G is defined,
// its tag(s) are appended to every rule-alt G property in the grammar
// before the alts are installed.
//
// G can be a comma-separated string or a []string of tag names.
type GrammarSetting struct {
	Rule *GrammarSettingRule
}

// GrammarSettingRule wraps alt-level settings.
type GrammarSettingRule struct {
	Alt *GrammarSettingAlt
}

// GrammarSettingAlt carries per-alt settings (currently only G).
// G accepts string (comma-separated) or []string.
type GrammarSettingAlt struct {
	G any
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
// An optional *GrammarSetting may be supplied to append a tag (or tags) to
// every rule-alt G property in the spec.
// Returns an error if any FuncRef is missing or has the wrong type.
func (j *Jsonic) Grammar(gs *GrammarSpec, setting ...*GrammarSetting) error {
	// Apply typed Options directly.
	if gs.Options != nil {
		j.SetOptions(*gs.Options)
	}

	// Apply OptionsMap with FuncRef resolution.
	if gs.OptionsMap != nil {
		resolved := ResolveFuncRefs(gs.OptionsMap, gs.Ref)
		if resolvedMap, ok := resolved.(map[string]any); ok {
			opts := MapToOptions(resolvedMap)
			j.SetOptions(opts)
		}
	}

	// Resolve the optional grammar setting's alt.g tags once.
	altGTags := extractSettingAltG(setting)

	if gs.Rule != nil {
		for rulename, rulespec := range gs.Rule {
			ref := gs.Ref
			var resolveErr error
			j.Rule(rulename, func(rs *RuleSpec, _ *Parser) {
				// Process Open alts.
				if rulespec.Open != nil {
					if err := applyGrammarAlts(j, rs, rulespec.Open, ref, true, altGTags); err != nil {
						resolveErr = err
						return
					}
				}

				// Process Close alts.
				if rulespec.Close != nil {
					if err := applyGrammarAlts(j, rs, rulespec.Close, ref, false, altGTags); err != nil {
						resolveErr = err
						return
					}
				}

				// Auto-wire reserved FuncRef names for state actions.
				if ref != nil {
					wireStateActions(rs, ref)
				}
			})
			if resolveErr != nil {
				return resolveErr
			}
		}
	}

	return nil
}

// extractSettingAltG returns the list of tag strings from the variadic
// setting slice (first non-nil entry wins).  Returns nil when no tags
// are supplied.  Accepts string (comma-separated) or []string.
func extractSettingAltG(setting []*GrammarSetting) []string {
	for _, s := range setting {
		if s == nil || s.Rule == nil || s.Rule.Alt == nil || s.Rule.Alt.G == nil {
			continue
		}
		switch v := s.Rule.Alt.G.(type) {
		case string:
			return splitGroupTags(v)
		case []string:
			out := make([]string, 0, len(v))
			for _, t := range v {
				t = strings.TrimSpace(t)
				if t != "" {
					out = append(out, t)
				}
			}
			return out
		}
	}
	return nil
}

// splitGroupTags splits a comma-separated tag string into a []string,
// trimming surrounding whitespace and discarding empty entries.
func splitGroupTags(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// mergeG combines the existing g tag string with the supplied extra tags,
// returning a single comma-separated string.
func mergeG(existing string, extra []string) string {
	if len(extra) == 0 {
		return existing
	}
	tags := splitGroupTags(existing)
	tags = append(tags, extra...)
	return strings.Join(tags, ",")
}

// GrammarText parses a jsonic grammar text string into a GrammarSpec
// and applies it. The text is parsed using a default Jsonic instance,
// and the resulting map is used as the OptionsMap of a GrammarSpec.
// An optional *GrammarSetting may be supplied to append a tag (or tags)
// to every rule-alt G property in the spec.
// This is a convenience that replaces:
//
//	gs := jsonic.Make()
//	parsed, _ := gs.Parse(text)
//	j.Grammar(&GrammarSpec{OptionsMap: parsed.(map[string]any)})
func (j *Jsonic) GrammarText(text string, setting ...*GrammarSetting) error {
	parsed, err := Make().Parse(text)
	if err != nil {
		return err
	}
	if parsed == nil {
		return nil
	}
	gsMap, ok := parsed.(map[string]any)
	if !ok {
		return fmt.Errorf("GrammarText: expected map, got %T", parsed)
	}
	gs := &GrammarSpec{}
	if optionsMap, ok := gsMap["options"].(map[string]any); ok {
		gs.OptionsMap = optionsMap
	} else if _, hasRule := gsMap["rule"]; !hasRule {
		// No "options" wrapper and no "rule" key — treat the entire map as options.
		gs.OptionsMap = gsMap
	}
	if ruleMap, ok := gsMap["rule"].(map[string]any); ok {
		gs.Rule = mapToGrammarRules(ruleMap)
	}
	return j.Grammar(gs, setting...)
}

// mapToGrammarRules converts a parsed rule map into typed GrammarRuleSpec map.
func mapToGrammarRules(ruleMap map[string]any) map[string]*GrammarRuleSpec {
	rules := make(map[string]*GrammarRuleSpec, len(ruleMap))
	for name, v := range ruleMap {
		rm, ok := v.(map[string]any)
		if !ok {
			continue
		}
		spec := &GrammarRuleSpec{}
		if open, ok := rm["open"]; ok {
			spec.Open = parseGrammarAltsOrSpec(open)
		}
		if close, ok := rm["close"]; ok {
			spec.Close = parseGrammarAltsOrSpec(close)
		}
		rules[name] = spec
	}
	return rules
}

// parseGrammarAltsOrSpec handles both forms:
//   - []any (plain alt array) → []*GrammarAltSpec
//   - map[string]any with "alts" and "inject" → *GrammarAltListSpec
func parseGrammarAltsOrSpec(v any) any {
	// Plain array form.
	if arr, ok := v.([]any); ok {
		return parseGrammarAlts(arr)
	}
	// Map form with alts + inject.
	if m, ok := v.(map[string]any); ok {
		altsRaw, hasAlts := m["alts"]
		if !hasAlts {
			return nil
		}
		altsArr, ok := altsRaw.([]any)
		if !ok {
			return nil
		}
		alts := parseGrammarAlts(altsArr)
		spec := &GrammarAltListSpec{Alts: alts}
		if injectRaw, ok := m["inject"].(map[string]any); ok {
			spec.Inject = &GrammarInjectSpec{}
			if append_, ok := injectRaw["append"].(bool); ok {
				spec.Inject.Append = append_
			}
			if del, ok := injectRaw["delete"].([]any); ok {
				for _, d := range del {
					if f, ok := d.(float64); ok {
						spec.Inject.Delete = append(spec.Inject.Delete, int(f))
					}
				}
			}
			if mv, ok := injectRaw["move"].([]any); ok {
				for _, m := range mv {
					if f, ok := m.(float64); ok {
						spec.Inject.Move = append(spec.Inject.Move, int(f))
					}
				}
			}
		}
		return spec
	}
	return nil
}

// parseGrammarAlts converts a parsed alt array ([]any of maps) to []*GrammarAltSpec.
func parseGrammarAlts(arr []any) []*GrammarAltSpec {
	alts := make([]*GrammarAltSpec, 0, len(arr))
	for _, item := range arr {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		alt := mapToGrammarAltSpec(m)
		alts = append(alts, alt)
	}
	return alts
}

// mapToGrammarAltSpec converts a parsed map to a GrammarAltSpec.
func mapToGrammarAltSpec(m map[string]any) *GrammarAltSpec {
	alt := &GrammarAltSpec{}
	if v, ok := m["s"]; ok {
		alt.S = v // string or []string ([]any of strings)
	}
	if v, ok := m["b"]; ok {
		alt.B = v // int (float64 from parse) or FuncRef string
	}
	if v, ok := m["p"].(string); ok {
		alt.P = v
	}
	if v, ok := m["r"].(string); ok {
		alt.R = v
	}
	if v, ok := m["a"].(string); ok {
		alt.A = v
	}
	if v, ok := m["e"].(string); ok {
		alt.E = v
	}
	if v, ok := m["h"].(string); ok {
		alt.H = v
	}
	if v, ok := m["c"]; ok {
		alt.C = v // FuncRef string or map[string]any
	}
	if v, ok := m["n"].(map[string]any); ok {
		alt.N = make(map[string]int, len(v))
		for k, val := range v {
			if f, ok := val.(float64); ok {
				alt.N[k] = int(f)
			}
		}
	}
	if v, ok := m["u"].(map[string]any); ok {
		alt.U = v
	}
	if v, ok := m["k"].(map[string]any); ok {
		alt.K = v
	}
	if v, ok := m["g"].(string); ok {
		alt.G = v
	}
	return alt
}

// applyGrammarAlts resolves and applies grammar alts to a rule spec.
// Handles both plain []*GrammarAltSpec and *GrammarAltListSpec with inject.
// When extraG is non-empty, those tags are appended to every alt's G field.
func applyGrammarAlts(j *Jsonic, rs *RuleSpec, spec any, ref map[FuncRef]any, isOpen bool, extraG []string) error {
	var gas []*GrammarAltSpec
	var inject *GrammarInjectSpec

	switch v := spec.(type) {
	case []*GrammarAltSpec:
		gas = v
	case *GrammarAltListSpec:
		gas = v.Alts
		inject = v.Inject
	default:
		return nil
	}

	// Append the setting's alt-g tags to each alt's G prior to resolution.
	if len(extraG) > 0 {
		merged := make([]*GrammarAltSpec, len(gas))
		for i, ga := range gas {
			if ga == nil {
				merged[i] = nil
				continue
			}
			cp := *ga
			cp.G = mergeG(ga.G, extraG)
			merged[i] = &cp
		}
		gas = merged
	}

	resolved, err := j.resolveGrammarAlts(gas, ref)
	if err != nil {
		return err
	}

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

	return nil
}

// resolveGrammarAlts converts a slice of GrammarAltSpec to concrete AltSpec.
func (j *Jsonic) resolveGrammarAlts(gas []*GrammarAltSpec, ref map[FuncRef]any) ([]*AltSpec, error) {
	alts := make([]*AltSpec, 0, len(gas))
	for _, ga := range gas {
		alt, err := j.resolveGrammarAlt(ga, ref)
		if err != nil {
			return nil, err
		}
		alts = append(alts, alt)
	}
	return alts, nil
}

// resolveGrammarAlt converts a single GrammarAltSpec to a concrete AltSpec.
func (j *Jsonic) resolveGrammarAlt(ga *GrammarAltSpec, ref map[FuncRef]any) (*AltSpec, error) {
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
		fn, err := RequireRef(ref, v, "backtrack")
		if err != nil {
			return nil, err
		}
		if bf, ok := fn.(func(*Rule, *Context) int); ok {
			alt.BF = bf
		} else {
			return nil, fmt.Errorf("Grammar: ref %q is not a backtrack function", v)
		}
	}

	// Resolve P (push: rule name or FuncRef)
	if ga.P != "" {
		if IsFuncRef(ga.P) {
			fn, err := RequireRef(ref, ga.P, "push")
			if err != nil {
				return nil, err
			}
			if pf, ok := fn.(func(*Rule, *Context) string); ok {
				alt.PF = pf
			} else {
				return nil, fmt.Errorf("Grammar: ref %q is not a push function", ga.P)
			}
		} else {
			alt.P = ga.P
		}
	}

	// Resolve R (replace: rule name or FuncRef)
	if ga.R != "" {
		if IsFuncRef(ga.R) {
			fn, err := RequireRef(ref, ga.R, "replace")
			if err != nil {
				return nil, err
			}
			if rf, ok := fn.(func(*Rule, *Context) string); ok {
				alt.RF = rf
			} else {
				return nil, fmt.Errorf("Grammar: ref %q is not a replace function", ga.R)
			}
		} else {
			alt.R = ga.R
		}
	}

	// Resolve A (action)
	if ga.A != "" {
		fn, err := RequireRef(ref, ga.A, "action")
		if err != nil {
			return nil, err
		}
		if af, ok := fn.(AltAction); ok {
			alt.A = af
		} else {
			return nil, fmt.Errorf("Grammar: ref %q is not an AltAction", ga.A)
		}
	}

	// Resolve E (error)
	if ga.E != "" {
		fn, err := RequireRef(ref, ga.E, "error")
		if err != nil {
			return nil, err
		}
		if ef, ok := fn.(AltError); ok {
			alt.E = ef
		} else {
			return nil, fmt.Errorf("Grammar: ref %q is not an AltError", ga.E)
		}
	}

	// Resolve H (modifier)
	if ga.H != "" {
		fn, err := RequireRef(ref, ga.H, "modifier")
		if err != nil {
			return nil, err
		}
		if hf, ok := fn.(AltModifier); ok {
			alt.H = hf
		} else {
			return nil, fmt.Errorf("Grammar: ref %q is not an AltModifier", ga.H)
		}
	}

	// Resolve C (condition: FuncRef or declarative map)
	switch cv := ga.C.(type) {
	case string:
		fn, err := RequireRef(ref, cv, "condition")
		if err != nil {
			return nil, err
		}
		if cf, ok := fn.(AltCond); ok {
			alt.C = cf
		} else {
			return nil, fmt.Errorf("Grammar: ref %q is not an AltCond", cv)
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

	// Normalize declarative conditions and validate group tags.
	if err := NormAlt(alt); err != nil {
		return nil, err
	}

	return alt, nil
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
	// Unknown tokens in static context are programming errors in the internal grammar.
	// Return empty slice rather than panicking.
	return nil
}

// resolveGrammarAltStatic converts a GrammarAltSpec to a concrete AltSpec
// using only built-in token resolution. Used by the internal Grammar().
// Errors cause the returned alt to have nil fields (best-effort).
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
		if fn := LookupRef(ref, v); fn != nil {
			if bf, ok := fn.(func(*Rule, *Context) int); ok {
				alt.BF = bf
			}
		}
	}

	if ga.P != "" {
		if IsFuncRef(ga.P) {
			if fn := LookupRef(ref, ga.P); fn != nil {
				if pf, ok := fn.(func(*Rule, *Context) string); ok {
					alt.PF = pf
				}
			}
		} else {
			alt.P = ga.P
		}
	}

	if ga.R != "" {
		if IsFuncRef(ga.R) {
			if fn := LookupRef(ref, ga.R); fn != nil {
				if rf, ok := fn.(func(*Rule, *Context) string); ok {
					alt.RF = rf
				}
			}
		} else {
			alt.R = ga.R
		}
	}

	if ga.A != "" {
		if fn := LookupRef(ref, ga.A); fn != nil {
			alt.A = fn.(AltAction)
		}
	}
	if ga.E != "" {
		if fn := LookupRef(ref, ga.E); fn != nil {
			alt.E = fn.(AltError)
		}
	}
	if ga.H != "" {
		if fn := LookupRef(ref, ga.H); fn != nil {
			alt.H = fn.(AltModifier)
		}
	}

	switch cv := ga.C.(type) {
	case string:
		if fn := LookupRef(ref, cv); fn != nil {
			alt.C = fn.(AltCond)
		}
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

	// Internal grammar is constructed from trusted tag literals, so a
	// validation error here indicates a programming bug rather than bad
	// user input. Ignore the error — it will surface if a library author
	// ever adds a malformed tag, via the regular Grammar/GrammarText path.
	_ = NormAlt(alt)
	return alt
}

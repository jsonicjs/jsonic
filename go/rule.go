package jsonic

// RuleState represents whether a rule is in open or close state.
type RuleState = string

const (
	OPEN  RuleState = "o"
	CLOSE RuleState = "c"
)

// Undefined is a sentinel value distinguishing "no value" from nil (null).
// In TypeScript, undefined !== null. In Go, we use this sentinel.
type undefinedType struct{}

var Undefined any = &undefinedType{}

// IsUndefined checks if a value is the Undefined sentinel.
func IsUndefined(v any) bool {
	_, ok := v.(*undefinedType)
	return ok
}

// UnwrapUndefined converts Undefined sentinels to nil in the result.
func UnwrapUndefined(v any) any {
	if IsUndefined(v) {
		return nil
	}
	switch val := v.(type) {
	case map[string]any:
		for k, vv := range val {
			val[k] = UnwrapUndefined(vv)
		}
		return val
	case []any:
		for i, vv := range val {
			val[i] = UnwrapUndefined(vv)
		}
		return val
	}
	return v
}

// AltCond is a condition function for an alternate.
type AltCond func(r *Rule, ctx *Context) bool

// AltAction is an action function for an alternate.
type AltAction func(r *Rule, ctx *Context)

// AltError is an error function for an alternate.
type AltError func(r *Rule, ctx *Context) *Token

// StateAction is a before/after action on a rule state transition.
type StateAction func(r *Rule, ctx *Context)

// AltSpec defines a parse alternate specification.
type AltSpec struct {
	S [][]Tin         // Token Tin sequences to match: s[0] for t0, s[1] for t1
	P string          // Push rule name (create child)
	R string          // Replace rule name (create sibling)
	B int             // Move token pointer backward (backtrack)
	C AltCond         // Custom condition
	N map[string]int  // Counter increments
	A AltAction       // Match action
	U map[string]any  // Custom props added to Rule.u
	K map[string]any  // Custom props added to Rule.k (propagated)
	G string          // Named group tags (comma-separated)
	E AltError        // Error generation
}

// RuleSpec defines the specification for a parsing rule.
type RuleSpec struct {
	Name  string
	Open  []*AltSpec
	Close []*AltSpec
	BO    []StateAction // Before-open actions
	BC    []StateAction // Before-close actions
	AO    []StateAction // After-open actions
	AC    []StateAction // After-close actions
}

// Rule represents a rule instance during parsing.
type Rule struct {
	I      int
	Name   string
	Spec   *RuleSpec
	Node   any
	State  RuleState
	D      int
	Child  *Rule
	Parent *Rule
	Prev   *Rule
	Next   *Rule
	O0     *Token
	O1     *Token
	C0     *Token
	C1     *Token
	OS     int
	CS     int
	N      map[string]int
	U      map[string]any
	K      map[string]any
	Why    string
}

// NoRule is a sentinel rule.
// Node is Undefined (like TS where NORULE.node = undefined).
var NoRule *Rule

func init() {
	NoRule = &Rule{Name: "norule", I: -1, State: OPEN, Node: Undefined,
		N: make(map[string]int), U: make(map[string]any), K: make(map[string]any)}
}

// Eq checks if counter equals limit (nil/missing → true).
func (r *Rule) Eq(counter string, limit int) bool {
	val, ok := r.N[counter]
	return !ok || val == limit
}

// Lt checks if counter < limit (nil/missing → true).
func (r *Rule) Lt(counter string, limit int) bool {
	val, ok := r.N[counter]
	return !ok || val < limit
}

// Gt checks if counter > limit (nil/missing → true).
func (r *Rule) Gt(counter string, limit int) bool {
	val, ok := r.N[counter]
	return !ok || val > limit
}

// Lte checks if counter <= limit (nil/missing → true).
func (r *Rule) Lte(counter string, limit int) bool {
	val, ok := r.N[counter]
	return !ok || val <= limit
}

// Gte checks if counter >= limit (nil/missing → true).
func (r *Rule) Gte(counter string, limit int) bool {
	val, ok := r.N[counter]
	return !ok || val >= limit
}

// MakeRule creates a new Rule from a RuleSpec.
func MakeRule(spec *RuleSpec, ctx *Context, node any) *Rule {
	r := &Rule{
		I: ctx.UI, Name: spec.Name, Spec: spec, Node: node,
		State: OPEN, D: ctx.RSI,
		Child: NoRule, Parent: NoRule, Prev: NoRule, Next: NoRule,
		O0: NoToken, O1: NoToken, C0: NoToken, C1: NoToken,
		N: make(map[string]int), U: make(map[string]any), K: make(map[string]any),
	}
	ctx.UI++
	return r
}

// Process processes this rule, returning the next rule to process.
func (r *Rule) Process(ctx *Context, lex *Lex) *Rule {
	isOpen := r.State == OPEN
	var next *Rule
	if isOpen {
		next = r
	} else {
		next = NoRule
	}

	def := r.Spec
	var alts []*AltSpec
	if isOpen {
		alts = def.Open
	} else {
		alts = def.Close
	}

	// Before actions
	if isOpen && len(def.BO) > 0 {
		for _, action := range def.BO {
			action(r, ctx)
		}
	} else if !isOpen && len(def.BC) > 0 {
		for _, action := range def.BC {
			action(r, ctx)
		}
	}

	// Match alternates
	alt, _ := ParseAlts(isOpen, alts, lex, r, ctx)

	// Error check (lenient - ignore errors for auto-close)
	if alt != nil && alt.E != nil {
		errTkn := alt.E(r, ctx)
		_ = errTkn // jsonic is lenient, auto-closes
	}

	// Update counters
	if alt != nil && alt.N != nil {
		for cn, cv := range alt.N {
			if cv == 0 {
				r.N[cn] = 0
			} else {
				if _, ok := r.N[cn]; !ok {
					r.N[cn] = 0
				}
				r.N[cn] += cv
			}
		}
	}

	// Set custom properties
	if alt != nil && alt.U != nil {
		for k, v := range alt.U {
			r.U[k] = v
		}
	}
	if alt != nil && alt.K != nil {
		for k, v := range alt.K {
			r.K[k] = v
		}
	}

	// Action callback
	if alt != nil && alt.A != nil {
		alt.A(r, ctx)
	}

	// Push / Replace / Pop
	if alt != nil && alt.P != "" {
		rulespec, ok := ctx.RSM[alt.P]
		if ok {
			ctx.RS[ctx.RSI] = r
			ctx.RSI++
			next = MakeRule(rulespec, ctx, r.Node)
			r.Child = next
			next.Parent = r
			for k, v := range r.N {
				next.N[k] = v
			}
			if len(r.K) > 0 {
				for k, v := range r.K {
					next.K[k] = v
				}
			}
		}
	} else if alt != nil && alt.R != "" {
		rulespec, ok := ctx.RSM[alt.R]
		if ok {
			next = MakeRule(rulespec, ctx, r.Node)
			next.Parent = r.Parent
			next.Prev = r
			for k, v := range r.N {
				next.N[k] = v
			}
			if len(r.K) > 0 {
				for k, v := range r.K {
					next.K[k] = v
				}
			}
		}
	} else if !isOpen {
		// Pop
		if ctx.RSI > 0 {
			ctx.RSI--
			next = ctx.RS[ctx.RSI]
		} else {
			next = NoRule
		}
	}

	r.Next = next

	// After actions
	if isOpen && len(def.AO) > 0 {
		for _, action := range def.AO {
			action(r, ctx)
		}
	} else if !isOpen && len(def.AC) > 0 {
		for _, action := range def.AC {
			action(r, ctx)
		}
	}

	// State transition
	if r.State == OPEN {
		r.State = CLOSE
	}

	// Token consumption with backtrack (only when an alt matched)
	if alt != nil {
		backtrack := alt.B
		var consumed int
		if isOpen {
			consumed = r.OS - backtrack
		} else {
			consumed = r.CS - backtrack
		}

		if consumed == 1 {
			ctx.V2 = ctx.V1
			ctx.V1 = ctx.T0
			ctx.T0 = ctx.T1
			ctx.T1 = NoToken
		} else if consumed == 2 {
			ctx.V2 = ctx.T1
			ctx.V1 = ctx.T0
			ctx.T0 = NoToken
			ctx.T1 = NoToken
		}
	}

	return next
}

// ParseAlts attempts to match one of the alternates.
func ParseAlts(isOpen bool, alts []*AltSpec, lex *Lex, rule *Rule, ctx *Context) (*AltSpec, bool) {
	if len(alts) == 0 {
		return nil, false
	}

	for _, alt := range alts {
		has0, has1 := false, false
		cond := true

		if len(alt.S) > 0 && len(alt.S[0]) > 0 {
			if ctx.T0.IsNoToken() {
				ctx.T0 = lex.Next()
			}
			has0 = true
			cond = tinMatch(ctx.T0.Tin, alt.S[0])

			if cond && len(alt.S) > 1 && len(alt.S[1]) > 0 {
				if ctx.T1.IsNoToken() {
					ctx.T1 = lex.Next()
				}
				has1 = true
				cond = tinMatch(ctx.T1.Tin, alt.S[1])
			}
		}

		if isOpen {
			if has0 {
				rule.O0 = ctx.T0
			} else {
				rule.O0 = NoToken
			}
			if has1 {
				rule.O1 = ctx.T1
			} else {
				rule.O1 = NoToken
			}
			rule.OS = boolToInt(has0) + boolToInt(has1)
		} else {
			if has0 {
				rule.C0 = ctx.T0
			} else {
				rule.C0 = NoToken
			}
			if has1 {
				rule.C1 = ctx.T1
			} else {
				rule.C1 = NoToken
			}
			rule.CS = boolToInt(has0) + boolToInt(has1)
		}

		if cond && alt.C != nil {
			cond = alt.C(rule, ctx)
		}

		if cond {
			return alt, true
		}
	}

	return nil, false
}

func tinMatch(tin Tin, tins []Tin) bool {
	for _, t := range tins {
		if tin == t {
			return true
		}
	}
	return false
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

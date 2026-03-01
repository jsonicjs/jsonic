package jsonic

// Grammar builds the default jsonic grammar rules.
// This is a faithful port of grammar.ts, matching the exact alternate orderings
// produced by the JSON phase followed by the Jsonic extension phase.
//
// Key: "unshift" means prepend (default when no {append:true}),
//      "push" means append (when {append:true}).
func Grammar(rsm map[string]*RuleSpec, cfg *LexConfig) {
	// Token sets
	VAL := TinSetVAL // TX, NR, ST, VL
	KEY := TinSetKEY // TX, NR, ST, VL

	// Helper: merge two Tin slices
	merge := func(a, b []Tin) []Tin {
		r := make([]Tin, 0, len(a)+len(b))
		r = append(r, a...)
		r = append(r, b...)
		return r
	}

	// finish error function: if auto-close is disabled, return error token
	finish := func(r *Rule, ctx *Context) *Token {
		if !cfg.FinishRule {
			return ctx.T0
		}
		return nil
	}

	// pairkey action: extract key from first matched token
	pairkey := func(r *Rule, ctx *Context) {
		_ = ctx
		keyToken := r.O0
		var key string
		if keyToken.Tin == TinST || keyToken.Tin == TinTX {
			key, _ = keyToken.Val.(string)
		} else {
			key = keyToken.Src // Numbers, etc. use src as key
		}
		r.U["key"] = key
	}

	// pairval: set key:value on node with merging support.
	// Uses r.U["prev"] (saved by pair.BC[0]) to get the previous value,
	// then deep-merges if both previous and new values are maps.
	pairval := func(r *Rule, ctx *Context) {
		_ = ctx
		key, _ := r.U["key"].(string)
		val := r.Child.Node

		// Convert undefined to null
		if IsUndefined(val) {
			val = nil
		}

		// Use saved previous value (set by pair.BC JSON phase before overwrite)
		prev := r.U["prev"]

		if prev == nil {
			nodeMapSet(r.Node, key, val)
		} else {
			// Deep merge using the Deep utility
			nodeMapSet(r.Node, key, Deep(prev, val))
		}
	}

	// ====== VAL rule ======
	valSpec := &RuleSpec{Name: "val"}

	// BO callbacks (JSON then Jsonic):
	// JSON: clear node for new value
	valSpec.BO = []StateAction{
		func(r *Rule, ctx *Context) {
			_ = ctx
			r.Node = Undefined // undefined in TS
		},
	}

	// BC callbacks (JSON then Jsonic):
	// JSON: resolve node value
	valSpec.BC = []StateAction{
		func(r *Rule, ctx *Context) {
			_ = ctx
			if IsUndefined(r.Node) {
				if IsUndefined(r.Child.Node) {
					if r.OS == 0 {
						r.Node = Undefined // no value
					} else {
						val := r.O0.ResolveVal()
						if cfg.TextInfo && (r.O0.Tin == TinST || r.O0.Tin == TinTX) {
							quote := ""
							if r.O0.Tin == TinST && len(r.O0.Src) > 0 {
								quote = string(r.O0.Src[0])
							}
							str, _ := val.(string)
							val = Text{Quote: quote, Str: str}
						}
						r.Node = val
					}
				} else {
					r.Node = r.Child.Node
				}
			}
			// else: keep r.Node as is
		},
	}

	// val.Open ordering (after JSON + Jsonic with append:true, delete:[2]):
	// [0] OB → map (JSON)
	// [1] OS → list (JSON)
	// [2] KEY CL → implicit map at top (Jsonic, was [3] before delete)
	// [3] KEY CL → pair dive (Jsonic)
	// [4] VAL → plain value (Jsonic, replaces deleted JSON [2])
	// [5] CB/CS → implicit null ends (Jsonic)
	// [6] CA → implicit list top (Jsonic)
	// [7] CA → null before commas (Jsonic)
	// [8] ZZ → end (Jsonic)
	valSpec.Open = []*AltSpec{
		// JSON: A map: { ...
		{S: [][]Tin{{TinOB}}, P: "map", B: 1},
		// JSON: A list: [ ...
		{S: [][]Tin{{TinOS}}, P: "list", B: 1},
		// Jsonic: Implicit map at top level: a: ...
		{S: [][]Tin{KEY, {TinCL}}, C: func(r *Rule, ctx *Context) bool { return r.D == 0 }, P: "map", B: 2},
		// Jsonic: Pair dive: a:b: ...
		{S: [][]Tin{KEY, {TinCL}}, P: "map", B: 2, N: map[string]int{"pk": 1}},
		// Jsonic: A plain value
		{S: [][]Tin{VAL}},
		// Jsonic: Implicit ends {a:} → null, [a:] → null
		{S: [][]Tin{{TinCB, TinCS}}, B: 1, C: func(r *Rule, ctx *Context) bool { return r.D > 0 }},
		// Jsonic: Implicit list at top level: a,b
		{S: [][]Tin{{TinCA}}, C: func(r *Rule, ctx *Context) bool { return r.D == 0 }, P: "list", B: 1},
		// Jsonic: Value is implicitly null before commas
		{S: [][]Tin{{TinCA}}, B: 1},
		// Jsonic: End of source
		{S: [][]Tin{{TinZZ}}},
	}

	// val.Close ordering (after JSON + Jsonic with append:true, move:[1,-1]):
	// [0] ZZ (JSON end)
	// [1] CB/CS close (Jsonic)
	// [2] CA implist comma (Jsonic)
	// [3] condition-only implist space (Jsonic)
	// [4] ZZ (Jsonic end)
	// [5] b:1 more (JSON, moved to end)
	valSpec.Close = []*AltSpec{
		// JSON: End of source
		{S: [][]Tin{{TinZZ}}},
		// Jsonic: Explicitly close map or list: }, ]
		{S: [][]Tin{{TinCB, TinCS}}, B: 1,
			E: func(r *Rule, ctx *Context) *Token {
				if r.D == 0 {
					return ctx.T0
				}
				return nil
			},
		},
		// Jsonic: Implicit list (comma sep)
		{S: [][]Tin{{TinCA}},
			C: func(r *Rule, ctx *Context) bool { return r.Lte("dlist", 0) && r.Lte("dmap", 0) },
			R: "list", U: map[string]any{"implist": true}},
		// Jsonic: Implicit list (space sep) - no token match, just condition
		{C: func(r *Rule, ctx *Context) bool { return r.Lte("dlist", 0) && r.Lte("dmap", 0) },
			R: "list", U: map[string]any{"implist": true}, B: 1},
		// Jsonic: End of source
		{S: [][]Tin{{TinZZ}}},
		// JSON: There's more - backtrack (MOVED TO END by move:[1,-1])
		{B: 1},
	}

	// ====== MAP rule ======
	mapSpec := &RuleSpec{Name: "map"}

	// BO callbacks (JSON then Jsonic):
	mapSpec.BO = []StateAction{
		// JSON: create empty map
		func(r *Rule, ctx *Context) {
			_ = ctx
			r.Node = make(map[string]any)
		},
		// Jsonic: increment dmap depth
		func(r *Rule, ctx *Context) {
			_ = ctx
			if v, ok := r.N["dmap"]; ok {
				r.N["dmap"] = v + 1
			} else {
				r.N["dmap"] = 1
			}
		},
	}

	// map.Open ordering (after Jsonic unshift + append):
	// [0] OB ZZ auto-close (Jsonic, unshifted)
	// [1] OB CB empty map (JSON)
	// [2] OB pair (JSON)
	// [3] KEY CL implicit pair (Jsonic, appended)
	mapSpec.Open = []*AltSpec{
		// Jsonic: Auto-close at EOF: {ZZ (unshifted - no append flag)
		{S: [][]Tin{{TinOB}, {TinZZ}}, B: 1, E: finish},
		// JSON: Empty map: {}
		{S: [][]Tin{{TinOB}, {TinCB}}, B: 1, N: map[string]int{"pk": 0}},
		// JSON: Start pairs: {key:
		{S: [][]Tin{{TinOB}}, P: "pair", N: map[string]int{"pk": 0}},
		// Jsonic: Pair from implicit map (no braces) (appended)
		{S: [][]Tin{KEY, {TinCL}}, P: "pair", B: 2},
	}

	// map.Close ordering (after Jsonic append + delete:[0]):
	// [0] CB with lte(pk) (Jsonic, replaces deleted JSON [0])
	// [1] CB b:1 ascending path (Jsonic)
	// [2] CA/CS/VAL b:1 end of implicit path (Jsonic)
	// [3] ZZ auto-close (Jsonic)
	mapSpec.Close = []*AltSpec{
		// Normal end of map, no path dive
		{S: [][]Tin{{TinCB}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }},
		// Not yet at end of path dive, keep ascending
		{S: [][]Tin{{TinCB}}, B: 1},
		// End of implicit path: comma, close-square, or value token
		{S: [][]Tin{merge([]Tin{TinCA, TinCS}, VAL)}, B: 1},
		// Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish},
	}

	// ====== LIST rule ======
	listSpec := &RuleSpec{Name: "list"}

	// BO callbacks (JSON then Jsonic):
	listSpec.BO = []StateAction{
		// JSON: create empty list
		func(r *Rule, ctx *Context) {
			_ = ctx
			r.Node = make([]any, 0)
		},
		// Jsonic: increment dlist depth, handle implist
		func(r *Rule, ctx *Context) {
			_ = ctx
			if v, ok := r.N["dlist"]; ok {
				r.N["dlist"] = v + 1
			} else {
				r.N["dlist"] = 1
			}
			// If previous rule was an implicit list, adopt its node
			if r.Prev != NoRule && r.Prev != nil {
				if implist, ok := r.Prev.U["implist"]; ok && implist == true {
					arr := r.Node.([]any)
					prevNode := r.Prev.Node
					if IsUndefined(prevNode) {
						prevNode = nil
					}
					arr = append(arr, prevNode)
					r.Node = arr
					r.Prev.Node = r.Node
				}
			}
		},
	}

	// BC callbacks:
	listSpec.BC = []StateAction{
		// Wrap list in ListRef if option is enabled.
		func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.ListRef {
				implicit := !(r.O0 != NoToken && r.O0.Tin == TinOS)
				if arr, ok := r.Node.([]any); ok {
					r.Node = ListRef{Val: arr, Implicit: implicit}
				}
			}
		},
	}

	// list.Open ordering (Jsonic unshift + JSON + Jsonic append):
	// [0] implist condition (Jsonic, unshifted as single object)
	// [1] OS CS empty list (JSON)
	// [2] OS elem (JSON)
	// [3] CA elem b:1 initial comma (Jsonic, appended)
	// [4] p:elem (Jsonic, appended)
	listSpec.Open = []*AltSpec{
		// Jsonic: if prev was implist, just push elem (unshifted)
		{C: func(r *Rule, ctx *Context) bool {
			return r.Prev != NoRule && r.Prev != nil && r.Prev.U["implist"] == true
		}, P: "elem"},
		// JSON: Empty list: []
		{S: [][]Tin{{TinOS}, {TinCS}}, B: 1},
		// JSON: Start elements: [elem
		{S: [][]Tin{{TinOS}}, P: "elem"},
		// Jsonic: Initial comma [, will insert null
		{S: [][]Tin{{TinCA}}, P: "elem", B: 1},
		// Jsonic: Another element (no token match needed)
		{P: "elem"},
	}

	// list.Close ordering (JSON + Jsonic append):
	// [0] CS end of list (JSON)
	// [1] ZZ auto-close (Jsonic, appended)
	listSpec.Close = []*AltSpec{
		// JSON: End of list
		{S: [][]Tin{{TinCS}}},
		// Jsonic: Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish},
	}

	// ====== PAIR rule ======
	pairSpec := &RuleSpec{Name: "pair"}

	// BC callbacks (JSON then Jsonic):
	pairSpec.BC = []StateAction{
		// JSON phase: set key=value
		func(r *Rule, ctx *Context) {
			if _, ok := r.U["pair"]; ok {
				r.U["prev"] = nodeMapGetVal(r.Node, r.U["key"])
				nodeMapSet(r.Node, r.U["key"].(string), r.Child.Node)
			}
		},
		// Jsonic phase: pairval with merge support
		func(r *Rule, ctx *Context) {
			if _, ok := r.U["pair"]; ok {
				pairval(r, ctx)
			}
		},
	}

	// pair.Open ordering (JSON + Jsonic append):
	// [0] KEY CL pair (JSON)
	// [1] CA ignore comma (Jsonic, appended)
	pairSpec.Open = []*AltSpec{
		// JSON: key:value pair
		{S: [][]Tin{KEY, {TinCL}}, P: "val", U: map[string]any{"pair": true}, A: pairkey},
		// Jsonic: Ignore initial comma: {,a:1
		{S: [][]Tin{{TinCA}}},
	}

	// pair.Close ordering (after Jsonic unshift + delete:[0,1]):
	// Jsonic alternates unshifted, then JSON [0] and [1] deleted.
	// Final ordering:
	// [0] CB lte(pk) b:1 (Jsonic)
	// [1] CA CB lte(pk) b:1 (Jsonic)
	// [2] CA ZZ (Jsonic)
	// [3] CA lte(pk) r:pair (Jsonic)
	// [4] CA lte(dmap,1) r:pair (Jsonic)
	// [5] KEY lte(dmap,1) r:pair b:1 (Jsonic)
	// [6] CB/CA/CS/KEY pk>0 b:1 (Jsonic)
	// [7] CS error (Jsonic)
	// [8] ZZ finish (Jsonic)
	// [9] r:pair b:1 (Jsonic)
	pairSpec.Close = []*AltSpec{
		// Jsonic: End of map, check pk depth
		{S: [][]Tin{{TinCB}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, B: 1},
		// Jsonic: Ignore trailing comma at end of map
		{S: [][]Tin{{TinCA}, {TinCB}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, B: 1},
		// Jsonic: Comma then EOF
		{S: [][]Tin{{TinCA}, {TinZZ}}},
		// Jsonic: Comma means new pair at same level (with pk check)
		{S: [][]Tin{{TinCA}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, R: "pair"},
		// Jsonic: Comma means new pair if implicit top level map
		{S: [][]Tin{{TinCA}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("dmap", 1) }, R: "pair"},
		// Jsonic: Value means new pair (space-separated) if implicit top level map
		{S: [][]Tin{KEY}, C: func(r *Rule, ctx *Context) bool { return r.Lte("dmap", 1) }, R: "pair", B: 1},
		// Jsonic: End of implicit path, keep closing until pk=0
		{S: [][]Tin{merge([]Tin{TinCB, TinCA, TinCS}, KEY)},
			C: func(r *Rule, ctx *Context) bool { _, ok := r.N["pk"]; return ok && r.N["pk"] > 0 },
			B: 1},
		// Jsonic: Can't close map with ]
		{S: [][]Tin{{TinCS}}, E: func(r *Rule, ctx *Context) *Token { return r.C0 }},
		// Jsonic: Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish},
		// Jsonic: Who needs commas anyway? (implicit continuation)
		{R: "pair", B: 1},
	}

	// ====== ELEM rule ======
	elemSpec := &RuleSpec{Name: "elem"}

	// BC callbacks (JSON then Jsonic):
	elemSpec.BC = []StateAction{
		// JSON: push child node onto list
		func(r *Rule, ctx *Context) {
			_ = ctx
			done, _ := r.U["done"].(bool)
			if !done && !IsUndefined(r.Child.Node) {
				if arr, ok := r.Node.([]any); ok {
					r.Node = append(arr, r.Child.Node)
					// Propagate updated slice to parent list rule
					// (Go slices may reallocate on append, unlike JS arrays which are reference types)
					if r.Parent != NoRule && r.Parent != nil {
						r.Parent.Node = r.Node
					}
				}
			}
		},
		// Jsonic: handle pair-in-list
		func(r *Rule, ctx *Context) {
			if pair, ok := r.U["pair"]; ok && pair == true {
				r.U["prev"] = nodeMapGetVal(r.Node, r.U["key"])
				pairval(r, ctx)
			}
		},
	}

	// elem.Open ordering (Jsonic unshifted + JSON):
	// [0] CA CA double comma null (Jsonic, unshifted)
	// [1] CA single comma null (Jsonic, unshifted)
	// [2] KEY CL pair in list (Jsonic, unshifted)
	// [3] p:val (JSON, original)
	elemSpec.Open = []*AltSpec{
		// Jsonic: Empty commas insert null (CA CA)
		{S: [][]Tin{{TinCA}, {TinCA}}, B: 2,
			U: map[string]any{"done": true},
			A: func(r *Rule, ctx *Context) {
				_ = ctx
				if arr, ok := r.Node.([]any); ok {
					r.Node = append(arr, nil)
					// Propagate to parent
					if r.Parent != NoRule && r.Parent != nil {
						r.Parent.Node = r.Node
					}
				}
			}},
		// Jsonic: Single comma inserts null
		{S: [][]Tin{{TinCA}},
			U: map[string]any{"done": true},
			A: func(r *Rule, ctx *Context) {
				_ = ctx
				if arr, ok := r.Node.([]any); ok {
					r.Node = append(arr, nil)
					// Propagate to parent
					if r.Parent != NoRule && r.Parent != nil {
						r.Parent.Node = r.Node
					}
				}
			}},
		// Jsonic: Pair in list [key:val]
		{S: [][]Tin{KEY, {TinCL}}, P: "val",
			N: map[string]int{"pk": 1, "dmap": 1},
			U: map[string]any{"done": true, "pair": true, "list": true},
			A: pairkey},
		// JSON: Element is a value
		{P: "val"},
	}

	// elem.Close ordering (Jsonic unshifted + delete:[-1,-2]):
	// [0] CA CS/ZZ trailing comma (Jsonic, unshifted)
	// [1] CA r:elem next element (Jsonic, unshifted)
	// [2] CS b:1 end of list (Jsonic, unshifted)
	// [3] ZZ finish (Jsonic, unshifted)
	// [4] CB error (Jsonic, unshifted)
	// [5] r:elem b:1 implicit (Jsonic, unshifted)
	// JSON [0] and [1] deleted by delete:[-1,-2]
	elemSpec.Close = []*AltSpec{
		// Jsonic: Ignore trailing comma before ] or ZZ
		{S: [][]Tin{{TinCA}, {TinCS, TinZZ}}, B: 1},
		// Jsonic: Next element
		{S: [][]Tin{{TinCA}}, R: "elem"},
		// Jsonic: End of list
		{S: [][]Tin{{TinCS}}, B: 1},
		// Jsonic: Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish},
		// Jsonic: Can't close list with }
		{S: [][]Tin{{TinCB}}, E: func(r *Rule, ctx *Context) *Token { return r.C0 }},
		// Jsonic: Who needs commas anyway? (implicit element)
		{R: "elem", B: 1},
	}

	rsm["val"] = valSpec
	rsm["map"] = mapSpec
	rsm["list"] = listSpec
	rsm["pair"] = pairSpec
	rsm["elem"] = elemSpec
}

// nodeMapSet sets a key on a map node.
func nodeMapSet(node any, key any, val any) {
	if m, ok := node.(map[string]any); ok {
		k, _ := key.(string)
		m[k] = val
	}
}

// nodeMapGet gets a value from a map node.
func nodeMapGet(node any, key any) (any, bool) {
	if m, ok := node.(map[string]any); ok {
		k, _ := key.(string)
		v, exists := m[k]
		return v, exists
	}
	return nil, false
}

// nodeMapGetVal is a helper that returns the value or nil.
func nodeMapGetVal(node any, key any) any {
	v, _ := nodeMapGet(node, key)
	return v
}

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
	// then merges according to cfg.MapMerge/cfg.MapExtend settings.
	pairval := func(r *Rule, ctx *Context) {
		key, _ := r.U["key"].(string)
		val := r.Child.Node

		// Convert undefined to null
		if IsUndefined(val) {
			val = nil
		}

		// safe.key: block __proto__ and constructor keys on arrays only.
		// Objects in Go (maps) don't have prototypes, same as TS Object.create(null).
		// Arrays in TS/JS have real prototypes, so __proto__ must be blocked there.
		if cfg.SafeKey && r.U["list"] == true {
			if key == "__proto__" || key == "constructor" {
				return
			}
		}

		// Use saved previous value (set by pair.BC JSON phase before overwrite)
		prev := r.U["prev"]

		if prev == nil {
			nodeMapSet(r.Node, key, val)
		} else if cfg.MapMerge != nil {
			// Custom merge function takes precedence
			nodeMapSet(r.Node, key, cfg.MapMerge(prev, val, r, ctx))
		} else if cfg.MapExtend {
			// Deep merge
			nodeMapSet(r.Node, key, Deep(prev, val))
		} else {
			// Plain overwrite (TS default when map.extend is false)
			nodeMapSet(r.Node, key, val)
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
		{S: [][]Tin{{TinOB}}, P: "map", B: 1, G: "json"},
		// JSON: A list: [ ...
		{S: [][]Tin{{TinOS}}, P: "list", B: 1, G: "json"},
		// Jsonic: Implicit map at top level: a: ...
		{S: [][]Tin{KEY, {TinCL}}, C: func(r *Rule, ctx *Context) bool { return r.D == 0 }, P: "map", B: 2, G: "jsonic"},
		// Jsonic: Pair dive: a:b: ...
		{S: [][]Tin{KEY, {TinCL}}, P: "map", B: 2, N: map[string]int{"pk": 1}, G: "jsonic"},
		// Jsonic: A plain value
		{S: [][]Tin{VAL}, G: "jsonic"},
		// Jsonic: Implicit ends {a:} → null, [a:] → null
		{S: [][]Tin{{TinCB, TinCS}}, B: 1, C: func(r *Rule, ctx *Context) bool { return r.D > 0 }, G: "jsonic"},
		// Jsonic: Implicit list at top level: a,b
		{S: [][]Tin{{TinCA}}, C: func(r *Rule, ctx *Context) bool { return r.D == 0 }, P: "list", B: 1, G: "jsonic"},
		// Jsonic: Value is implicitly null before commas
		{S: [][]Tin{{TinCA}}, B: 1, G: "jsonic"},
		// Jsonic: End of source
		{S: [][]Tin{{TinZZ}}, G: "jsonic"},
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
		{S: [][]Tin{{TinZZ}}, G: "json"},
		// Jsonic: Explicitly close map or list: }, ]
		{S: [][]Tin{{TinCB, TinCS}}, B: 1, G: "jsonic",
			E: func(r *Rule, ctx *Context) *Token {
				if r.D == 0 {
					return ctx.T0
				}
				return nil
			},
		},
		// Jsonic: Implicit list (comma sep)
		{S: [][]Tin{{TinCA}}, G: "jsonic",
			C: func(r *Rule, ctx *Context) bool { return r.Lte("dlist", 0) && r.Lte("dmap", 0) },
			R: "list", U: map[string]any{"implist": true}},
		// Jsonic: Implicit list (space sep) - no token match, just condition
		{C: func(r *Rule, ctx *Context) bool { return r.Lte("dlist", 0) && r.Lte("dmap", 0) },
			R: "list", U: map[string]any{"implist": true}, B: 1, G: "jsonic"},
		// Jsonic: End of source
		{S: [][]Tin{{TinZZ}}, G: "jsonic"},
		// JSON: There's more - backtrack (MOVED TO END by move:[1,-1])
		{B: 1, G: "json"},
	}

	// ====== MAP rule ======
	mapSpec := &RuleSpec{Name: "map"}

	// BO callbacks (JSON then Jsonic):
	mapSpec.BO = []StateAction{
		// JSON: create empty map (or MapRef if enabled)
		func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.MapRef {
				r.Node = MapRef{
					Val:  make(map[string]any),
					Meta: make(map[string]any),
				}
			} else {
				r.Node = make(map[string]any)
			}
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

	// BC callbacks:
	mapSpec.BC = []StateAction{
		// Set Implicit on MapRef if option is enabled.
		func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.MapRef {
				implicit := !(r.O0 != NoToken && r.O0.Tin == TinOB)
				if mr, ok := r.Node.(MapRef); ok {
					mr.Implicit = implicit
					r.Node = mr
				}
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
		{S: [][]Tin{{TinOB}, {TinZZ}}, B: 1, E: finish, G: "jsonic"},
		// JSON: Empty map: {}
		{S: [][]Tin{{TinOB}, {TinCB}}, B: 1, N: map[string]int{"pk": 0}, G: "json"},
		// JSON: Start pairs: {key:
		{S: [][]Tin{{TinOB}}, P: "pair", N: map[string]int{"pk": 0}, G: "json"},
		// Jsonic: Pair from implicit map (no braces) (appended)
		{S: [][]Tin{KEY, {TinCL}}, P: "pair", B: 2, G: "jsonic"},
	}

	// map.Close ordering (after Jsonic append + delete:[0]):
	// [0] CB with lte(pk) (Jsonic, replaces deleted JSON [0])
	// [1] CB b:1 ascending path (Jsonic)
	// [2] CA/CS/VAL b:1 end of implicit path (Jsonic)
	// [3] ZZ auto-close (Jsonic)
	mapSpec.Close = []*AltSpec{
		// Normal end of map, no path dive
		{S: [][]Tin{{TinCB}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, G: "jsonic"},
		// Not yet at end of path dive, keep ascending
		{S: [][]Tin{{TinCB}}, B: 1, G: "jsonic"},
		// End of implicit path: comma, close-square, or value token
		{S: [][]Tin{merge([]Tin{TinCA, TinCS}, VAL)}, B: 1, G: "jsonic"},
		// Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish, G: "jsonic"},
	}

	// ====== LIST rule ======
	listSpec := &RuleSpec{Name: "list"}

	// BO callbacks (JSON then Jsonic):
	listSpec.BO = []StateAction{
		// JSON: create empty list (or ListRef if enabled)
		func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.ListRef {
				r.Node = ListRef{
					Val:  make([]any, 0),
					Meta: make(map[string]any),
				}
			} else {
				r.Node = make([]any, 0)
			}
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
					prevNode := r.Prev.Node
					if IsUndefined(prevNode) {
						prevNode = nil
					}
					r.Node = nodeListAppend(r.Node, prevNode)
					r.Prev.Node = r.Node
				}
			}
		},
	}

	// BC callbacks:
	listSpec.BC = []StateAction{
		// Set Implicit and Child on ListRef if option is enabled.
		func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.ListRef {
				implicit := !(r.O0 != NoToken && r.O0.Tin == TinOS)
				if lr, ok := r.Node.(ListRef); ok {
					lr.Implicit = implicit
					if c, ok := r.U["child$"]; ok {
						lr.Child = c
					}
					r.Node = lr
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
		}, P: "elem", G: "jsonic"},
		// JSON: Empty list: []
		{S: [][]Tin{{TinOS}, {TinCS}}, B: 1, G: "json"},
		// JSON: Start elements: [elem
		{S: [][]Tin{{TinOS}}, P: "elem", G: "json"},
		// Jsonic: Initial comma [, will insert null
		{S: [][]Tin{{TinCA}}, P: "elem", B: 1, G: "jsonic"},
		// Jsonic: Another element (no token match needed)
		{P: "elem", G: "jsonic"},
	}

	// list.Close ordering (JSON + Jsonic append):
	// [0] CS end of list (JSON)
	// [1] ZZ auto-close (Jsonic, appended)
	listSpec.Close = []*AltSpec{
		// JSON: End of list
		{S: [][]Tin{{TinCS}}, G: "json"},
		// Jsonic: Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish, G: "jsonic"},
	}

	// ====== PAIR rule ======
	pairSpec := &RuleSpec{Name: "pair"}

	// BC callbacks (JSON then Jsonic):
	pairSpec.BC = []StateAction{
		// JSON phase: set key=value
		func(r *Rule, ctx *Context) {
			if _, ok := r.U["pair"]; ok {
				key, _ := r.U["key"].(string)
				// safe.key: block __proto__ and constructor keys on arrays only.
				if cfg.SafeKey && r.U["list"] == true && (key == "__proto__" || key == "constructor") {
					return
				}
				r.U["prev"] = nodeMapGetVal(r.Node, r.U["key"])
				nodeMapSet(r.Node, key, r.Child.Node)
			}
		},
		// Jsonic phase: pairval with merge support
		func(r *Rule, ctx *Context) {
			if _, ok := r.U["pair"]; ok {
				pairval(r, ctx)
			}
		},
		// Jsonic phase: map.child - bare colon :value stores as child$ key
		func(r *Rule, ctx *Context) {
			if childFlag, ok := r.U["child"]; !ok || childFlag != true {
				return
			}
			val := r.Child.Node
			if IsUndefined(val) {
				val = nil
			}
			prev, hasPrev := nodeMapGet(r.Node, "child$")
			if !hasPrev {
				nodeMapSet(r.Node, "child$", val)
			} else if cfg.MapMerge != nil {
				nodeMapSet(r.Node, "child$", cfg.MapMerge(prev, val, r, ctx))
			} else if cfg.MapExtend {
				nodeMapSet(r.Node, "child$", Deep(prev, val))
			} else {
				nodeMapSet(r.Node, "child$", val)
			}
		},
	}

	// pair.Open ordering (JSON + Jsonic append):
	// [0] KEY CL pair (JSON)
	// [1] CA ignore comma (Jsonic, appended)
	// [2] CL child value (Jsonic, optional - only when map.child enabled)
	pairOpen := []*AltSpec{
		// JSON: key:value pair
		{S: [][]Tin{KEY, {TinCL}}, P: "val", U: map[string]any{"pair": true}, A: pairkey, G: "json"},
		// Jsonic: Ignore initial comma: {,a:1
		{S: [][]Tin{{TinCA}}, G: "jsonic"},
	}
	// Jsonic: map.child - bare colon :value stores as child$ key
	if cfg.MapChild {
		pairOpen = append(pairOpen, &AltSpec{
			S: [][]Tin{{TinCL}}, P: "val",
			U: map[string]any{"done": true, "child": true},
		})
	}
	pairSpec.Open = pairOpen

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
		{S: [][]Tin{{TinCB}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, B: 1, G: "jsonic"},
		// Jsonic: Ignore trailing comma at end of map
		{S: [][]Tin{{TinCA}, {TinCB}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, B: 1, G: "jsonic"},
		// Jsonic: Comma then EOF
		{S: [][]Tin{{TinCA}, {TinZZ}}, G: "jsonic"},
		// Jsonic: Comma means new pair at same level (with pk check)
		{S: [][]Tin{{TinCA}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("pk", 0) }, R: "pair", G: "jsonic"},
		// Jsonic: Comma means new pair if implicit top level map
		{S: [][]Tin{{TinCA}}, C: func(r *Rule, ctx *Context) bool { return r.Lte("dmap", 1) }, R: "pair", G: "jsonic"},
		// Jsonic: Value means new pair (space-separated) if implicit top level map
		{S: [][]Tin{KEY}, C: func(r *Rule, ctx *Context) bool { return r.Lte("dmap", 1) }, R: "pair", B: 1, G: "jsonic"},
		// Jsonic: End of implicit path, keep closing until pk=0
		{S: [][]Tin{merge([]Tin{TinCB, TinCA, TinCS}, KEY)},
			C: func(r *Rule, ctx *Context) bool { _, ok := r.N["pk"]; return ok && r.N["pk"] > 0 },
			B: 1, G: "jsonic"},
		// Jsonic: Can't close map with ]
		{S: [][]Tin{{TinCS}}, E: func(r *Rule, ctx *Context) *Token { return r.C0 }, G: "jsonic"},
		// Jsonic: Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish, G: "jsonic"},
		// Jsonic: Who needs commas anyway? (implicit continuation)
		{R: "pair", B: 1, G: "jsonic"},
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
				if _, ok := nodeListVal(r.Node); ok {
					r.Node = nodeListAppend(r.Node, r.Child.Node)
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
			if pair, ok := r.U["pair"]; !ok || pair != true {
				return
			}
			if cfg.ListPair {
				// list.pair: push pair as {key: val} object element
				key := r.U["key"].(string)
				val := r.Child.Node
				if IsUndefined(val) {
					val = nil
				}
				pairObj := map[string]any{key: val}
				if _, ok := nodeListVal(r.Node); ok {
					r.Node = nodeListAppend(r.Node, pairObj)
					if r.Parent != NoRule && r.Parent != nil {
						r.Parent.Node = r.Node
					}
				}
			} else {
				r.U["prev"] = nodeMapGetVal(r.Node, r.U["key"])
				pairval(r, ctx)
			}
		},
		// Jsonic: handle child value in list (bare colon :value)
		func(r *Rule, ctx *Context) {
			_ = ctx
			if childFlag, ok := r.U["child"]; !ok || childFlag != true {
				return
			}
			val := r.Child.Node
			if IsUndefined(val) {
				val = nil
			}
			// Store child value on parent list rule's U map.
			// The list BC callback transfers it to ListRef.Child.
			if r.Parent != NoRule && r.Parent != nil {
				prev, hasPrev := r.Parent.U["child$"]
				if !hasPrev {
					r.Parent.U["child$"] = val
				} else if cfg.MapExtend {
					r.Parent.U["child$"] = Deep(prev, val)
				} else {
					r.Parent.U["child$"] = val
				}
			}
		},
	}

	// elem.Open ordering (Jsonic unshifted + JSON):
	// [0] CA CA double comma null (Jsonic, unshifted)
	// [1] CA single comma null (Jsonic, unshifted)
	// [2] KEY CL pair in list (Jsonic, unshifted)
	// [3] CL child value (Jsonic, optional - only when list.child enabled)
	// [4] p:val (JSON, original)
	elemOpen := []*AltSpec{
		// Jsonic: Empty commas insert null (CA CA)
		{S: [][]Tin{{TinCA}, {TinCA}}, B: 2,
			U: map[string]any{"done": true},
			A: func(r *Rule, ctx *Context) {
				_ = ctx
				if _, ok := nodeListVal(r.Node); ok {
					r.Node = nodeListAppend(r.Node, nil)
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
				if _, ok := nodeListVal(r.Node); ok {
					r.Node = nodeListAppend(r.Node, nil)
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
			A: pairkey,
			E: func(r *Rule, ctx *Context) *Token {
				if cfg.ListProperty || cfg.ListPair {
					return nil // allowed
				}
				return ctx.T0 // error: pair in list not allowed
			}},
	}
	// Jsonic: list.child - bare colon `:value` stores child value
	if cfg.ListChild {
		elemOpen = append(elemOpen, &AltSpec{
			S: [][]Tin{{TinCL}}, P: "val",
			U: map[string]any{"done": true, "child": true, "list": true},
		})
	}
	// JSON: Element is a value (fallback - must be last)
	elemOpen = append(elemOpen, &AltSpec{P: "val"})
	elemSpec.Open = elemOpen

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
		{S: [][]Tin{{TinCA}, {TinCS, TinZZ}}, B: 1, G: "jsonic"},
		// Jsonic: Next element
		{S: [][]Tin{{TinCA}}, R: "elem", G: "jsonic"},
		// Jsonic: End of list
		{S: [][]Tin{{TinCS}}, B: 1, G: "jsonic"},
		// Jsonic: Auto-close at EOF
		{S: [][]Tin{{TinZZ}}, E: finish, G: "jsonic"},
		// Jsonic: Can't close list with }
		{S: [][]Tin{{TinCB}}, E: func(r *Rule, ctx *Context) *Token { return r.C0 }, G: "jsonic"},
		// Jsonic: Who needs commas anyway? (implicit element)
		{R: "elem", B: 1, G: "jsonic"},
	}

	rsm["val"] = valSpec
	rsm["map"] = mapSpec
	rsm["list"] = listSpec
	rsm["pair"] = pairSpec
	rsm["elem"] = elemSpec
}

// nodeListAppend appends a value to a list node (plain []any or ListRef).
// Returns the updated node (must be reassigned since slices may reallocate).
func nodeListAppend(node any, val any) any {
	if lr, ok := node.(ListRef); ok {
		lr.Val = append(lr.Val, val)
		return lr
	}
	if arr, ok := node.([]any); ok {
		return append(arr, val)
	}
	return node
}

// nodeListVal extracts the []any from a list node (plain []any or ListRef).
func nodeListVal(node any) ([]any, bool) {
	if lr, ok := node.(ListRef); ok {
		return lr.Val, true
	}
	if arr, ok := node.([]any); ok {
		return arr, true
	}
	return nil, false
}

// nodeListSetVal updates the []any inside a list node, returning the updated node.
func nodeListSetVal(node any, arr []any) any {
	if lr, ok := node.(ListRef); ok {
		lr.Val = arr
		return lr
	}
	return arr
}

// nodeMapSet sets a key on a map node.
func nodeMapSet(node any, key any, val any) {
	k, _ := key.(string)
	if m, ok := node.(map[string]any); ok {
		m[k] = val
	} else if mr, ok := node.(MapRef); ok {
		mr.Val[k] = val
	}
}

// nodeMapGet gets a value from a map node.
func nodeMapGet(node any, key any) (any, bool) {
	k, _ := key.(string)
	if m, ok := node.(map[string]any); ok {
		v, exists := m[k]
		return v, exists
	}
	if mr, ok := node.(MapRef); ok {
		v, exists := mr.Val[k]
		return v, exists
	}
	return nil, false
}

// nodeMapGetVal is a helper that returns the value or nil.
func nodeMapGetVal(node any, key any) any {
	v, _ := nodeMapGet(node, key)
	return v
}

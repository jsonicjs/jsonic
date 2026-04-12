package jsonic

// buildGrammar populates the default jsonic grammar rules using declarative GrammarAltSpec.
// This is a faithful port of grammar.ts, matching the exact alternate orderings
// produced by the JSON phase followed by the Jsonic extension phase.
func buildGrammar(rsm map[string]*RuleSpec, cfg *LexConfig) {
	// Named function references for the grammar.
	// These closures capture cfg for runtime configuration access.
	ref := map[FuncRef]any{
		"@finish": AltError(func(r *Rule, ctx *Context) *Token {
			if !cfg.FinishRule {
				return ctx.T0
			}
			return nil
		}),

		"@pairkey": AltAction(func(r *Rule, ctx *Context) {
			_ = ctx
			keyToken := r.O0
			var key string
			if keyToken.Tin == TinST || keyToken.Tin == TinTX {
				key, _ = keyToken.Val.(string)
			} else {
				key = keyToken.Src
			}
			r.U["key"] = key
		}),

		"@pairval": AltAction(func(r *Rule, ctx *Context) {
			key, _ := r.U["key"].(string)
			val := r.Child.Node
			if IsUndefined(val) {
				val = nil
			}
			if cfg.SafeKey && r.U["list"] == true {
				if key == "__proto__" || key == "constructor" {
					return
				}
			}
			prev := r.U["prev"]
			if prev == nil {
				nodeMapSet(r.Node, key, val)
			} else if cfg.MapMerge != nil {
				nodeMapSet(r.Node, key, cfg.MapMerge(prev, val, r, ctx))
			} else if cfg.MapExtend {
				nodeMapSet(r.Node, key, Deep(prev, val))
			} else {
				nodeMapSet(r.Node, key, val)
			}
		}),

		// val rule state actions
		"@val-bo": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			r.Node = Undefined
		}),

		"@val-bc": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if IsUndefined(r.Node) {
				if IsUndefined(r.Child.Node) {
					if r.OS == 0 {
						r.Node = Undefined
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
		}),

		// map rule state actions
		"@map-bo": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.MapRef {
				r.Node = MapRef{
					Val:  make(map[string]any),
					Meta: make(map[string]any),
				}
			} else {
				r.Node = make(map[string]any)
			}
		}),

		"@map-bo-jsonic": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if v, ok := r.N["dmap"]; ok {
				r.N["dmap"] = v + 1
			} else {
				r.N["dmap"] = 1
			}
		}),

		"@map-bc": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.MapRef {
				implicit := !(r.O0 != NoToken && r.O0.Tin == TinOB)
				if mr, ok := r.Node.(MapRef); ok {
					mr.Implicit = implicit
					r.Node = mr
				}
			}
		}),

		// list rule state actions
		"@list-bo": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if cfg.ListRef {
				r.Node = ListRef{
					Val:  make([]any, 0),
					Meta: make(map[string]any),
				}
			} else {
				r.Node = make([]any, 0)
			}
		}),

		"@list-bo-jsonic": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if v, ok := r.N["dlist"]; ok {
				r.N["dlist"] = v + 1
			} else {
				r.N["dlist"] = 1
			}
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
		}),

		"@list-bc": StateAction(func(r *Rule, ctx *Context) {
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
		}),

		// pair rule state actions
		"@pair-bc-json": StateAction(func(r *Rule, ctx *Context) {
			if _, ok := r.U["pair"]; ok {
				key, _ := r.U["key"].(string)
				if cfg.SafeKey && r.U["list"] == true && (key == "__proto__" || key == "constructor") {
					return
				}
				r.U["prev"] = nodeMapGetVal(r.Node, r.U["key"])
				nodeMapSet(r.Node, key, r.Child.Node)
			}
		}),

		"@pair-bc-jsonic": StateAction(func(r *Rule, ctx *Context) {
			if _, ok := r.U["pair"]; ok {
				key, _ := r.U["key"].(string)
				val := r.Child.Node
				if IsUndefined(val) {
					val = nil
				}
				if cfg.SafeKey && r.U["list"] == true {
					if key == "__proto__" || key == "constructor" {
						return
					}
				}
				prev := r.U["prev"]
				if prev == nil {
					nodeMapSet(r.Node, key, val)
				} else if cfg.MapMerge != nil {
					nodeMapSet(r.Node, key, cfg.MapMerge(prev, val, r, ctx))
				} else if cfg.MapExtend {
					nodeMapSet(r.Node, key, Deep(prev, val))
				} else {
					nodeMapSet(r.Node, key, val)
				}
			}
		}),

		"@pair-bc-child": StateAction(func(r *Rule, ctx *Context) {
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
		}),

		// elem rule state actions
		"@elem-bc-json": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			done, _ := r.U["done"].(bool)
			if !done && !IsUndefined(r.Child.Node) {
				if _, ok := nodeListVal(r.Node); ok {
					r.Node = nodeListAppend(r.Node, r.Child.Node)
					if r.Parent != NoRule && r.Parent != nil {
						r.Parent.Node = r.Node
					}
				}
			}
		}),

		"@elem-bc-pair": StateAction(func(r *Rule, ctx *Context) {
			if pair, ok := r.U["pair"]; !ok || pair != true {
				return
			}
			if cfg.ListPair {
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
				key, _ := r.U["key"].(string)
				val := r.Child.Node
				if IsUndefined(val) {
					val = nil
				}
				if cfg.SafeKey && r.U["list"] == true {
					if key == "__proto__" || key == "constructor" {
						return
					}
				}
				prev := r.U["prev"]
				if prev == nil {
					nodeMapSet(r.Node, key, val)
				} else if cfg.MapMerge != nil {
					nodeMapSet(r.Node, key, cfg.MapMerge(prev, val, r, ctx))
				} else if cfg.MapExtend {
					nodeMapSet(r.Node, key, Deep(prev, val))
				} else {
					nodeMapSet(r.Node, key, val)
				}
			}
		}),

		"@elem-bc-child": StateAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if childFlag, ok := r.U["child"]; !ok || childFlag != true {
				return
			}
			val := r.Child.Node
			if IsUndefined(val) {
				val = nil
			}
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
		}),

		// Inline actions used in alts
		"@val-close-err": AltError(func(r *Rule, ctx *Context) *Token {
			if r.D == 0 {
				return ctx.T0
			}
			return nil
		}),

		"@implist-cond": AltCond(func(r *Rule, ctx *Context) bool {
			return r.Prev != NoRule && r.Prev != nil && r.Prev.U["implist"] == true
		}),

		"@elem-double-comma": AltAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if _, ok := nodeListVal(r.Node); ok {
				r.Node = nodeListAppend(r.Node, nil)
				if r.Parent != NoRule && r.Parent != nil {
					r.Parent.Node = r.Node
				}
			}
		}),

		"@elem-single-comma": AltAction(func(r *Rule, ctx *Context) {
			_ = ctx
			if _, ok := nodeListVal(r.Node); ok {
				r.Node = nodeListAppend(r.Node, nil)
				if r.Parent != NoRule && r.Parent != nil {
					r.Parent.Node = r.Node
				}
			}
		}),

		"@elem-pair-err": AltError(func(r *Rule, ctx *Context) *Token {
			if cfg.ListProperty || cfg.ListPair {
				return nil
			}
			return ctx.T0
		}),

		"@elem-close-err": AltError(func(r *Rule, ctx *Context) *Token {
			return r.C0
		}),
	}

	// Helper to resolve a GrammarAltSpec slice to []*AltSpec.
	resolve := func(gas []*GrammarAltSpec) []*AltSpec {
		alts := make([]*AltSpec, len(gas))
		for i, ga := range gas {
			alts[i] = resolveGrammarAltStatic(ga, ref)
		}
		return alts
	}

	// ====== VAL rule ======
	valSpec := &RuleSpec{Name: "val"}

	valSpec.BO = []StateAction{ref["@val-bo"].(StateAction)}
	valSpec.BC = []StateAction{ref["@val-bc"].(StateAction)}

	valOpen := resolve([]*GrammarAltSpec{
		{S: "#OB", P: "map", B: 1, G: "json"},
		{S: "#OS", P: "list", B: 1, G: "json"},
		{S: "#KEY #CL", C: map[string]any{"d": 0}, P: "map", B: 2, G: "jsonic"},
		{S: "#KEY #CL", P: "map", B: 2, N: map[string]int{"pk": 1}, G: "jsonic"},
		{S: "#VAL", G: "jsonic"},
	})
	// CB|CS in single slot:
	valOpen = append(valOpen, resolveGrammarAltStatic(
		&GrammarAltSpec{S: []string{"#CB #CS"}, C: map[string]any{"d": CGt(0)}, B: 1, G: "jsonic"}, ref))
	valOpen = append(valOpen, resolve([]*GrammarAltSpec{
		{S: "#CA", C: map[string]any{"d": 0}, P: "list", B: 1, G: "jsonic"},
		{S: "#CA", B: 1, G: "jsonic"},
		{S: "#ZZ", G: "jsonic"},
	})...)
	valSpec.Open = valOpen

	valClose := resolve([]*GrammarAltSpec{
		{S: "#ZZ", G: "json"},
	})
	// CB|CS in single slot:
	valClose = append(valClose, resolveGrammarAltStatic(
		&GrammarAltSpec{S: []string{"#CB #CS"}, B: 1, E: "@val-close-err", G: "jsonic"}, ref))
	valClose = append(valClose, resolve([]*GrammarAltSpec{
		{S: "#CA", C: map[string]any{"n.dlist": CLte(0), "n.dmap": CLte(0)},
			R: "list", U: map[string]any{"implist": true}, G: "jsonic"},
		{C: map[string]any{"n.dlist": CLte(0), "n.dmap": CLte(0)},
			R: "list", U: map[string]any{"implist": true}, B: 1, G: "jsonic"},
		{S: "#ZZ", G: "jsonic"},
		{B: 1, G: "json"},
	})...)
	valSpec.Close = valClose

	// ====== MAP rule ======
	mapSpec := &RuleSpec{Name: "map"}

	mapSpec.BO = []StateAction{
		ref["@map-bo"].(StateAction),
		ref["@map-bo-jsonic"].(StateAction),
	}
	mapSpec.BC = []StateAction{ref["@map-bc"].(StateAction)}

	mapSpec.Open = resolve([]*GrammarAltSpec{
		{S: "#OB #ZZ", B: 1, E: "@finish", G: "jsonic"},
		{S: "#OB #CB", B: 1, N: map[string]int{"pk": 0}, G: "json"},
		{S: "#OB", P: "pair", N: map[string]int{"pk": 0}, G: "json"},
		{S: "#KEY #CL", P: "pair", B: 2, G: "jsonic"},
	})

	// For map.Close, we need to merge token sets for the third alt.
	// "#CA #CS" + VAL tokens in a single slot → need raw AltSpec for that one.
	mapClose := resolve([]*GrammarAltSpec{
		{S: "#CB", C: map[string]any{"n.pk": CLte(0)}, G: "jsonic"},
		{S: "#CB", B: 1, G: "jsonic"},
		// slot 0 = merge(CA, CS, VAL) — handled below
	})
	// Third alt: CA|CS|VAL tokens in single slot
	mapClose = append(mapClose, resolveGrammarAltStatic(
		&GrammarAltSpec{S: []string{"#CA #CS #VAL"}, B: 1, G: "jsonic"}, ref))
	mapClose = append(mapClose, resolveGrammarAltStatic(
		&GrammarAltSpec{S: "#ZZ", E: "@finish", G: "jsonic"}, ref))
	mapSpec.Close = mapClose

	// ====== LIST rule ======
	listSpec := &RuleSpec{Name: "list"}

	listSpec.BO = []StateAction{
		ref["@list-bo"].(StateAction),
		ref["@list-bo-jsonic"].(StateAction),
	}
	listSpec.BC = []StateAction{ref["@list-bc"].(StateAction)}

	// First alt uses a condition function directly (not declarative).
	listOpen := []*AltSpec{
		resolveGrammarAltStatic(&GrammarAltSpec{C: "@implist-cond", P: "elem", G: "jsonic"}, ref),
	}
	listOpen = append(listOpen, resolve([]*GrammarAltSpec{
		{S: "#OS #CS", B: 1, G: "json"},
		{S: "#OS", P: "elem", G: "json"},
		{S: "#CA", P: "elem", B: 1, G: "jsonic"},
		{P: "elem", G: "jsonic"},
	})...)
	listSpec.Open = listOpen

	listSpec.Close = resolve([]*GrammarAltSpec{
		{S: "#CS", G: "json"},
		{S: "#ZZ", E: "@finish", G: "jsonic"},
	})

	// ====== PAIR rule ======
	pairSpec := &RuleSpec{Name: "pair"}

	pairSpec.BC = []StateAction{
		ref["@pair-bc-json"].(StateAction),
		ref["@pair-bc-jsonic"].(StateAction),
		ref["@pair-bc-child"].(StateAction),
	}

	pairOpen := resolve([]*GrammarAltSpec{
		{S: "#KEY #CL", P: "val", U: map[string]any{"pair": true}, A: "@pairkey", G: "json"},
		{S: "#CA", G: "jsonic"},
	})
	if cfg.MapChild {
		pairOpen = append(pairOpen, resolveGrammarAltStatic(
			&GrammarAltSpec{S: "#CL", P: "val",
				U: map[string]any{"done": true, "child": true}}, ref))
	}
	pairSpec.Open = pairOpen

	pairSpec.Close = resolve([]*GrammarAltSpec{
		{S: "#CB", C: map[string]any{"n.pk": CLte(0)}, B: 1, G: "jsonic"},
		{S: "#CA #CB", C: map[string]any{"n.pk": CLte(0)}, B: 1, G: "jsonic"},
		{S: "#CA #ZZ", G: "jsonic"},
		{S: "#CA", C: map[string]any{"n.pk": CLte(0)}, R: "pair", G: "jsonic"},
		{S: "#CA", C: map[string]any{"n.dmap": CLte(1)}, R: "pair", G: "jsonic"},
		{S: "#KEY", C: map[string]any{"n.dmap": CLte(1)}, R: "pair", B: 1, G: "jsonic"},
	})

	// CB|CA|CS|KEY in single slot
	pairSpec.Close = append(pairSpec.Close, resolveGrammarAltStatic(
		&GrammarAltSpec{S: []string{"#CB #CA #CS #KEY"}, C: map[string]any{"n.pk": CGte(0)},
			B: 1, G: "jsonic"}, ref))
	// Remaining pair close alts.
	pairSpec.Close = append(pairSpec.Close, resolve([]*GrammarAltSpec{
		{S: "#CS", E: "@elem-close-err", G: "jsonic"},
		{S: "#ZZ", E: "@finish", G: "jsonic"},
		{R: "pair", B: 1, G: "jsonic"},
	})...)

	// ====== ELEM rule ======
	elemSpec := &RuleSpec{Name: "elem"}

	elemSpec.BC = []StateAction{
		ref["@elem-bc-json"].(StateAction),
		ref["@elem-bc-pair"].(StateAction),
		ref["@elem-bc-child"].(StateAction),
	}

	elemOpen := resolve([]*GrammarAltSpec{
		{S: "#CA #CA", B: 2, U: map[string]any{"done": true}, A: "@elem-double-comma"},
		{S: "#CA", U: map[string]any{"done": true}, A: "@elem-single-comma"},
		{S: "#KEY #CL", P: "val",
			N: map[string]int{"pk": 1, "dmap": 1},
			U: map[string]any{"done": true, "pair": true, "list": true},
			A: "@pairkey", E: "@elem-pair-err"},
	})
	if cfg.ListChild {
		elemOpen = append(elemOpen, resolveGrammarAltStatic(
			&GrammarAltSpec{S: "#CL", P: "val",
				U: map[string]any{"done": true, "child": true, "list": true}}, ref))
	}
	elemOpen = append(elemOpen, resolveGrammarAltStatic(
		&GrammarAltSpec{P: "val"}, ref))
	elemSpec.Open = elemOpen

	elemClose := []*AltSpec{
		// CA in slot 0, CS|ZZ in slot 1:
		resolveGrammarAltStatic(&GrammarAltSpec{S: []string{"#CA", "#CS #ZZ"}, B: 1, G: "jsonic"}, ref),
	}
	elemClose = append(elemClose, resolve([]*GrammarAltSpec{
		{S: "#CA", R: "elem", G: "jsonic"},
		{S: "#CS", B: 1, G: "jsonic"},
		{S: "#ZZ", E: "@finish", G: "jsonic"},
		{S: "#CB", E: "@elem-close-err", G: "jsonic"},
		{R: "elem", B: 1, G: "jsonic"},
	})...)
	elemSpec.Close = elemClose

	rsm["val"] = valSpec
	rsm["map"] = mapSpec
	rsm["list"] = listSpec
	rsm["pair"] = pairSpec
	rsm["elem"] = elemSpec
}

// nodeListAppend appends a value to a list node (plain []any or ListRef).
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

// nodeListVal extracts the []any from a list node.
func nodeListVal(node any) ([]any, bool) {
	if lr, ok := node.(ListRef); ok {
		return lr.Val, true
	}
	if arr, ok := node.([]any); ok {
		return arr, true
	}
	return nil, false
}

// nodeListSetVal updates the []any inside a list node.
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

// nodeMapGetVal returns the value or nil.
func nodeMapGetVal(node any, key any) any {
	v, _ := nodeMapGet(node, key)
	return v
}

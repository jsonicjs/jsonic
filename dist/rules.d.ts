import type { RuleState, RuleStep, StateAction, Tin, Token, Config, Context, Rule, RuleSpec, ListMods, AltSpec, Lex } from './types';
declare class RuleImpl implements Rule {
    i: number;
    name: string;
    node: null;
    state: RuleState;
    n: any;
    d: number;
    u: any;
    k: any;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    os: number;
    cs: number;
    spec: RuleSpec;
    child: Rule;
    parent: Rule;
    prev: Rule;
    o0: Token;
    o1: Token;
    c0: Token;
    c1: Token;
    need: number;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context, lex: Lex): Rule;
    eq(counter: string, limit?: number): boolean;
    lt(counter: string, limit?: number): boolean;
    gt(counter: string, limit?: number): boolean;
    lte(counter: string, limit?: number): boolean;
    gte(counter: string, limit?: number): boolean;
    toString(): string;
}
declare const makeRule: (spec: RuleSpec, ctx: Context, node?: any) => RuleImpl;
declare const makeNoRule: (ctx: Context) => RuleImpl;
declare class RuleSpecImpl implements RuleSpec {
    name: string;
    def: {
        open: AltSpec[];
        close: AltSpec[];
        bo: StateAction[];
        bc: StateAction[];
        ao: StateAction[];
        ac: StateAction[];
        tcol: number[][][];
    };
    cfg: Config;
    constructor(cfg: Config, def: any);
    tin<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R): T;
    add(state: RuleState, a: AltSpec | AltSpec[], mods?: ListMods): RuleSpec;
    open(a: AltSpec | AltSpec[], mods?: ListMods): RuleSpec;
    close(a: AltSpec | AltSpec[], mods?: ListMods): RuleSpec;
    action(append: boolean, step: RuleStep, state: RuleState, action: StateAction): RuleSpec;
    bo(append: StateAction | boolean, action?: StateAction): RuleSpec;
    ao(append: StateAction | boolean, action?: StateAction): RuleSpec;
    bc(first: StateAction | boolean, second?: StateAction): RuleSpec;
    ac(first: StateAction | boolean, second?: StateAction): RuleSpec;
    clear(): this;
    norm(): this;
    process(rule: Rule, ctx: Context, lex: Lex, state: RuleState): Rule;
    bad(tkn: Token, rule: Rule, ctx: Context, parse: {
        is_open: boolean;
    }): Rule;
    unknownRule(tkn: Token, name: string): Token;
}
declare const makeRuleSpec: (cfg: Config, def: any) => RuleSpecImpl;
export { makeRule, makeNoRule, makeRuleSpec };

/* Copyright (c) 2021-2022 Richard Rodger, MIT License */

/*  types.ts
 *  Type and constant definitions.
 */

export const OPEN: RuleState = 'o'
export const CLOSE: RuleState = 'c'
export const BEFORE: RuleStep = 'b'
export const AFTER: RuleStep = 'a'
export const EMPTY = ''
export const INSPECT = Symbol.for('nodejs.util.inspect.custom')

// Empty rule used as a no-value placeholder.
// export const NONE = ({ name: 'none', state: OPEN } as Rule)

export const STRING = 'string'

// The main top-level utility function.
export type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any

// The core API is exposed as methods on the main utility function.
export interface JsonicAPI {
  // Explicit parse method.
  parse: JsonicParse

  // Get and set partial option trees.
  options: Options & ((change_options?: Bag) => Bag)

  // Get the current configuration (derived from options).
  config: () => Config

  // Create a new Jsonic instance to customize.
  make: (options?: Options | string) => Jsonic

  // Use a plugin
  use: (plugin: Plugin, plugin_options?: Bag) => Jsonic

  // Get and set parser rules.
  rule: (
    name?: string,
    define?: RuleDefiner | null,
  ) => Jsonic | RuleSpec | RuleSpecMap

  // Provide new lex matcher.
  // lex: (matchmaker: MakeLexMatcher) => void

  empty: (options?: Options) => Jsonic

  // Token get and set for plugins. Reference by either name or Tin.
  // NOTE: creates token if not yet defined (but only for name).
  token: TokenMap &
    TinMap &
    (<A extends string | Tin>(ref: A) => A extends string ? Tin : string)

  // TokenSet get and set for plugins. Reference by either name or Tin.
  // NOTE: name->Tin[], but Tin->name (of containing set)
  tokenSet: TokenSetMap &
    TinSetMap &
    (<A extends string | Tin>(ref: A) => A extends string ? Tin[] : string)

  // Fixed token src get and set for plugins. Reference by either src or Tin.
  fixed: TokenMap &
    TinMap &
    (<A extends string | Tin>(
      ref: A,
    ) => undefined | (A extends string ? Tin : string))

  // Unique identifier string for each Jsonic instance.
  id: string

  // Provide identifier for string conversion.
  toString: () => string

  // Subscribe to lexing and parsing events.
  sub: (spec: { lex?: LexSub; rule?: RuleSub }) => Jsonic

  util: Bag
}

// The full library type.
export type Jsonic = JsonicParse & // A function that parses.
  JsonicAPI & { [prop: string]: any } // A utility with API methods. // Extensible by plugin decoration.

// Define a plugin to extend the provided Jsonic instance.
export type Plugin = ((
  jsonic: Jsonic,
  plugin_options?: any,
) => void | Jsonic) & {
  defaults?: Bag
  options?: Bag // TODO: InstalledPlugin.options is always defined ?
}

// Parsing options. See defaults.ts for commentary.
export type Options = {
  safe?: {
    key: boolean
  }
  tag?: string
  fixed?: {
    lex?: boolean
    token?: StrMap
    check?: LexCheck
  }
  match?: {
    lex?: boolean
    token?: { [name: string]: RegExp | LexMatcher }
    value?: {
      [name: string]: {
        match: RegExp | LexMatcher
        val?: any
      }
    }
    check?: LexCheck
  }
  tokenSet?: {
    [name: string]: string[]
  }
  space?: {
    lex?: boolean
    chars?: string
    check?: LexCheck
  }
  line?: {
    lex?: boolean
    chars?: string
    rowChars?: string
    single?: boolean
    check?: LexCheck
  }
  text?: {
    lex?: boolean
    modify?: ValModifier | ValModifier[]
    check?: LexCheck
  }
  number?: {
    lex?: boolean
    hex?: boolean
    oct?: boolean
    bin?: boolean
    sep?: string | null
    exclude?: RegExp
    check?: LexCheck
  }
  comment?: {
    lex?: boolean
    def?: {
      [name: string]:
        | {
            line?: boolean
            start?: string
            end?: string
            lex?: boolean
            suffix?: string | string[] | LexMatcher
            eatline: boolean
          }
        | null
        | undefined
        | false
    }
    check?: LexCheck
  }
  string?: {
    lex?: boolean
    chars?: string
    multiChars?: string
    escapeChar?: string
    escape?: {
      [char: string]: string | null
    }
    allowUnknown?: boolean
    replace?: { [char: string]: string | null }
    abandon?: boolean
    check?: LexCheck
  }
  map?: {
    extend?: boolean
    merge?: (prev: any, curr: any) => any
  }
  list?: {
    property: boolean
  }
  value?: {
    lex?: boolean
    def?: {
      [src: string]:
        | undefined
        | null
        | false
        | {
            val: any

            // RegExp values will always have lower priority than pure tokens
            // as they are matched by the TextMatcher. For higher priority
            // use the `match` option.
            match?: RegExp
            consume?: boolean
          }
    }
  }
  ender?: string | string[]
  plugin?: Bag
  debug?: {
    get_console?: () => any
    maxlen?: number
    print?: {
      config?: boolean
      src?: (x: any) => string
    }
  }
  error?: { [code: string]: string }
  hint?: any
  lex?: {
    empty?: boolean
    emptyResult?: any
    match: {
      [name: string]: {
        order: number
        make: MakeLexMatcher
      }
    }
  }
  parse?: {
    prepare?: { [name: string]: ParsePrepare }
  }
  rule?: {
    start?: string
    finish?: boolean
    maxmul?: number
    include?: string
    exclude?: string
  }
  result?: {
    fail: any[]
  }
  config?: {
    modify?: {
      [plugin_name: string]: (config: Config, options: Options) => void
    }
  }
  parser?: {
    start?: (
      lexer: any,
      src: string,
      jsonic: any,
      meta?: any,
      parent_ctx?: any,
    ) => any
  }
  standard$?: boolean
  defaults$?: boolean
  grammar$?: boolean
}

// Parsing rule specification. The rule OPEN and CLOSE state token
// match alternates, and the associated actions, can be defined with a
// chainable API.
export interface RuleSpec {
  name: string
  def: {
    open: AltSpec[]
    close: AltSpec[]
    bo: StateAction[]
    bc: StateAction[]
    ao: StateAction[]
    ac: StateAction[]
    tcol: Tin[][][]
  }

  tin<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R): T

  add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec
  open(a: AltSpec | AltSpecish[], flags?: any): RuleSpec
  close(a: AltSpec | AltSpecish[], flags?: any): RuleSpec
  action(
    prepend: boolean,
    step: RuleStep,
    state: RuleState,
    action: StateAction,
  ): RuleSpec
  bo(first: StateAction | boolean, second?: StateAction): RuleSpec
  ao(first: StateAction | boolean, second?: StateAction): RuleSpec
  bc(first: StateAction | boolean, second?: StateAction): RuleSpec
  ac(first: StateAction | boolean, second?: StateAction): RuleSpec
  clear(): RuleSpec
  norm(): RuleSpec

  process(rule: Rule, ctx: Context, lex: Lex, state: RuleState): Rule

  bad(tkn: Token, rule: Rule, ctx: Context, parse: { is_open: boolean }): Rule
}

// Represents the application of a parsing rule. An instance is created
// for each attempt to match tokens based on the RuleSpec, and pushed
// onto the main parser rule stack. A Rule can be in two states:
// "open" when first placed on the stack, and "close" when it needs to be
// removed from the stack.
export interface Rule {
  i: number // Rule index (unique to parse).
  name: string // Rule name.
  spec: RuleSpec // RuleSpec for this rule.
  node: any // The parsed value, if any.
  state: RuleState // Open (`o`) or Close (`c`).
  child: Rule // The current child rule, created with the `p` command.
  parent: Rule // The parent rule, that pushed this rule onto the stack.
  prev: Rule // The previous sibling rule, that issued an `r` command.

  os: number // Number of open state tokens (# 'opens').
  o0: Token // First open state token.
  o1: Token // Second open state token.
  cs: number // Number of close state tokens (# 'closes').
  c0: Token // First close state token.
  c1: Token // Second close state token.

  n: Counters // Named counter values.
  d: number // The current stack depth.
  u: Bag // Custom key-value store, this rule only.
  k: Bag // Custom key-value store, propagates via push and replace (keep!).
  bo: boolean // Flag: call bo (before-open).
  ao: boolean // Flag: call ao (after-open).
  bc: boolean // Flag: call bc (before-close).
  ac: boolean // Flag: call ac (after-close).
  why?: string // Internal tracing.

  // Lex tokens needed
  need: number

  // Process the "open" or "close" state of the Rule, returning the
  // next rule to process.
  process(ctx: Context, lex: Lex): Rule

  // Always false if counter is null or undefined; default limit is 0.
  eq(counter: string, limit?: number): boolean
  lt(counter: string, limit?: number): boolean
  gt(counter: string, limit?: number): boolean
  lte(counter: string, limit?: number): boolean
  gte(counter: string, limit?: number): boolean
}

// The current parse state and associated context.
export type Context = {
  uI: number // Rule index.
  opts: Options // Jsonic instance options.
  cfg: Config // Jsonic instance config.
  meta: Bag // Parse meta parameters.
  src: () => string // source text to parse.
  root: () => any // Root node.
  plgn: () => Plugin[] // Jsonic instance plugins.
  inst: () => Jsonic // Current Jsonic instance.
  rule: Rule // Current rule instance.
  sub: {
    lex?: LexSub[]
    rule?: RuleSub[]
  }
  xs: Tin // Lex state tin.
  v2: Token // Previous previous token.
  v1: Token // Previous token.
  t0: Token // Current token.
  t1: Token // Next token.
  tC: number // Token count.
  kI: number // Parser rule iteration count.
  rs: Rule[] // Rule stack.
  rsI: number
  rsm: { [name: string]: RuleSpec } // RuleSpec lookup map (by rule name).
  // next: (r: Rule) => Token // Move to next token.
  log?: (...rest: any) => void // Log parse/lex step (if defined).
  F: (s: any) => string // Format arbitrary data as length-limited string.
  u: Bag // Custom meta data (for use by plugins)
  NOTOKEN: Token // Per parse "null" Token
  NORULE: Rule // Per parse "null" Rule
}

export interface Lex {
  src: String
  ctx: Context
  cfg: Config
  pnt: Point

  token(
    ref: Tin | string,
    val: any,
    src: string,
    pnt?: Point,
    use?: any,
    why?: string,
  ): Token

  next(rule: Rule, alt?: NormAltSpec, altI?: number, tI?: number): Token

  tokenize<R extends string | Tin, T extends R extends Tin ? string : Tin>(
    ref: R,
  ): T

  bad(why: string, pstart: number, pend: number): Token
}

export type NextToken = (rule: Rule) => Token

// Internal clean configuration built from options by
// `utility.configure` and LexMatchers.
export type Config = {
  safe: {
    key: boolean
  }
  lex: {
    match: LexMatcher[]
    empty: boolean
    emptyResult: any
  }

  parse: {
    prepare: ParsePrepare[]
  }

  rule: {
    start: string
    maxmul: number
    finish: boolean
    include: string[]
    exclude: string[]
  }

  // Fixed tokens (punctuation, operators, keywords, etc.)
  fixed: {
    lex: boolean
    token: TokenMap
    ref: Record<string | Tin, Tin | string>
    check?: LexCheck
  }

  // Matched tokens and values (regexp, custom function)
  match: {
    lex: boolean
    // Values have priority.
    value: {
      [name: string]: {
        // NOTE: RegExp must begin with `^`.
        match: RegExp | LexMatcher
        val?: any
      }
    }
    token: MatchMap
    check?: LexCheck
  }

  // Token set derived config.
  tokenSet: TokenSetMap
  // { [name: string]: number[] }

  // Token set derived config.
  tokenSetTins: {
    [name: string]: { [tin: number]: boolean }
  }

  // Space characters.
  space: {
    lex: boolean
    chars: Chars
    check?: LexCheck
  }

  // Line end characters.
  line: {
    lex: boolean
    chars: Chars
    rowChars: Chars // Row counting characters.
    single: boolean
    check?: LexCheck
  }

  // Unquoted text
  text: {
    lex: boolean
    modify: ValModifier[]
    check?: LexCheck
  }

  // Numbers
  number: {
    lex: boolean
    hex: boolean
    oct: boolean
    bin: boolean
    sep: boolean
    exclude?: RegExp
    sepChar?: string | null
    check?: LexCheck
  }

  // String quote characters.
  string: {
    lex: boolean
    quoteMap: Chars
    escMap: Bag
    escChar?: string
    escCharCode?: number
    multiChars: Chars
    allowUnknown: boolean
    replaceCodeMap: { [charCode: number]: string }
    hasReplace: boolean
    abandon: boolean
    check?: LexCheck
  }

  // Literal values
  value: {
    lex: boolean

    // Fixed values
    def: {
      [src: string]: {
        val: any
      }
    }

    // Regexp processed values
    defre: {
      [src: string]: {
        val: (res: any) => any
        match: RegExp
        consume: boolean
      }
    }
  }

  // Comment markers
  comment: {
    lex: boolean
    def: {
      [name: string]: {
        name: string
        line: boolean
        start: string
        end?: string
        lex: boolean
        eatline: boolean
      }
    }
    check?: LexCheck
  }

  map: {
    extend: boolean
    merge?: (prev: any, curr: any, rule: Rule, ctx: Context) => any
  }

  list: {
    property: boolean
  }

  debug: {
    get_console: () => any
    maxlen: number
    print: {
      config: boolean
      src?: (x: any) => string
    }
  }

  result: {
    fail: any[]
  }

  error: { [code: string]: string }
  hint: any

  rePart: any
  re: any

  tI: number // Token identifier index.
  t: any // Token index map.
}

// Current character position in source - the "point'.
export interface Point {
  len: number // Length of source (for convenience).
  sI: number // Source position (0-based).
  rI: number // Source row (1-based as editors do that).
  cI: number // Source column (1-based as editors do that).

  // A LexMatcher might match more than one token in sequence.
  // This array is first drained before matching is attempted again.
  token: Token[]

  // Once the end of the source is reached, generate a single "end"
  // token, and keep returning it as the next Token (see Lex.next).
  end?: Token
}

// Parser token (and where it was found).  Tokens are also the bearers
// of parser errors, as they capture the position of the error in the
// source.
export interface Token {
  isToken: boolean // Marks object as token.
  name: string // Token name.
  tin: Tin // Token identification number.
  val: any // Value of Token if literal (eg. number).
  src: string // Source text of Token.
  sI: number // Location of token index in source text (0-based).
  rI: number // Row location of token in source text (1-based).
  cI: number // Column location of token in source text (1-based).
  len: number // Length of Token source text.
  use?: Bag // Custom meta data from plugins goes here.
  err?: string // Error code.
  why?: string // Internal tracing.
  ignored?: Token

  // Convert into an error Token.
  bad(err: string, details?: any): Token

  resolveVal(rule: Rule, ctx: Context): any
}

// Specification for a parse-alternate within a Rule state.
// Represent a possible token match (2-token lookahead)
export interface AltSpec {
  // Token Tin sequence to match (0,1,2 Tins, or a subset of Tins; nulls filterd out).
  s?: (Tin | Tin[] | null | undefined)[] | null

  // Push named Rule onto stack (create child).
  p?: string | AltNext | null | false

  // Replace current rule with named Rule on stack (create sibling).
  r?: string | AltNext | null | false

  // Move token pointer back by indicated number of steps.
  b?: number | AltBack | null | false

  // Condition function, return true to match alternate.
  // NOTE: Token sequence (s) must also match.
  c?: AltCond
  // | {
  //   // Condition convenience definitions (all must pass).
  //   d?: number // - Match if rule stack depth <= d.
  //   n?: Counters // - Match if rule counters <= respective given values.
  // }

  n?: Counters // Increment counters by specified amounts.
  a?: AltAction // Perform an action if this alternate matches.
  h?: AltModifier // Modify current Alt to customize parser.
  u?: Bag // Key-value custom data.
  k?: Bag // Key-value custom data (propagated).

  g?:
    | string // Named group tags for the alternate (allows filtering).
    | string[] // - comma separated or string array

  e?: AltError // Generate an error token (alternate is not allowed).
}

// Allow AltSpecs to be "empty" and thus ignored.
type AltSpecish = AltSpec | undefined | null | false | 0 | typeof NaN

// List modifications
export type ListMods = {
  append?: boolean // if `true` apppend new entries, otherwise prepend.
  move?: number[] // [from,to,  from,to,  ...]
  delete?: number[] // [index0, index1, ...]
  custom?: (alts: AltSpec[]) => null | AltSpec[]
}

// Parse-alternate match (built from current tokens and AltSpec).
export interface AltMatch {
  p?: string | null | false | 0 // Push rule (by name).
  r?: string | null | false | 0 // Replace rule (by name).
  b?: number | null | false // Move token position backward.
  c?: AltCond // Custom alt match condition.
  n?: Counters // increment named counters.
  a?: AltAction // Match actions.
  h?: AltModifier // Modify alternate match.
  u?: Bag // Custom props to add to Rule.use.
  k?: Bag // Custom props to add to Rule.keep and keep via push and replace.
  g?: string[] // Named group tags (allows plugins to find alts).
  e?: Token // Errored on this token.
}

// General container of named items.
export type Bag = { [key: string]: any }

// A set of named counters.
export type Counters = { [key: string]: number }

// Unique token identification number (aka "tin").
export type Tin = number

// Map token name ('#' prefix removed) to Token index (Tin).
export type TokenMap = { [name: string]: Tin }

// Map token name ('#' prefix removed) to Token index (Tin) set.
export type TokenSetMap = { [name: string]: Tin[] }

// Map Token index (Tin) to token name ('#' prefix removed).
export type TinMap = { [ref: number]: string }

// Map Token index (Tin) to token set name ('#' prefix removed).
export type TinSetMap = { [ref: number]: string }

// Map token name to matcher.
export type MatchMap = { [name: string]: RegExp | LexMatcher }

// Map character to code value.
export type Chars = { [char: string]: number }

// Map string to string value.
export type StrMap = { [name: string]: string }

// After rule stack push, Rules are in state OPEN ('o'),
// after first process, awaiting pop, Rules are in state CLOSE ('c').
export type RuleState = 'o' | 'c'

// When executing a Rule state (attempting a match), an action can be
// executed BEFORE ('b') or AFTER ('a') the match.
export type RuleStep = 'b' | 'a'

// A lexing function that attempts to match tokens.
export type LexMatcher = (
  lex: Lex,
  rule: Rule,
  tI?: number,
) => Token | undefined

// Construct a lexing function based on configuration.
export type MakeLexMatcher = (
  cfg: Config,
  opts: Options,
) => LexMatcher | null | undefined | false

export type LexCheck = (
  lex: Lex,
) => void | undefined | { done: boolean; token: Token | undefined }

export type ParsePrepare = (jsonic: Jsonic, ctx: Context, meta?: any) => void

export type RuleSpecMap = { [name: string]: RuleSpec }

export type RuleDefiner = (rs: RuleSpec, p: Parser) => void | RuleSpec

// Normalized parse-alternate.
export interface NormAltSpec extends AltSpec {
  s: (Tin | Tin[] | null | undefined)[]
  S0: number[] | null
  S1: number[] | null
  c?: AltCond // Convenience definition reduce to function for processing.
  g: string[] // Named group tags
}

// Conditionally pass an alternate.
export type AltCond = (rule: Rule, ctx: Context, alt: AltMatch) => boolean

// Arbitrarily modify an alternate to customize parser.
export type AltModifier = (
  rule: Rule,
  ctx: Context,
  alt: AltMatch,
  next: Rule,
) => AltMatch

// Execute an action when alternate matches.
export type AltAction = (rule: Rule, ctx: Context, alt: AltMatch) => any

// Determine next rule name (for AltSpec r or p properties).
export type AltNext = (
  rule: Rule,
  ctx: Context,
  alt: AltMatch,
) => string | null | false | 0

// Determine token push back.
export type AltBack = (
  rule: Rule,
  ctx: Context,
  alt: AltMatch,
) => number | null | false

// Execute an action for a given Rule state and step:
// bo: BEFORE OPEN, ao: AFTER OPEN, bc: BEFORE CLOSE, ac: AFTER CLOSE.
export type StateAction = (
  rule: Rule,
  ctx: Context,
  next: Rule,
  out?: Token | void, // TODO: why void?
) => Token | void

// Generate an error token (with an appropriate code).
// NOTE: errors are specified using tokens in order to capture file row and col.
export type AltError = (
  rule: Rule,
  ctx: Context,
  alt: AltMatch,
) => Token | undefined

export type ValModifier = (
  val: any,
  lex: Lex,
  cfg: Config,
  opts: Options,
) => string

export type LexSub = (tkn: Token, rule: Rule, ctx: Context) => void
export type RuleSub = (rule: Rule, ctx: Context) => void

export interface Parser {
  options: Options
  cfg: Config
  rsm: RuleSpecMap

  rule(
    name?: string,
    define?: RuleDefiner | null,
  ): RuleSpec | RuleSpecMap | undefined

  start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any

  clone(options: Options, config: Config): Parser

  norm(): void
}

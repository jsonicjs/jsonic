/* Copyright (c) 2021 Richard Rodger, MIT License */

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
  options: Options & ((change_options?: Relate) => Relate)

  // Create a new Jsonic instance to customize.
  make: (options?: Options) => Jsonic

  // Use a plugin
  use: (plugin: Plugin, plugin_options?: Relate) => Jsonic

  // Get and set parser rules.
  rule: (name?: string, define?: RuleDefiner | null) =>
    Jsonic | RuleSpec | RuleSpecMap

  // Provide new lex matcher.
  lex: (matchmaker: MakeLexMatcher) => void

  empty: (options?: Options) => Jsonic

  // Token get and set for plugins. Reference by either name or Tin.
  token:
  { [ref: string]: Tin } &
  { [ref: number]: string } &
  (<A extends string | Tin>(ref: A) => A extends string ? Tin : string)

  // Fixed token src get and set for plugins. Reference by either src or Tin.
  fixed:
  { [ref: string]: Tin } &
  { [ref: number]: string } &
  (<A extends string | Tin>(ref: A) => undefined | (A extends string ? Tin : string))

  // Unique identifier string for each Jsonic instance.
  id: string

  // Provide identifier for string conversion.
  toString: () => string

  util: Relate
}


// The full library type.
export type Jsonic =
  JsonicParse & // A function that parses.
  JsonicAPI & // A utility with API methods.
  { [prop: string]: any } // Extensible by plugin decoration.


// Define a plugin to extend the provided Jsonic instance.
export type Plugin = ((jsonic: Jsonic, plugin_options?: any) => void | Jsonic) &
{ defaults?: Relate }


// Parsing options. See defaults.ts for commentary.
export type Options = {
  tag?: string
  fixed?: {
    lex?: boolean
    token?: StrMap
  }
  tokenSet?: {
    ignore?: string[]
  }
  space?: {
    lex?: boolean
    chars?: string
  }
  line?: {
    lex?: boolean
    chars?: string
    rowChars?: string
  },
  text?: {
    lex?: boolean
  }
  number?: {
    lex?: boolean
    hex?: boolean
    oct?: boolean
    bin?: boolean
    sep?: string | null
  }
  comment?: {
    lex?: boolean
    marker?: {
      line?: boolean
      start?: string
      end?: string
      lex?: boolean
    }[]
  }
  string?: {
    lex?: boolean
    chars?: string
    multiChars?: string
    escapeChar?: string
    escape?: { [char: string]: string | null }
    allowUnknown?: boolean
  }
  map?: {
    extend?: boolean
    merge?: (prev: any, curr: any) => any
  }
  value?: {
    lex?: boolean
    map?: { [src: string]: { val: any } }
  }
  ender?: string | string[]
  plugin?: Relate
  debug?: {
    get_console?: () => any
    maxlen?: number
    print?: {
      config?: boolean
    }
  }
  error?: { [code: string]: string }
  hint?: any
  lex?: {
    empty?: boolean
    match?: MakeLexMatcher[]
  }
  rule?: {
    start?: string
    finish?: boolean
    maxmul?: number
    include?: string
    exclude?: string
  },
  config?: {
    modify?: { [plugin_name: string]: (config: Config, options: Options) => void }
  },
  parser?: {
    start?: (
      lexer: any, //Lexer,
      src: string,
      jsonic: any, //Jsonic,
      meta?: any,
      parent_ctx?: any
    ) => any
  },
  defaults$?: boolean
  grammar$?: boolean
}


// Parsing rule specification. The rule OPEN and CLOSE state token
// match alternates, and the associated actions, can be defined with a
// chainable API.
export interface RuleSpec {
  name: string
  def: {
    open: AltSpec[],
    close: AltSpec[],
    bo?: StateAction,
    ao?: StateAction,
    bc?: StateAction,
    ac?: StateAction,
  }

  tin<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T

  add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec
  open(a: AltSpec | AltSpec[], flags?: any): RuleSpec
  close(a: AltSpec | AltSpec[], flags?: any): RuleSpec
  action(step: RuleStep, state: RuleState, action: StateAction): RuleSpec
  bo(action: StateAction): RuleSpec
  ao(action: StateAction): RuleSpec
  bc(action: StateAction): RuleSpec
  ac(action: StateAction): RuleSpec
  clear(): RuleSpec

  process(rule: Rule, ctx: Context, state: RuleState): Rule

  // First alternate to match token stream wins.
  parse_alts(is_open: boolean, alts: NormAltSpec[], rule: Rule, ctx: Context):
    AltMatch

  bad(tkn: Token, rule: Rule, ctx: Context, parse: { is_open: boolean }): Rule
}


// Represents the application of a parsing rule. An instance is created
// for each attempt to match tokens based on the RuleSpec, and pushed
// onto the main parser rule stack. A Rule can be in two states:
// "open" when first placed on the stack, and "close" when it needs to be
// removed from the stack.
export interface Rule {
  id: number         // Rule index (unique to parse).
  name: string       // Rule name.
  spec: RuleSpec     // RuleSpec for this rule.
  node: any          // The parsed value, if any.
  state: RuleState   // Open (`o`) or Close (`c`).
  child: Rule        // The current child rule, created with the `p` command.
  parent: Rule       // The parent rule, that pushed this rule onto the stack.
  prev: Rule         // The previous sibling rule, that issued an `r` command.

  // open: Token[]      // The tokens than matched in the open state.
  // close: Token[]     // The tokens than matched in the close state.
  os: number
  o0: Token
  o1: Token
  cs: number
  c0: Token
  c1: Token

  n: Counters        // Named counter values.
  d: number          // The current stack depth.   
  use: Relate        // Custom key-value store. 
  bo: boolean        // Flag: call bo (before-open).
  ao: boolean        // Flag: call ao (after-open).
  bc: boolean        // Flag: call bc (before-close).
  ac: boolean        // Flag: call ac (after-close).
  why?: string       // Internal tracing.

  // Process the "open" or "close" state of the Rule, returning the
  // next rule to process.
  process(ctx: Context): Rule
}


// The current parse state and associated context.
export type Context = {
  uI: number            // Rule index.
  opts: Options         // Jsonic instance options.
  cfg: Config           // Jsonic instance config.
  meta: Relate          // Parse meta parameters.
  src: () => string,    // source text to parse.
  root: () => any,      // Root node.
  plgn: () => Plugin[]  // Jsonic instance plugins.
  rule: Rule            // Current rule instance.
  xs: Tin               // Lex state tin.
  v2: Token             // Previous previous token.
  v1: Token             // Previous token.
  t0: Token             // Current token.
  t1: Token             // Next token. 
  tC: number            // Token count.
  rs: Rule[]            // Rule stack.
  rsI: number
  rsm: { [name: string]: RuleSpec } // RuleSpec lookup map (by rule name).
  next: () => Token     // Move to next token.
  log?: (...rest: any) => undefined // Log parse/lex step (if defined).
  F: (s: any) => string // Format arbitrary data as length-limited string.
  use: Relate           // Custom meta data (for use by plugins)
  NOTOKEN: Token        // Per parse "null" Token
  NORULE: Rule          // Per parse "null" Rule
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


  next(rule: Rule): Token

  tokenize<
    R extends string | Tin,
    T extends (R extends Tin ? string : Tin)
  >(ref: R): T

  bad(why: string, pstart: number, pend: number): Token
}


// Internal clean configuration built from options by
// `utility.configure` and LexMatchers.
export type Config = {

  lex: {
    match: LexMatcher[]
    empty: boolean
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
  }

  // Token sets.
  tokenSet: {

    // Tokens ignored by rules.
    ignore: {
      [name: number]: boolean
    }
  }

  // Space characters.
  space: {
    lex: boolean
    chars: Chars
  }

  // Line end characters.
  line: {
    lex: boolean
    chars: Chars
    rowChars: Chars // Row counting characters.
  }

  // Unquoted text
  text: {
    lex: boolean
  }

  // Numbers
  number: {
    lex: boolean
    hex: boolean
    oct: boolean
    bin: boolean
    sep: boolean
    sepChar?: string | null
  }

  // String quote characters.
  string: {
    lex: boolean
    quoteMap: Chars,
    escMap: Relate,
    escChar?: string,
    escCharCode?: number,
    multiChars: Chars,
    allowUnknown: boolean,
  }

  // Literal values
  value: {
    lex: boolean
    map: { [src: string]: { val: any } }
  }

  comment: {
    lex: boolean
    marker: {
      line: boolean
      start: string
      end?: string
      lex: boolean
    }[]
  }

  map: {
    extend: boolean
    merge?: (prev: any, curr: any) => any
  }

  debug: {
    get_console: () => any
    maxlen: number
    print: {
      config: boolean
    }
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
  sI: number  // Source position (0-based).
  rI: number  // Source row (1-based as editors do that).
  cI: number  // Source column (1-based as editors do that).

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
  isToken: boolean // Type guard.
  name: string     // Token name.
  tin: Tin         // Token identification number.
  val: any         // Value of Token if literal (eg. number).
  src: string      // Source text of Token.
  sI: number       // Location of token index in source text (0-based).
  rI: number       // Row location of token in source text (1-based).
  cI: number       // Column location of token in source text (1-based).
  len: number      // Length of Token source text.
  use?: Relate     // Custom meta data from plugins goes here.
  err?: string     // Error code.
  why?: string     // Internal tracing.

  // Convert into an error Token.
  bad(err: string, details?: any): Token
}


// Specification for a parse-alternate within a Rule state.
// Represent a possible token match (2-token lookahead)
export interface AltSpec {

  // Token Tin sequence to match (0,1,2 Tins, or a subset of Tins; nulls filterd out).
  s?: (Tin | Tin[] | null | undefined)[] | null

  // Push named Rule onto stack (create child).
  p?: string | AltNext

  // Replace current rule with named Rule on stack (create sibling).
  r?: string | AltNext

  // TODO: AltBack as per AltNext?
  b?: number      // Move token pointer back by indicated number of steps.

  // Condition function, return true to match alternate.
  // NOTE: Token sequence (s) must also match.
  c?: AltCond |
  {               // Condition convenience definitions (all must pass).
    d?: number    // - Match if rule stack depth <= d.
    n?: Counters  // - Match if rule counters <= respective given values.
  }

  n?: Counters    // Increment counters by specified amounts.
  a?: AltAction   // Perform an action if this alternate matches.
  h?: AltModifier // Modify current Alt to customize parser.
  u?: Relate      // Key-value custom data.

  g?: string |    // Named group tags for the alternate (allows filtering).
  string[]        // - comma separated or string array

  e?: AltError    // Generate an error token (alternate is not allowed).
}


// Parse-alternate match (built from current tokens and AltSpec).
export interface AltMatch {
  // m: Token[]      // Matched Tokens (not Tins!).
  p: string       // Push rule (by name).
  r: string       // Replace rule (by name).
  b: number       // Move token position backward.
  c?: AltCond     // Custom alt match condition.
  n?: Counters    // increment named counters.
  a?: AltAction   // Match actions.
  h?: AltModifier // Modify alternate match.
  u?: any         // Custom properties to add to Rule.use.
  g?: string[]    // Named group tags (allows plugins to find alts).
  e?: Token       // Errored on this token.
}


// General relation map.
export type Relate = { [key: string]: any }


// A set of named counters.
export type Counters = { [key: string]: number }


// Unique token identification number (aka "tin").
export type Tin = number


// Map token name to Token index (Tin).
export type TokenMap = { [name: string]: Tin }


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
export type LexMatcher = (lex: Lex, rule: Rule) => Token | undefined


// Construct a lexing function based on configuration.
export type MakeLexMatcher = (cfg: Config, opts: Options) => LexMatcher


export type RuleSpecMap = { [name: string]: RuleSpec }


export type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => void | RuleSpec


// Normalized parse-alternate.
export interface NormAltSpec extends AltSpec {
  s: (Tin | Tin[] | null | undefined)[]
  S0: number[] | null
  S1: number[] | null
  c?: AltCond  // Convenience definition reduce to function for processing.
  g?: string[] // Named group tags
}


// Conditionally pass an alternate.
export type AltCond = (rule: Rule, ctx: Context, alt: AltMatch) => boolean


// Arbitrarily modify an alternate to customize parser.
export type AltModifier =
  (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => AltMatch


// Execute an action when alternate matches.
export type AltAction = (rule: Rule, ctx: Context, alt: AltMatch) => any


// Determine next rule name (for AltSpec r or p properties). 
export type AltNext = (rule: Rule, ctx: Context, alt: AltMatch) => string


// Execute an action for a given Rule state and step:
// bo: BEFORE OPEN, ao: AFTER OPEN, bc: BEFORE CLOSE, ac: AFTER CLOSE.
export type StateAction = (rule: Rule, ctx: Context) => any


// Generate an error token (with an appropriate code).
// NOTE: errors are specified using tokens in order to capture file row and col.
export type AltError = (rule: Rule, ctx: Context, alt: AltMatch) => Token | undefined


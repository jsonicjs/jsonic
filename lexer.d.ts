import type { Rule } from './jsonic';
import { Config, Context, Tin, Token } from './intern';
declare type Lex = ((rule: Rule) => Token) & {
    src: string;
};
declare type LexMatcherState = {
    sI: number;
    rI: number;
    cI: number;
    src: string;
    token: Token;
    ctx: Context;
    rule: Rule;
    bad: any;
};
declare type LexMatcher = (lms: LexMatcherState) => LexMatcherResult;
declare type LexMatcherListMap = {
    [state: number]: LexMatcher[];
};
declare type LexMatcherResult = undefined | {
    sI: number;
    rI: number;
    cI: number;
    state?: number;
    state_param?: any;
};
declare class Lexer {
    end: Token;
    match: LexMatcherListMap;
    constructor(config: Config);
    start(ctx: Context): Lex;
    bad(ctx: Context, log: ((...rest: any) => undefined) | undefined, why: string, token: Token, sI: number, pI: number, rI: number, cI: number, val?: any, src?: any, use?: any): Token;
    lex(state?: Tin, matcher?: LexMatcher): LexMatcherListMap | LexMatcher[];
    clone(config: Config): Lexer;
}
export { Lex, Lexer, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState, };

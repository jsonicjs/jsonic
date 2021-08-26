import type { Tin, Token } from './types';
import { INSPECT } from './types';
import type { Rule, Options } from './jsonic';
import { Config, Context } from './utility';
declare class Point {
    len: number;
    sI: number;
    rI: number;
    cI: number;
    token: Token[];
    end: Token | undefined;
    constructor(len: number, sI?: number, rI?: number, cI?: number);
    toString(): string;
    [INSPECT](): string;
}
declare class TokenImpl implements Token {
    isToken: boolean;
    name: string;
    tin: Tin;
    val: any;
    src: string;
    sI: number;
    rI: number;
    cI: number;
    len: number;
    use?: any;
    err?: string;
    why?: string;
    constructor(name: string, tin: Tin, val: any, src: string, pnt: Point, use?: any, why?: string);
    bad(err: string, details?: any): Token;
    toString(): string;
    [INSPECT](): string;
}
declare const makeToken: (name: string, tin: number, val: any, src: string, pnt: Point, use?: any, why?: string | undefined) => TokenImpl;
declare type MakeLexMatcher = (cfg: Config, opts: Options) => LexMatcher;
declare type LexMatcher = (lex: Lex, rule: Rule) => Token | undefined;
declare let makeFixedMatcher: MakeLexMatcher;
declare let makeCommentMatcher: MakeLexMatcher;
declare let makeTextMatcher: MakeLexMatcher;
declare let makeNumberMatcher: MakeLexMatcher;
declare let makeStringMatcher: MakeLexMatcher;
declare let makeLineMatcher: MakeLexMatcher;
declare let makeSpaceMatcher: MakeLexMatcher;
declare class Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    constructor(ctx: Context);
    token(ref: Tin | string, val: any, src: string, pnt?: Point, use?: any, why?: string): Token;
    next(rule: Rule): Token;
    tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T;
    bad(why: string, pstart: number, pend: number): Token;
}
export type { MakeLexMatcher, LexMatcher, };
export { Point, Lex, makeToken, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher, };

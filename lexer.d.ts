import type { Tin, Token, Point, Lex, Rule, Config, Context, MakeLexMatcher, Relate } from './types';
import { INSPECT } from './types';
declare class PointImpl implements Point {
    len: number;
    sI: number;
    rI: number;
    cI: number;
    token: Token[];
    end?: Token;
    constructor(len: number, sI?: number, rI?: number, cI?: number);
    toString(): string;
    [INSPECT](): string;
}
declare const makePoint: (len: number, sI?: number | undefined, rI?: number | undefined, cI?: number | undefined) => PointImpl;
declare class TokenImpl implements Token {
    isToken: boolean;
    name: string;
    tin: number;
    val: undefined;
    src: string;
    sI: number;
    rI: number;
    cI: number;
    len: number;
    use?: Relate;
    err?: string;
    why?: string;
    constructor(name: string, tin: Tin, val: any, src: string, pnt: Point, use?: any, why?: string);
    bad(err: string, details?: any): Token;
    toString(): string;
    [INSPECT](): string;
}
declare const makeToken: (name: string, tin: number, val: any, src: string, pnt: Point, use?: any, why?: string | undefined) => TokenImpl;
declare const NOTOKEN: TokenImpl;
declare let makeFixedMatcher: MakeLexMatcher;
declare let makeCommentMatcher: MakeLexMatcher;
declare let makeTextMatcher: MakeLexMatcher;
declare let makeNumberMatcher: MakeLexMatcher;
declare let makeStringMatcher: MakeLexMatcher;
declare let makeLineMatcher: MakeLexMatcher;
declare let makeSpaceMatcher: MakeLexMatcher;
declare class LexImpl implements Lex {
    src: string;
    ctx: Context;
    cfg: Config;
    pnt: PointImpl;
    constructor(ctx: Context);
    token(ref: Tin | string, val: any, src: string, pnt?: Point, use?: any, why?: string): Token;
    next(rule: Rule): Token;
    tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T;
    bad(why: string, pstart: number, pend: number): Token;
}
declare const makeLex: (ctx: Context) => LexImpl;
export { NOTOKEN, makeLex, makePoint, makeToken, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher, };

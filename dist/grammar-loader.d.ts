declare function getPath(obj: any, path: string): any;
declare function evalCond(cond: any, rule: any): boolean;
declare function resolveToken(ref: string, jsonic: any): any;
declare function buildCond(condSpec: any, funcs: any): any;
declare function applyGrammar(jsonic: any, spec: any, funcs?: any): void;
export { applyGrammar, evalCond, getPath, resolveToken, buildCond, };

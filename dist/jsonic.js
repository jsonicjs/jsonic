"use strict";
/* Copyright (c) 2013-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.root = exports.S = exports.EMPTY = exports.AFTER = exports.BEFORE = exports.CLOSE = exports.OPEN = exports.makeTextMatcher = exports.makeNumberMatcher = exports.makeCommentMatcher = exports.makeStringMatcher = exports.makeLineMatcher = exports.makeSpaceMatcher = exports.makeFixedMatcher = exports.makeParser = exports.makeLex = exports.makeRuleSpec = exports.makeRule = exports.makePoint = exports.makeToken = exports.make = exports.util = exports.JsonicError = exports.Jsonic = void 0;
const types_1 = require("./types");
Object.defineProperty(exports, "OPEN", { enumerable: true, get: function () { return types_1.OPEN; } });
Object.defineProperty(exports, "CLOSE", { enumerable: true, get: function () { return types_1.CLOSE; } });
Object.defineProperty(exports, "BEFORE", { enumerable: true, get: function () { return types_1.BEFORE; } });
Object.defineProperty(exports, "AFTER", { enumerable: true, get: function () { return types_1.AFTER; } });
Object.defineProperty(exports, "EMPTY", { enumerable: true, get: function () { return types_1.EMPTY; } });
const utility_1 = require("./utility");
Object.defineProperty(exports, "JsonicError", { enumerable: true, get: function () { return utility_1.JsonicError; } });
Object.defineProperty(exports, "S", { enumerable: true, get: function () { return utility_1.S; } });
const defaults_1 = require("./defaults");
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "makePoint", { enumerable: true, get: function () { return lexer_1.makePoint; } });
Object.defineProperty(exports, "makeToken", { enumerable: true, get: function () { return lexer_1.makeToken; } });
Object.defineProperty(exports, "makeLex", { enumerable: true, get: function () { return lexer_1.makeLex; } });
Object.defineProperty(exports, "makeFixedMatcher", { enumerable: true, get: function () { return lexer_1.makeFixedMatcher; } });
Object.defineProperty(exports, "makeSpaceMatcher", { enumerable: true, get: function () { return lexer_1.makeSpaceMatcher; } });
Object.defineProperty(exports, "makeLineMatcher", { enumerable: true, get: function () { return lexer_1.makeLineMatcher; } });
Object.defineProperty(exports, "makeStringMatcher", { enumerable: true, get: function () { return lexer_1.makeStringMatcher; } });
Object.defineProperty(exports, "makeCommentMatcher", { enumerable: true, get: function () { return lexer_1.makeCommentMatcher; } });
Object.defineProperty(exports, "makeNumberMatcher", { enumerable: true, get: function () { return lexer_1.makeNumberMatcher; } });
Object.defineProperty(exports, "makeTextMatcher", { enumerable: true, get: function () { return lexer_1.makeTextMatcher; } });
const parser_1 = require("./parser");
Object.defineProperty(exports, "makeRule", { enumerable: true, get: function () { return parser_1.makeRule; } });
Object.defineProperty(exports, "makeRuleSpec", { enumerable: true, get: function () { return parser_1.makeRuleSpec; } });
Object.defineProperty(exports, "makeParser", { enumerable: true, get: function () { return parser_1.makeParser; } });
const grammar_1 = require("./grammar");
// TODO: remove - too much for an API!
const util = {
    tokenize: utility_1.tokenize,
    srcfmt: utility_1.srcfmt,
    clone: utility_1.clone,
    charset: utility_1.charset,
    trimstk: utility_1.trimstk,
    makelog: utility_1.makelog,
    badlex: utility_1.badlex,
    extract: utility_1.extract,
    errinject: utility_1.errinject,
    errdesc: utility_1.errdesc,
    configure: utility_1.configure,
    parserwrap: utility_1.parserwrap,
    mesc: utility_1.mesc,
    escre: utility_1.escre,
    regexp: utility_1.regexp,
    prop: utility_1.prop,
    str: utility_1.str,
    clean: utility_1.clean,
    // TODO: validated to include in util API:
    deep: utility_1.deep,
    omap: utility_1.omap,
    keys: utility_1.keys,
    values: utility_1.values,
    entries: utility_1.entries,
};
exports.util = util;
function make(param_options, parent) {
    let injectFullAPI = true;
    if ('jsonic' === param_options) {
        injectFullAPI = false;
    }
    else if ('json' === param_options) {
        return (0, grammar_1.makeJSON)(root);
    }
    param_options = 'string' === typeof param_options ? {} : param_options;
    let internal = {
        parser: null,
        config: null,
        plugins: [],
        sub: {
            lex: undefined,
            rule: undefined,
        },
        mark: Math.random(),
    };
    // Merge options.
    let merged_options = (0, utility_1.deep)({}, parent
        ? { ...parent.options }
        : false === (param_options === null || param_options === void 0 ? void 0 : param_options.defaults$)
            ? {}
            : defaults_1.defaults, param_options ? param_options : {});
    // Create primary parsing function
    let jsonic = function Jsonic(src, meta, parent_ctx) {
        var _a;
        if (utility_1.S.string === typeof src) {
            let internal = jsonic.internal();
            let parser = ((_a = options.parser) === null || _a === void 0 ? void 0 : _a.start)
                ? (0, utility_1.parserwrap)(options.parser)
                : internal.parser;
            return parser.start(src, jsonic, meta, parent_ctx);
        }
        return src;
    };
    // This lets you access options as direct properties,
    // and set them as a function call.
    let options = (change_options) => {
        if (null != change_options && utility_1.S.object === typeof change_options) {
            (0, utility_1.deep)(merged_options, change_options);
            (0, utility_1.configure)(jsonic, internal.config, merged_options);
            let parser = jsonic.internal().parser;
            internal.parser = parser.clone(merged_options, internal.config);
        }
        return { ...jsonic.options };
    };
    // Define the API
    let api = {
        token: ((ref) => (0, utility_1.tokenize)(ref, internal.config, jsonic)),
        tokenSet: ((ref) => (0, utility_1.findTokenSet)(ref, internal.config)),
        fixed: ((ref) => internal.config.fixed.ref[ref]),
        options: (0, utility_1.deep)(options, merged_options),
        config: () => (0, utility_1.deep)(internal.config),
        parse: jsonic,
        // TODO: how to handle null plugin?
        use: function use(plugin, plugin_options) {
            if (utility_1.S.function !== typeof plugin) {
                throw new Error('Jsonic.use: the first argument must be a function ' +
                    'defining a plugin. See https://jsonic.senecajs.org/plugin');
            }
            // Plugin name keys in options.plugin are the lower-cased plugin function name.
            const plugin_name = plugin.name.toLowerCase();
            const full_plugin_options = (0, utility_1.deep)({}, plugin.defaults || {}, plugin_options || {});
            jsonic.options({
                plugin: {
                    [plugin_name]: full_plugin_options,
                },
            });
            let merged_plugin_options = jsonic.options.plugin[plugin_name];
            jsonic.internal().plugins.push(plugin);
            plugin.options = merged_plugin_options;
            return plugin(jsonic, merged_plugin_options) || jsonic;
        },
        rule: (name, define) => {
            return jsonic.internal().parser.rule(name, define) || jsonic;
        },
        make: (options) => {
            return make(options, jsonic);
        },
        empty: (options) => make({
            defaults$: false,
            standard$: false,
            grammar$: false,
            ...(options || {}),
        }),
        id: 'Jsonic/' +
            Date.now() +
            '/' +
            ('' + Math.random()).substring(2, 8).padEnd(6, '0') +
            (null == options.tag ? '' : '/' + options.tag),
        toString: () => {
            return api.id;
        },
        sub: (spec) => {
            if (spec.lex) {
                internal.sub.lex = internal.sub.lex || [];
                internal.sub.lex.push(spec.lex);
            }
            if (spec.rule) {
                internal.sub.rule = internal.sub.rule || [];
                internal.sub.rule.push(spec.rule);
            }
            return jsonic;
        },
        util,
    };
    // Has to be done indirectly as we are in a fuction named `make`.
    (0, utility_1.defprop)(api.make, utility_1.S.name, { value: utility_1.S.make });
    if (injectFullAPI) {
        // Add API methods to the core utility function.
        (0, utility_1.assign)(jsonic, api);
    }
    else {
        (0, utility_1.assign)(jsonic, {
            empty: api.empty,
            parse: api.parse,
            sub: api.sub,
            id: api.id,
            toString: api.toString,
        });
    }
    // Hide internals where you can still find them.
    (0, utility_1.defprop)(jsonic, 'internal', { value: () => internal });
    if (parent) {
        // Transfer extra parent properties (preserves plugin decorations, etc).
        for (let k in parent) {
            if (undefined === jsonic[k]) {
                jsonic[k] = parent[k];
            }
        }
        jsonic.parent = parent;
        let parent_internal = parent.internal();
        internal.config = (0, utility_1.deep)({}, parent_internal.config);
        (0, utility_1.configure)(jsonic, internal.config, merged_options);
        (0, utility_1.assign)(jsonic.token, internal.config.t);
        internal.plugins = [...parent_internal.plugins];
        internal.parser = parent_internal.parser.clone(merged_options, internal.config);
    }
    else {
        let rootWithAPI = { ...jsonic, ...api };
        internal.config = (0, utility_1.configure)(rootWithAPI, undefined, merged_options);
        internal.plugins = [];
        internal.parser = (0, parser_1.makeParser)(merged_options, internal.config);
        if (false !== merged_options.grammar$) {
            (0, grammar_1.grammar)(rootWithAPI);
        }
    }
    return jsonic;
}
exports.make = make;
let root = undefined;
exports.root = root;
// The global root Jsonic instance parsing rules cannot be modified.
// use Jsonic.make() to create a modifiable instance.
let Jsonic = (exports.root = root = make('jsonic'));
exports.Jsonic = Jsonic;
// Provide deconstruction export names
root.Jsonic = root;
root.JsonicError = utility_1.JsonicError;
root.makeLex = lexer_1.makeLex;
root.makeParser = parser_1.makeParser;
root.makeToken = lexer_1.makeToken;
root.makePoint = lexer_1.makePoint;
root.makeRule = parser_1.makeRule;
root.makeRuleSpec = parser_1.makeRuleSpec;
root.makeFixedMatcher = lexer_1.makeFixedMatcher;
root.makeSpaceMatcher = lexer_1.makeSpaceMatcher;
root.makeLineMatcher = lexer_1.makeLineMatcher;
root.makeStringMatcher = lexer_1.makeStringMatcher;
root.makeCommentMatcher = lexer_1.makeCommentMatcher;
root.makeNumberMatcher = lexer_1.makeNumberMatcher;
root.makeTextMatcher = lexer_1.makeTextMatcher;
root.OPEN = types_1.OPEN;
root.CLOSE = types_1.CLOSE;
root.BEFORE = types_1.BEFORE;
root.AFTER = types_1.AFTER;
root.EMPTY = types_1.EMPTY;
root.util = util;
root.make = make;
root.S = utility_1.S;
exports.default = Jsonic;
if ('undefined' !== typeof module) {
    module.exports = Jsonic;
}
//# sourceMappingURL=jsonic.js.map
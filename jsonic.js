"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AFTER = exports.BEFORE = exports.CLOSE = exports.OPEN = exports.makeLex = exports.makeRuleSpec = exports.makeRule = exports.makePoint = exports.makeToken = exports.make = exports.util = exports.Parser = exports.JsonicError = exports.Jsonic = void 0;
const types_1 = require("./types");
Object.defineProperty(exports, "OPEN", { enumerable: true, get: function () { return types_1.OPEN; } });
Object.defineProperty(exports, "CLOSE", { enumerable: true, get: function () { return types_1.CLOSE; } });
Object.defineProperty(exports, "BEFORE", { enumerable: true, get: function () { return types_1.BEFORE; } });
Object.defineProperty(exports, "AFTER", { enumerable: true, get: function () { return types_1.AFTER; } });
const utility_1 = require("./utility");
Object.defineProperty(exports, "JsonicError", { enumerable: true, get: function () { return utility_1.JsonicError; } });
const defaults_1 = require("./defaults");
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "makePoint", { enumerable: true, get: function () { return lexer_1.makePoint; } });
Object.defineProperty(exports, "makeToken", { enumerable: true, get: function () { return lexer_1.makeToken; } });
Object.defineProperty(exports, "makeLex", { enumerable: true, get: function () { return lexer_1.makeLex; } });
const parser_1 = require("./parser");
Object.defineProperty(exports, "makeRule", { enumerable: true, get: function () { return parser_1.makeRule; } });
Object.defineProperty(exports, "makeRuleSpec", { enumerable: true, get: function () { return parser_1.makeRuleSpec; } });
Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return parser_1.Parser; } });
const grammar_1 = require("./grammar");
// TODO: remove - too much for an API!
const util = {
    tokenize: utility_1.tokenize,
    srcfmt: utility_1.srcfmt,
    deep: utility_1.deep,
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
};
exports.util = util;
function make(param_options, parent) {
    let internal = {
        parser: {},
        config: {},
        plugins: [],
        mark: Math.random()
    };
    // Merge options.
    let merged_options = utility_1.deep({}, parent ? { ...parent.options } : defaults_1.defaults, param_options ? param_options : {});
    // Create primary parsing function
    let jsonic = function Jsonic(src, meta, parent_ctx) {
        if (utility_1.S.string === typeof (src)) {
            let internal = jsonic.internal();
            let parser = options.parser.start ?
                utility_1.parserwrap(options.parser) : internal.parser;
            return parser.start(src, jsonic, meta, parent_ctx);
        }
        return src;
    };
    // This lets you access options as direct properties,
    // and set them as a funtion call.
    let options = (change_options) => {
        if (null != change_options && utility_1.S.object === typeof (change_options)) {
            utility_1.deep(merged_options, change_options);
            utility_1.configure(jsonic, internal.config, merged_options);
            let parser = jsonic.internal().parser;
            internal.parser = parser.clone(merged_options, internal.config);
        }
        return { ...jsonic.options };
    };
    // Define the API
    let api = {
        token: ((ref) => utility_1.tokenize(ref, internal.config, jsonic)),
        fixed: ((ref) => internal.config.fixed.ref[ref]),
        options: utility_1.deep(options, merged_options),
        parse: jsonic,
        // TODO: how to handle null plugin?
        use: function use(plugin, plugin_options) {
            const full_plugin_options = utility_1.deep({}, plugin.defaults || {}, plugin_options || {});
            jsonic.options({
                plugin: {
                    [plugin.name]: full_plugin_options
                }
            });
            jsonic.internal().plugins.push(plugin);
            return plugin(jsonic, full_plugin_options) || jsonic;
        },
        rule: (name, define) => {
            return jsonic.internal().parser.rule(name, define);
        },
        lex: (matchmaker) => {
            let match = merged_options.lex.match;
            match.unshift(matchmaker);
            jsonic.options({
                lex: { match }
            });
        },
        make: (options) => {
            return make(options, jsonic);
        },
        id: 'Jsonic/' +
            Date.now() + '/' +
            ('' + Math.random()).substring(2, 8).padEnd(6, '0') + '/' +
            options.tag,
        toString: () => {
            return api.id;
        },
        util,
    };
    // Has to be done indirectly as we are in a fuction named `make`.
    utility_1.defprop(api.make, utility_1.S.name, { value: utility_1.S.make });
    // Add API methods to the core utility function.
    utility_1.assign(jsonic, api);
    // Hide internals where you can still find them.
    utility_1.defprop(jsonic, 'internal', { value: () => internal });
    if (parent) {
        // Transfer extra parent properties (preserves plugin decorations, etc).
        for (let k in parent) {
            if (undefined === jsonic[k]) {
                jsonic[k] = parent[k];
            }
        }
        jsonic.parent = parent;
        let parent_internal = parent.internal();
        internal.config = utility_1.deep({}, parent_internal.config);
        utility_1.configure(jsonic, internal.config, merged_options);
        utility_1.assign(jsonic.token, internal.config.t);
        internal.plugins = [...parent_internal.plugins];
        internal.parser = parent_internal.parser.clone(merged_options, internal.config);
    }
    else {
        internal.config = utility_1.configure(jsonic, undefined, merged_options);
        internal.plugins = [];
        internal.parser = new parser_1.Parser(merged_options, internal.config);
        grammar_1.grammar(jsonic);
    }
    return jsonic;
}
exports.make = make;
let root = undefined;
let Jsonic = root = make();
exports.Jsonic = Jsonic;
// The global root Jsonic instance cannot be modified.
// use Jsonic.make() to create a modifiable instance.
delete root.options;
delete root.use;
delete root.rule;
delete root.lex;
delete root.token;
delete root.fixed;
// Provide deconstruction export names
root.Jsonic = root;
root.JsonicError = utility_1.JsonicError;
root.Parser = parser_1.Parser;
root.makeLex = lexer_1.makeLex;
root.makeToken = lexer_1.makeToken;
root.makePoint = lexer_1.makePoint;
root.makeRule = parser_1.makeRule;
root.makeRuleSpec = parser_1.makeRuleSpec;
root.util = util;
root.make = make;
exports.default = Jsonic;
// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
//# sourceMappingURL=jsonic.js.map
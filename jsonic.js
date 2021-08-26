"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePoint = exports.makeToken = exports.make = exports.util = exports.RuleSpec = exports.Rule = exports.Parser = exports.Lex = exports.JsonicError = exports.Jsonic = void 0;
const utility_1 = require("./utility");
Object.defineProperty(exports, "JsonicError", { enumerable: true, get: function () { return utility_1.JsonicError; } });
const defaults_1 = require("./defaults");
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "Lex", { enumerable: true, get: function () { return lexer_1.Lex; } });
Object.defineProperty(exports, "makePoint", { enumerable: true, get: function () { return lexer_1.makePoint; } });
Object.defineProperty(exports, "makeToken", { enumerable: true, get: function () { return lexer_1.makeToken; } });
const parser_1 = require("./parser");
Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return parser_1.Parser; } });
Object.defineProperty(exports, "Rule", { enumerable: true, get: function () { return parser_1.Rule; } });
Object.defineProperty(exports, "RuleSpec", { enumerable: true, get: function () { return parser_1.RuleSpec; } });
// TODO: remove - too much for an API!
let util = {
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
            // for (let k in merged_options) {
            //   jsonic.options[k] = merged_options[k]
            // }
            // assign(jsonic.token, internal.config?.t)
            let parser = jsonic.internal().parser;
            //if (parser) {
            internal.parser = parser.clone(merged_options, internal.config);
            //}
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
        internal.parser.init();
    }
    // As with options, provide direct access to tokens.
    // assign(jsonic.token, internal.config.t)
    // As with options, provide direct access to fixed token src strings.
    // assign(jsonic.fixed, internal.config.fixed.ref)
    // Hide internals where you can still find them.
    utility_1.defprop(jsonic, 'internal', { value: () => internal });
    return jsonic;
}
exports.make = make;
let Jsonic = make();
exports.Jsonic = Jsonic;
// Keep global top level safe
let top = Jsonic;
delete top.options;
delete top.use;
delete top.rule;
delete top.lex;
delete top.token;
delete top.fixed;
// Provide deconstruction export names
Jsonic.Jsonic = Jsonic;
Jsonic.JsonicError = utility_1.JsonicError;
Jsonic.Parser = parser_1.Parser;
Jsonic.Rule = parser_1.Rule;
Jsonic.RuleSpec = parser_1.RuleSpec;
// Jsonic.Alt = Alt
Jsonic.util = util;
Jsonic.make = make;
exports.default = Jsonic;
// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
//# sourceMappingURL=jsonic.js.map
"use strict";
/* Copyright (c) 2020-2021 Richard Rodger, Oliver Sturm, and other contributors, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const jsonic_1 = require("./jsonic");
run();
async function run() {
    const args = {
        str: '',
        file: '',
        options: {},
        meta: {},
        plugins: {},
    };
    let accept_args = true;
    let source_stdin = false;
    for (let aI = 2; aI < process.argv.length; aI++) {
        let arg = process.argv[aI];
        if (accept_args && arg.startsWith('-')) {
            if ('-' === arg) {
                source_stdin = true;
            }
            else if ('--' === arg) {
                accept_args = false;
            }
            else if ('--file' === arg || '-f' === arg) {
                args.file = process.argv[++aI];
            }
            else if ('--option' === arg || '-o' === arg) {
                handle_props(args, 'options', process.argv[++aI]);
            }
            else if ('--meta' === arg || '-m' === arg) {
                handle_props(args, 'meta', process.argv[++aI]);
            }
            else if ('--debug' === arg || '-d' === arg) {
                handle_props(args, 'meta', 'log=-1');
            }
            else if ('--help' === arg || '-h' === arg) {
                help();
            }
            else if ('--plugin' === arg || '-p' === arg) {
                handle_plugin(args, process.argv[++aI]);
            }
        }
        else {
            args.str += arg + ' ';
        }
    }
    if ('' === args.str || source_stdin) {
        args.str = await read_stdin() + ' ' + args.str;
    }
    if ('string' === typeof (args.file) && '' !== args.file) {
        args.str = fs_1.default.readFileSync(args.file).toString() + ' ' + args.str;
    }
    let jsonic = jsonic_1.Jsonic.make(args.options);
    for (let pn in args.plugins) {
        jsonic.use(args.plugins[pn]);
    }
    let val = jsonic(args.str, args.meta);
    args.options.JSON =
        null == args.options.JSON || 'object' !== typeof (args.options.JSON) ? {} :
            args.options.JSON;
    let replacer = jsonic_1.Jsonic(args.options.JSON.replacer);
    let space = jsonic_1.Jsonic(args.options.JSON.space);
    replacer = Array.isArray(replacer) ? replacer :
        'function' === typeof (replacer) ? replacer :
            null == replacer ? null :
                [replacer];
    let json = JSON.stringify(val, replacer, space);
    console.log(json);
}
async function read_stdin() {
    if (process.stdin.isTTY)
        return '';
    let s = '';
    process.stdin.setEncoding('utf8');
    for await (const p of process.stdin)
        s += p;
    return s;
}
function handle_props(args, argname, propval) {
    if ('string' === typeof (propval)) {
        let pv = propval.split(/=/);
        if ('' !== pv[0] && '' !== pv[1]) {
            let val = jsonic_1.Jsonic(pv[1]);
            set_prop(args[argname], pv[0], val);
        }
    }
}
function handle_plugin(args, name) {
    try {
        args.plugins[name] = require(name);
    }
    catch (e) {
        let err = e;
        // Might be builtin
        try {
            args.plugins[name] = require('./plugin/' + name);
        }
        catch (e) {
            throw err; // NOTE: throws original error
        }
    }
    if ('function' !== typeof (args.plugins[name])) {
        if ('function' == typeof (args.plugins[name][name])) {
            args.plugins[name] = args.plugins[name][name];
        }
        else if ('function' == typeof (args.plugins[name].default)) {
            args.plugins[name] = args.plugins[name].default;
        }
        else if ('function' ==
            typeof (args.plugins[name][camel(name)])) {
            args.plugins[name] = args.plugins[name][camel(name)];
        }
        else {
            throw new Error('Plugin is not a function: ' + name);
        }
    }
}
function set_prop(obj, path, val) {
    let parts = path.split('.');
    let pn;
    for (let pI = 0; pI < parts.length; pI++) {
        pn = parts[pI];
        if (pI < parts.length - 1) {
            obj = (obj[pn] = (obj[pn] || {}));
        }
    }
    if (null != pn) {
        obj[pn] = val;
    }
}
function camel(s) {
    return null == s ? null : s[0].toUpperCase() +
        s.substring(1).replace(/-(\w)/g, (m) => (m[1][0].toUpperCase() + m[1].substring(1)));
}
function help() {
    let s = `
A JSON parser that isn't strict.

Usage: jsonic <args> [<source-text>]*

where 
  <source-text> is the source text to be parsed into JSON.
    If omitted, the source text is read from STDIN. If multiple source texts
    are provided, they will be merged in precedence (from highest) 
    right to left, STDIN, <file>.

  <args> are the command arguments:

    -                      Alias for STDIN.

    --file <file>          Load and parse <file>.
    -f <file>

    --option <name=value>  Set option <name> to <value>, where <name> 
    -o <name=value>          can be a dotted path (see example below).

    --meta <meta=value>    Set parse meta data <name> to <value>, where <name> 
    -m <meta=value>          can be a dotted path (see option example).

    --plugin <require>     Load a plugin, where <require> is the plugin module
    -p <require>             reference (name or path).

    --debug                Print abbreviated lex and parse logs for debugging,
    -d                       alias of \`--meta log = -1\`.

    --help                 Print this help message.
    -h

Output:
  Output is generated by the built-in JSON.stringify method. The \`replacer\`
    and \`space\` arguments can be specified using \`-o JSON.replacer=...\` and
    \`-o JSON.space=...\` respectively.


Plugins 
  The built-in plugins (found in the ./plugin folder of the distribution) can be 
  specified using the abbreviated references:
    native, dynamic, csv, hsjon, multifile, legacy-stringify

  Plugin options can be specified using: \`-o plugin.<require>.<name>=<value>\`.
  See the example below.


Examples:

> jsonic a:1
{"a":1} 

> jsonic a:b:1 a:c:2
{"a":{"b":1,"c":2}}

> jsonic a:b:1 a:c:2 --option JSON.space=2
{
  "a": {
    "b": 1,
    "c": 2
  }
}

> echo a:1 | jsonic
{"a":1} 

> jsonic -o plugin.dynamic.markchar=% -p dynamic 'a:%1+1'
{"a":2}

See also: http://jsonic.richardrodger.com
`;
    console.log(s);
    process.exit(0);
}
//# sourceMappingURL=jsonic-cli.js.map
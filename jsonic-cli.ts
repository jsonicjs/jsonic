/* Copyright (c) 2020-2021 Richard Rodger, Oliver Sturm, and other contributors, MIT License */

import Fs from 'fs'

import { Jsonic } from './jsonic'


// Make sure JsonicError is shown nicely.
run(process.argv, console).catch((e) => console.error(e))


export async function run(argv: string[], console: Console) {
  const args = {
    str: '',
    file: '',
    options: ({} as any),
    meta: ({} as any),
    plugins: ({} as any),
  }

  let accept_args = true
  let source_stdin = false
  for (let aI = 2; aI < argv.length; aI++) {
    let arg = argv[aI]

    if (accept_args && arg.startsWith('-')) {
      if ('-' === arg) {
        source_stdin = true
      }
      else if ('--' === arg) {
        accept_args = false
      }
      else if ('--file' === arg || '-f' === arg) {
        args.file = argv[++aI]
      }
      else if ('--option' === arg || '-o' === arg) {
        handle_props(args, 'options', argv[++aI])
      }
      else if ('--meta' === arg || '-m' === arg) {
        handle_props(args, 'meta', argv[++aI])
      }
      else if ('--debug' === arg || '-d' === arg) {
        handle_props(args, 'meta', 'log=-1')
      }
      else if ('--help' === arg || '-h' === arg) {
        help()
      }
      else if ('--plugin' === arg || '-p' === arg) {
        handle_plugin(args, argv[++aI])
      }
    }
    else {
      args.str += arg + ' '
    }
  }

  if ('' === args.str || source_stdin) {
    args.str = await read_stdin() + ' ' + args.str
  }

  if ('string' === typeof (args.file) && '' !== args.file) {
    args.str = Fs.readFileSync(args.file).toString() + ' ' + args.str
  }


  let jsonic = Jsonic.make(args.options)

  for (let pn in args.plugins) {
    jsonic.use(args.plugins[pn])
  }


  let val = jsonic(args.str, args.meta)

  args.options.JSON =
    null == args.options.JSON || 'object' !== typeof (args.options.JSON) ? {} :
      args.options.JSON
  let replacer = Jsonic(args.options.JSON.replacer)
  let space = Jsonic(args.options.JSON.space)

  replacer = Array.isArray(replacer) ? replacer :
    'function' === typeof (replacer) ? replacer :
      null == replacer ? null :
        [replacer]

  let json = JSON.stringify(val, replacer, space)

  console.log(json)
}



async function read_stdin() {
  if (process.stdin.isTTY) return ''

  let s = ''
  process.stdin.setEncoding('utf8')
  for await (const p of process.stdin) s += p;
  return s
}


function handle_props(args: any, argname: string, propval: string) {
  if ('string' === typeof (propval)) {
    let pv = propval.split(/=/)
    if ('' !== pv[0] && '' !== pv[1]) {
      let val = Jsonic(pv[1])
      set_prop(args[argname], pv[0], val)
    }
  }
}


function handle_plugin(args: any, name: string) {
  try {
    args.plugins[name] = require(name)
  }
  catch (e) {
    let err = e

    // Might be builtin
    try {
      args.plugins[name] = require('./plugin/' + name)
    }
    catch (e) {
      throw err // NOTE: throws original error
    }
  }

  if ('function' !== typeof (args.plugins[name])) {
    if ('function' == typeof (args.plugins[name][name])) {
      args.plugins[name] = args.plugins[name][name]
    }
    else if ('function' == typeof (args.plugins[name].default)) {
      args.plugins[name] = args.plugins[name].default
    }
    else if ('function' ==
      typeof (args.plugins[name][(camel(name) as string)])) {
      args.plugins[name] = args.plugins[name][(camel(name) as string)]
    }
    else {
      throw new Error('Plugin is not a function: ' + name)
    }
  }
}


function set_prop(obj: any, path: string, val: any) {
  let parts = path.split('.')
  let pn
  for (let pI = 0; pI < parts.length; pI++) {
    pn = parts[pI]
    if (pI < parts.length - 1) {
      obj = (obj[pn] = (obj[pn] || {}))
    }
  }
  if (null != pn) {
    obj[pn] = val
  }
}


function camel(s: string) {
  return null == s ? null : s[0].toUpperCase() +
    s.substring(1).replace(/-(\w)/g, (m) =>
      (m[1][0].toUpperCase() + m[1].substring(1)))
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
`

  console.log(s)
  process.exit(0)
}

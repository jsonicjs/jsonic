/* Copyright (c) 2020-2021 Richard Rodger, Oliver Sturm, and other contributors, MIT License */
/* $lab:coverage:off$ */

import Fs from 'fs'

import { Jsonic, util } from './jsonic'


// Make sure JsonicError is shown nicely.
if (require.main === module) {
  run(process.argv, console).catch((e) => console.error(e))
}

type KV = { [name: string]: any }

/* $lab:coverage:on$ */


export async function run(argv: string[], console: Console) {
  const args = {
    help: false,
    stdin: false,
    sources: ([] as string[]),
    files: ([] as string[]),
    options: ([] as string[]),
    meta: ([] as string[]),
    plugins: ([] as string[]),
  }

  let accept_args = true
  for (let aI = 2; aI < argv.length; aI++) {
    let arg = argv[aI]

    if (accept_args && arg.startsWith('-')) {
      if ('-' === arg) {
        args.stdin = true
      }
      else if ('--' === arg) {
        accept_args = false
      }
      else if ('--file' === arg || '-f' === arg) {
        args.files.push(argv[++aI])
      }
      else if ('--option' === arg || '-o' === arg) {
        args.options.push(argv[++aI])
      }
      else if ('--meta' === arg || '-m' === arg) {
        args.meta.push(argv[++aI])
      }
      else if ('--debug' === arg || '-d' === arg) {
        args.meta.push('log=-1')
      }
      else if ('--help' === arg || '-h' === arg) {
        args.help = true
      }
      else if ('--plugin' === arg || '-p' === arg) {
        args.plugins.push(argv[++aI])
      }
      else {
        args.sources.push(arg)
      }
    }
    else {
      args.sources.push(arg)
    }
  }

  if (args.help) {
    return help(console)
  }

  let options: any = handle_props(args.options)
  let meta: any = handle_props(args.meta)
  let plugins: any = handle_plugins(args.plugins)

  options.debug = options.debug || {}
  options.debug.get_console = () => console

  let jsonic = Jsonic.make(options)

  for (let pn in plugins) {
    jsonic.use(plugins[pn])
  }

  let data = { val: null }

  for (let fp of args.files) {
    if ('string' === typeof (fp) && '' !== fp) {
      util.deep(data, { val: jsonic(Fs.readFileSync(fp).toString(), meta) })
    }
  }


  if (0 === args.sources.length || args.stdin) {
    let stdin = await read_stdin(console)
    util.deep(data, { val: jsonic(stdin, meta) })
  }

  for (let src of args.sources) {
    util.deep(data, { val: jsonic(src, meta) })
  }

  options.JSON =
    null == options.JSON || 'object' !== typeof (options.JSON) ? {} :
      options.JSON
  let replacer = Jsonic(options.JSON.replacer)
  let space = Jsonic(options.JSON.space)

  replacer = Array.isArray(replacer) ? replacer :
    null == replacer ? null :
      [replacer]

  let json = JSON.stringify(data.val, replacer, space)

  console.log(json)
}



async function read_stdin(console: Console) {
  if ('string' === typeof ((console as any).test$)) {
    return (console as any).test$
  }

  /* $lab:coverage:off$ */
  if (process.stdin.isTTY) return ''

  let s = ''
  process.stdin.setEncoding('utf8')
  for await (const p of process.stdin) s += p;
  return s
  /* $lab:coverage:on$ */
}


// TODO: FIX!!! this is very fragile and causes bizarro bugs!!!
// perhaps construct a simplified rules Jsonic instance for this use case?
// NOTE: uses vanilla Jsonic to parse arg vals, so you can set complex properties.
function handle_props(propvals: string[]): KV {
  let out = {}

  for (let propval of propvals) {
    let pv = propval.split(/=/)
    if ('' !== pv[0] && '' !== pv[1]) {
      let val = Jsonic(pv[1])
      util.prop(out, pv[0], val)
    }
  }
  return out
}


// TODO: test lowercase and normalize, esp core plugins, eg. @jsonic/directive
function handle_plugins(plugins: string[]): KV {
  let out: any = {}
  for (let name of plugins) {
    try {
      out[name] = require(name)
    }
    catch (e) {
      let err = e

      // Might be builtin
      try {
        out[name] = require('./plugin/' + name)
      }
      catch (e) {
        throw err // NOTE: throws original error
      }
    }

    if ('function' !== typeof (out[name])) {
      let refname = ((name as any).match(/([^.\\\/]+)($|\.[^.]+$)/) || [])[1]
      refname = null != refname ? refname.toLowerCase() : refname

      // See test plugin test/p1.js
      if ('function' == typeof (out[name].default)) {
        out[name] = out[name].default
      }
      else if (null != refname &&
        'function' == typeof (out[name][(camel(refname) as string)])
      ) {
        out[name] = out[name][(camel(refname) as string)]
      }

      // See test plugin test/p2.js
      else if (null != refname &&
        'function' == typeof (out[name][(refname as any)])
      ) {
        out[refname] = out[name][refname]
        delete out[name]
      }
      else {
        throw new Error('Plugin is not a function: ' + name)
      }
    }
    else {
      // normalize name
    }
  }

  return out
}



function camel(s: string) {
  return s[0].toUpperCase() +
    s.substring(1).replace(/-(\w)/g, (m) =>
      (m[1][0].toUpperCase() + m[1].substring(1)))
}


function help(console: Console) {
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
}

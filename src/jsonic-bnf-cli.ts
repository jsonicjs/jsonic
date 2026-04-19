/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */

/*  jsonic-bnf-cli.ts
 *  CLI wrapper for the BNF -> jsonic grammar spec converter.
 */

import Fs from 'node:fs'

import { bnf } from './bnf'


export async function run(argv: string[], console: Console) {
  const args = {
    help: false,
    stdin: false,
    files: [] as string[],
    inline: [] as string[],
    start: undefined as string | undefined,
    tag: undefined as string | undefined,
    space: 2,
  }

  for (let aI = 2; aI < argv.length; aI++) {
    const arg = argv[aI]
    if ('-' === arg) {
      args.stdin = true
    } else if ('--help' === arg || '-h' === arg) {
      args.help = true
    } else if ('--file' === arg || '-f' === arg) {
      args.files.push(argv[++aI])
    } else if ('--start' === arg || '-s' === arg) {
      args.start = argv[++aI]
    } else if ('--tag' === arg || '-t' === arg) {
      args.tag = argv[++aI]
    } else if ('--compact' === arg || '-c' === arg) {
      args.space = 0
    } else if (arg && !arg.startsWith('-')) {
      args.inline.push(arg)
    }
  }

  if (args.help) {
    return help(console)
  }

  let src = ''
  for (const fp of args.files) {
    if ('string' === typeof fp && '' !== fp) {
      src += Fs.readFileSync(fp).toString() + '\n'
    }
  }
  for (const inline of args.inline) {
    src += inline + '\n'
  }

  if ('' === src.trim() || args.stdin) {
    src += await readStdin(console)
  }

  const spec = bnf(src, { start: args.start, tag: args.tag })
  console.log(JSON.stringify(spec, null, args.space || undefined))
}


async function readStdin(console: Console): Promise<string> {
  if ('string' === typeof (console as any).test$) {
    return (console as any).test$
  }
  if (process.stdin.isTTY) return ''
  let s = ''
  process.stdin.setEncoding('utf8')
  for await (const p of process.stdin) s += p
  return s
}


function help(console: Console) {
  console.log(`
jsonic-bnf: convert a BNF grammar into a jsonic grammar spec.

Usage: jsonic-bnf <args> [<bnf-source>]*

Arguments:
  -                      Read BNF source from stdin.
  --file <path>          Read BNF source from <path> (repeatable).
  -f <path>

  --start <name>         Set the start rule (defaults to the first
  -s <name>                production).

  --tag <name>           Group tag applied to every emitted alt.
  -t <name>                Defaults to \`bnf\`.

  --compact              Emit single-line JSON (default indent is 2).
  -c

  --help                 Print this help message.
  -h

Examples:
  > jsonic-bnf '<greet> ::= "hi" | "hello"'
  > jsonic-bnf -f grammar.bnf
  > echo '<g> ::= "a"' | jsonic-bnf -
`)
}

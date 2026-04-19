/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */

/*  jsonic-bnf-cli.ts
 *  CLI wrapper for the BNF -> jsonic grammar spec converter.
 */

import Fs from 'node:fs'

import { bnf } from './bnf'
import { Jsonic } from './jsonic'


export async function run(argv: string[], console: Console) {
  const args = {
    help: false,
    stdin: false,
    files: [] as string[],
    inline: [] as string[],
    start: undefined as string | undefined,
    tag: undefined as string | undefined,
    space: 2,
    // When set, convert and install the grammar, parse each sample,
    // and report the tree (or an error) instead of the spec.
    parse: [] as string[],
    parseFiles: [] as string[],
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
    } else if ('--parse' === arg || '-P' === arg) {
      args.parse.push(argv[++aI])
    } else if ('--parse-file' === arg) {
      args.parseFiles.push(argv[++aI])
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

  // Parse-mode: validate the grammar against one or more sample
  // inputs and print their parse trees. Exits 1 if any sample fails.
  if (args.parse.length > 0 || args.parseFiles.length > 0) {
    const samples: { label: string; input: string }[] = []
    for (const fp of args.parseFiles) {
      samples.push({
        label: fp,
        input: Fs.readFileSync(fp).toString(),
      })
    }
    for (const inp of args.parse) {
      samples.push({ label: inp, input: inp })
    }

    const j = Jsonic.make()
    j.grammar(spec)

    let failed = 0
    for (const { label, input } of samples) {
      try {
        const tree = j(input)
        console.log(
          `ok: ${JSON.stringify(label)} -> ` +
          JSON.stringify(tree, null, args.space || undefined))
      } catch (e: any) {
        failed++
        const msg = (e?.message || String(e)).split('\n')[0]
        console.error(`fail: ${JSON.stringify(label)}: ${msg}`)
      }
    }
    if (failed > 0) {
      process.exitCode = 1
    }
    return
  }

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

  --parse <input>        Parse <input> against the generated grammar
  -P <input>               and print its parse tree. Repeatable.
                           Exits non-zero if any sample fails.

  --parse-file <path>    Parse the contents of <path> against the
                           generated grammar (repeatable).

  --help                 Print this help message.
  -h

Examples:
  > jsonic-bnf '<greet> ::= "hi" | "hello"'
  > jsonic-bnf -f grammar.bnf
  > echo '<g> ::= "a"' | jsonic-bnf -
  > jsonic-bnf -f grammar.bnf --parse 'hi'
`)
}


import { Jsonic, Plugin, Token, RuleSpec, Context } from '../jsonic'


let Csv: Plugin = function dollar(jsonic: Jsonic) {
  let SC_LINE = jsonic.options.SC_LINE
  let ER = ['#ER'] // end record

  //jsonic.options({})

  jsonic.lex(jsonic.options.LS_TOP, function csv(
    sI: number,
    src: string,
    token: Token,
    ctx: Context
  ): any {
    let out: any
    let opts = ctx.opts
    let c0c = src.charCodeAt(sI)

    console.log('csv', sI, SC_LINE, c0c)

    if (SC_LINE.includes(c0c)) {
      out = {
        sI: 0, // Update source index.
        rD: 0, // Row delta.
        cD: 0, // Col delta.
      }

      token.pin = ER

      let pI = sI
      let rD = 0 // Used as a delta.

      while (opts.sc_line.includes(src[pI])) {
        // Only count \n as a row increment
        rD += ('\n' === src[pI] ? 1 : 0)
        pI++
      }

      token.len = pI - sI
      token.val = src.substring(sI, pI)
      token.src = token.val

      sI = pI

      out.sI = sI
      out.rD = rD

      // lexlog && lexlog(token.pin[0], token.src, { ...token }) // TODO: before
    }

    console.log('csvlex out', out)
    return out
  })


  jsonic.rule('val', (rs: RuleSpec, rsm: any): RuleSpec => {
    let top = (alt: any, ctx: Context) => 0 === ctx.rs.length

    rs.def.open.unshift(
      { s: [ER], c: top, b: 1, p: 'list' },
      { s: [ER], b: 1, p: 'record' }
    )
    return rs
  })

  jsonic.rule('list', (rs: RuleSpec, rsm: any): RuleSpec => {
    //let top = (alt: any, ctx: Context) => 0 === ctx.rs.length

    rs.def.open.unshift(
      { s: [ER], b: 1, p: 'record' }
    )
    return rs
  })



  jsonic.rule('elem', (rs: RuleSpec, rsm: any): RuleSpec => {
    //rs.def.close.push({ s: [ER], b: 1, r: 'record' }) // End list
    rs.def.close.push({ s: [ER], b: 1 }) // End list
    return rs
  })


  jsonic.rule('record', (ignore: RuleSpec, rsm: { [n: string]: RuleSpec }) => {
    let rs = new RuleSpec('record', {
      open: [{ s: [ER], p: 'list' }],
      close: [{ s: [ER], b: 1, r: 'record' }],

      before_open: (rule: any, ctx: Context) => {
        //rule.node = []
        console.log('RECORD OPEN', rule.node)
      },


      before_close: (rule: any, ctx: Context) => {
        let fields: string[] = ctx.use.fields
        if (null == fields) {
          fields = ctx.use.fields = rule.child.node
        }
        else {
          //let fields: string[] = ctx.use.fields
          let record: { [k: string]: any } = {}
          rule.child.node.forEach((v: any, i: number) => record[fields[i]] = v)
          console.log('AAA', rule.child.node, record)

          rule.node.push(record)
        }
        console.log('RECORDS', rule.node)
      }
    }, rsm)
    return rs
  })
}


Jsonic.use(Csv)
console.log(Jsonic(`
Name,Color,Size
foo,red,10
bar,green,20
zed,blue,30
`, { log: -1 }))

let { Jsonic, util, Debug } = require('..')

let j = Jsonic.make()
  .use(function dive(jsonic) {
    jsonic.options({
      fixed: {
        token: {
          // TODO: disambig by moving FixedMatcher later
          '#DOT': '.',
        },
      },
    })

    let { DOT, CL } = jsonic.token
    let { KEY } = jsonic.tokenSet

    jsonic
      .rule('pair', (rs) => {
        rs.open([{ s: [KEY, DOT], b: 2, p: 'dive' }])
      })
      .rule('dive', (rs) => {
        rs.open([
          {
            s: [KEY, DOT],
            p: 'dive',
            a: (r) => {
              r.parent.node[r.o0.val] = r.node = {}
            },
          },
          {
            s: [KEY, CL],
            p: 'val',
            u: { dive_end: true },
          },
        ]).bc((r) => {
          if (r.use.dive_end) {
            r.node[r.o0.val] = r.child.node
          }
        })
      })
  })
  .use(Debug, { trace: true })

console.log(j.debug.describe())

console.log(
  j(
    `
{
  a: 1
  b.c: 2
  d: 3
  e: 4.5
}
`,
    { log: -1 },
  ),
)

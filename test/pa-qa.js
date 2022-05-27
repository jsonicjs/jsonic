module.exports = function PaQa(jsonic, popts) {
  jsonic.options({
    value: {
      map: {
        [popts.s || 'Q']: { val: popts.q },
      },
    },
  })
}

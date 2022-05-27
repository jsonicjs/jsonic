module.exports = function p0(jsonic, popts) {
  jsonic.options({
    value: {
      map: {
        [popts.s || 'X']: { val: popts.x },
      },
    },
  })
}

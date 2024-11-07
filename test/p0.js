module.exports = function p0(jsonic, popts) {
  jsonic.options({
    value: {
      def: {
        [popts.s || 'X']: { val: popts.x },
      },
    },
  })
}

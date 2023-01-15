module.exports = function PaQa(jsonic, popts) {
  jsonic.options({
    value: {
      def: {
        [popts.s || 'Q']: { val: popts.q },
      },
    },
  })
}

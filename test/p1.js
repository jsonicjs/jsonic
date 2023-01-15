module.exports = {
  default: function p1(jsonic, popts) {
    jsonic.options({
      value: {
        def: {
          [popts.s || 'Y']: { val: popts.y },
        },
      },
    })
  },
}

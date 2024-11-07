module.exports = {
  p2: (jsonic, popts) => {
    jsonic.options({
      value: {
        def: {
          [popts.s || 'Z']: { val: popts.z },
        },
      },
    })
  },
}

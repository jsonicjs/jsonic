module.exports = {
  p2: (jsonic, popts) => {
    jsonic.options({
      value: {
        map: {
          [popts.s || 'Z']: { val: popts.z },
        },
      },
    })
  },
}

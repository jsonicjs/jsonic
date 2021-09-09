module.exports = {
  default: function p1(jsonic, popts) {
    jsonic.options({
      value: {
        map: {
          [popts.s||'Y']: { val: popts.y }
        }
      }
    })
  }
}

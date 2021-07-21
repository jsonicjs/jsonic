module.exports = function angle(jsonic) {
  jsonic.options({
    fixed: {
      token: {
        '#OB': '<',
        '#CB': '>',
      }
    }
  })
}

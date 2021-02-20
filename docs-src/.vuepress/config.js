module.exports = {
  title: 'Jsonic',
  description: "A JSON parser for Node.js that isn't strict.",
  dest: 'docs',
  evergreen: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Reference', link: '/ref/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Community', link: '/community/' },
      { text: 'Github', link: 'https://github.com/rjrodger/jsonic' }
    ],
    sidebar: {
      '/ref/': ['usage', 'api','options','syntax']
    }
  }
}

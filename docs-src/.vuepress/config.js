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
      '/ref/': [
        'api',
        'options',
        'syntax'
      ],
      '/guide/': [
        'install',
        'getting-started',
        'syntax-introduction',
        'custom-parsers',
        'tutorials',
      ],
    }
  }
}

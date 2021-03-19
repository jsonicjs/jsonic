module.exports = {
  title: 'Jsonic',
  description: "A JSON parser for Node.js that isn't strict.",
  dest: 'docs',
  evergreen: true,

  head: [
    [
      'link',
      {
        rel: 'stylesheet',
        href: '/railroad-diagrams.css'
      }
    ]
  ],

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Reference', link: '/ref/' },
      { text: 'Plugins', link: '/plugin/' },
      { text: 'Community', link: '/community/' },
      { text: 'Github', link: 'https://github.com/jsonicjs/jsonic' }
    ],
    sidebar: {
      '/ref/': [
        'api',
        'options',
        'syntax',
      ],
      '/guide/': [
        'install',
        'getting-started',
        'syntax-introduction',
        'alternatives',
        'custom-parsers',
        'tutorials',
      ],
      '/plugin/': [
        {
          title: 'Builtin Plugins',
          path: '#builtin-plugins',
          children: [
            'native',
            'csv',
          ],
        },

        {
          title: 'Standard Plugins',
          path: '#standard-plugins',
          children: [
            'foo'
          ],
        },


        {
          title: 'Community Plugins',
          path: '#community-plugins',
          children: [
            'bar'
          ],
        },

      ],
    }
  }
}

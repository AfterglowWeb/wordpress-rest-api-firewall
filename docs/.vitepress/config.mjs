import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WordPress Application Layer',
  description: 'A secure, extensible REST API layer for WordPress. Isolate, filter, and extend the WordPress REST API for headless and multi-application architectures.',

  head: [
    ['meta', { name: 'theme-color', content: '#1565c0' }],
  ],

  themeConfig: {
    siteTitle: 'Application Layer',

    nav: [
      { text: 'Overview', link: '/presentation' },
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Docs',
        items: [
          { text: 'Applications', link: '/applications/applications' },
          { text: 'Auth & Rate Limit', link: '/users/users' },
          { text: 'Properties & Models', link: '/models/models' },
          { text: 'Collections', link: '/collections/collections' },
          { text: 'Automations', link: '/automations/automations' },
          { text: 'Webhooks', link: '/webhooks/webhooks' },
          { text: 'Emails', link: '/mails/mails' },
        ],
      },
      { text: 'GitHub', link: 'https://github.com/AfterglowWeb/wordpress-rest-api-firewall', target: '_blank' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Application Layer?', link: '/presentation' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Free',
        items: [
          { text: 'Auth & Rate Limiting', link: '/users/users' },
          { text: 'Properties & Models', link: '/models/models' },
        ],
      },
      {
        text: 'Pro',
        items: [
          { text: 'Applications', link: '/applications/applications' },
          { text: 'Collections', link: '/collections/collections' },
          { text: 'Automations', link: '/automations/automations' },
          { text: 'Webhooks', link: '/webhooks/webhooks' },
          { text: 'Emails', link: '/mails/mails' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AfterglowWeb/wordpress-rest-api-firewall' },
    ],

    editLink: {
      pattern: 'https://github.com/AfterglowWeb/wordpress-rest-api-firewall/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the GPL-2.0-or-later License.',
      copyright: 'Copyright © 2024-present Cédric Moris Kelly',
    },

    search: {
      provider: 'local',
    },
  },
})

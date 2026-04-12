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
      {
        text: 'Docs',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Applications', link: '/applications/applications' },
          { text: 'Auth & Rate Limiting', link: '/users/users' },
          { text: 'Auth Hardening', link: '/login-hardening/login-hardening' },
          { text: 'WordPress Mode', link: '/wordpress-mode/wordpress-mode' },
          { text: 'Migration & Fallback', link: '/migration/migration' },
          { text: 'Properties & Models', link: '/models/models' },
          { text: 'Settings Route', link: '/settings/settings' },
          { text: 'Routes & Exposure', link: '/routes/routes' },
          { text: 'Global IP Filtering', link: '/global-ip-filtering/global-ip-filtering' },
          { text: 'IP Filtering (per-application)', link: '/ipsfilter/ipsfilter' },
          { text: 'Collections', link: '/collections/collections' },
          { text: 'Automations', link: '/automations/automations' },
          { text: 'Webhooks', link: '/webhooks/webhooks' },
          { text: 'Emails', link: '/mails/mails' },
          { text: 'Hooks & Filters', link: '/hooks' },
          { text: 'Global Security', link: '/global-security/global-security' },
          { text: 'Theme', link: '/theme/theme' },
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
          { text: 'Auth Hardening', link: '/login-hardening/login-hardening' },
          { text: 'Properties & Models', link: '/models/models' },
          { text: 'Routes & Exposure Control', link: '/routes/routes' },
          { text: 'Global IP Filtering', link: '/global-ip-filtering/global-ip-filtering' },
          { text: 'Global Security', link: '/global-security/global-security' },
          { text: 'Hooks & Filters', link: '/hooks' },
        ],
      },
      {
        text: 'Pro',
        items: [
          { text: 'Applications', link: '/applications/applications' },
          { text: 'WordPress Mode', link: '/wordpress-mode/wordpress-mode' },
          { text: 'Migration & Fallback', link: '/migration/migration' },
          { text: 'Auth & Rate Limiting', link: '/users/users' },
          { text: 'IP Filtering (per-application)', link: '/ipsfilter/ipsfilter' },
          { text: 'Routes Policy (per-route)', link: '/routes/routes' },
          { text: 'Settings Route', link: '/settings/settings' },
          { text: 'Collections', link: '/collections/collections' },
          { text: 'Automations', link: '/automations/automations' },
          { text: 'Webhooks', link: '/webhooks/webhooks' },
          { text: 'Emails', link: '/mails/mails' },
          { text: 'Theme', link: '/theme/theme' },
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

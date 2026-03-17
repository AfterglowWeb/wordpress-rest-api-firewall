# WordPress Application Layer

📖 **[Documentation](https://wordpress-application-layer.abc-plugins.com)**

WordPress Application Layer is a plugin that sits between the WordPress REST API and your client applications. It lets you control exactly what data is exposed, who can access it, how it is shaped, and at what rate — without touching WordPress core or your theme.

Beyond REST API responses, the plugin can **drive your front-end entirely through webhooks**: WordPress events (post publish, user register, WooCommerce order, custom CRON…) push data to your application in real time using the same schema as the REST API. You can combine both approaches or rely solely on webhooks to feed your application.

Designed for **headless WordPress** architectures, **multi-application** setups, **event-driven** delivery, and sites that need **REST API security hardening**.

> **Alpha version**
> This plugin is under active development. Most documented features are implemented and functional — some are still being finalized. Architectural changes may still occur.
> It is publicly available for testing and feedback. Stability is not yet guaranteed.

## Free Features

| Feature | Description |
|---|---|
| **Authentication** | WordPress Application Password (hardened to a single authorised user) and JWT. OAuth requires Pro |
| **Rate Limiting** | Global request quotas with configurable time windows |
| **IP Filtering** | Automatic and manual IP blacklisting. The plugin detects repeated violations and adds offenders automatically. IPv4 only — no CIDR, no country blocking. Read-only GeoIP stats available |
| **Routes** | Enforce auth and rate limiting globally. Disable the default `/users` routes to prevent user enumeration |
| **Properties & Models** | Apply sitewide response transforms: resolve attachments, terms & authors, flatten rendered fields, remove domain from URLs. Rules apply globally across all routes — individual property control requires Pro |
| **WordPress Security** | Disable XML-RPC, comments, RSS. Secure files, enforce security headers |
| **Webhook** | Single outbound webhook with event triggers |
| **Hooks API** | Every option exposes a WordPress filter for customisation |

## Pro Features

| Feature | Description |
|---|---|
| **Applications** | Isolate all settings per client — auth, routes, data, webhooks |
| **IP Filtering** | Both whitelist and blacklist modes. Whitelist restricts access to allowed origins only. Blacklist with configurable retention. CIDR range support. Block or allow by country (GeoIP) |
| **Collections** | Enforce per-page limits and drag-and-drop sort order |
| **Routes Policy** | Per-route method control, user assignment, rate limiting and redirections |
| **Properties & Models** | Disable, rename or remap any individual property. Remove empty properties. Build fully custom JSON schemas |
| **Automations** | Event-driven workflows with conditions and chained actions |
| **Multiple Webhooks** | Unlimited outbound webhooks, scoped per application |
| **Email Templates** | Transactional email templates with SMTP configuration, per application |
| **Settings Route** | Schema editor for `/wp/v2/settings` — ACF options pages and resolved WordPress menus |
| **Logs** | Full request history and audit trail |

## Free vs Pro

| Feature | Free | Pro |
|---|:---:|:---:|
| REST API route explorer | ✅ | ✅ |
| Authentication & Rate Limiting | ✅ | ✅ |
| Properties & Models (sitewide transforms) | ✅ | ✅ |
| Routes: global method / post-type / taxonomy disable | ✅ | ✅ |
| WordPress Security Hardening | ✅ | ✅ |
| Webhook (single, post lifecycle events) | ✅ | ✅ |
| Hooks & Filters API | ✅ | ✅ |
| Multiple Applications | — | ✅ |
| IP Filtering (blacklist) | ✅ | ✅ |
| IP Filtering whitelist + CIDR + country blocking | — | ✅ |
| Collections & Sort Order | — | ✅ |
| Properties & Models (per-property control + custom schemas) | — | ✅ |
| Settings Route schema editor (ACF options, menus) | — | ✅ |
| Per-Route Policy (per-route disable, redirect, user restriction) | — | ✅ |
| Automations | — | ✅ |
| Multiple Webhooks (unlimited, per application) | — | ✅ |
| Email Templates | — | ✅ |
| Request Logs & Audit Trail | — | ✅ |

## How does it work?

WordPress Application Layer operates exclusively within REST API contexts. Admin-authenticated requests are forwarded untouched, so it never interferes with the WordPress admin or other plugins.

**REST API request pipeline:**

```
Incoming REST request
       │
       ▼
┌─────────────────────────┐
│  Application Matching   │  ← Which application owns this request? (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Authentication Check   │  ← JWT / WP App Passwords (OAuth: Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│    IP / Rate Limiting   │  ← Per-user or global quotas, GeoIP blocking (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│    Routes Policy        │  ← Allowed methods, route-level rules (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  WordPress REST API     │  ← Native WP handler
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Property Transforms    │  ← Models: rename, remove, resolve, remap fields
└────────────┬────────────┘
             │
       REST Response
```

Alongside this pipeline, webhooks and email notifications run independently. Any WordPress event (post transitions, user actions, WooCommerce hooks, custom CRON, REST API hits) can trigger an outbound webhook and/or an email notification — scoped per application in Pro.


## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

### 1. Download or clone this repository into your `wp-content/plugins/` directory

```bash
cd wp-content/plugins/
git clone https://github.com/AfterglowWeb/wordpress-rest-api-firewall.git rest-api-firewall
```

### 2. Install the dependencies and build

Navigate to the `wp-content/plugins/rest-api-firewall` directory:

```bash
cd wp-content/plugins/rest-api-firewall
```

Install the PHP dependencies and build:

```bash
composer install
composer build
```

Install the JavaScript dependencies and build:

```bash
npm install
npm run build
```

or

```bash
yarn
yarn build
```

### 3. Activate the plugin through the WordPress admin

### 4. Optional: install the headless theme bundled with the plugin

Navigate to the **Wordpress Application Layer** admin page, open the `Theme Options` tab, and click **Deploy**.

## Roadmap

Current: 0.1.0-alpha.17

| Version | Milestone |
|---------|-----------|
| 1.0.0 | Stable release |
| 0.1.0-beta.1x | Documentation |
| 0.1.0-alpha.3x | Linting and testing (PHPUnit, Jest) |
| 0.1.0-alpha.2x | Migration from JavaScript to TypeScript |
| 0.1.0-alpha.1x | Features integration |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

GPL-2.0-or-later

## Credits

This project originated as a fork of a headless WordPress theme commissioned by a PR firm. It underwent major refactoring to adopt a plugin architecture, though the theme functionality has been preserved as a bundled extension.

# WordPress Application Layer

![Routes explorer and per-route settings](docs/public/wordpress-application-layer-routes.webp)

📖 **[Documentation](https://wal.abc-plugins.com)**

WordPress Application Layer sits between WordPress and your client applications.

It lets you control what data is exposed, who can access it, how it is shaped, and at what rate, while also hardening key WordPress surfaces such as login and IP access.

Beyond REST API responses, it can also **drive your front-end through webhooks**. WordPress events (post publish, user register, WooCommerce order, custom CRON...) can push data to your application in real time using the same schema as the REST API.

You can combine both approaches, or rely on webhooks only.

Designed for **headless WordPress** architectures, **multi-application** setups, **event-driven** delivery, and sites that need **security hardening across both REST API and WordPress surfaces**.

> **Alpha version**
> This plugin is under active development. Most documented features are implemented and functional — some are still being finalized. Architectural changes may still occur.
> It is publicly available for testing and feedback. Stability is not yet guaranteed.

## Core Capabilities

**Secure Your WordPress** — The first REST API firewall purpose-built for WordPress. IP filtering, rate limiting, login hardening, XML-RPC protection, file security, HTTP security headers. One unified security layer for the REST API and the entire WordPress platform.

**Isolate Multiple Applications** — Serve 10 different clients from one WordPress backend. Each application gets its own authentication context, custom data view, isolated webhooks, and independent rate limits. Complete isolation. True multi-tenancy.

**Shape Data Your Way** — Design custom REST API responses without code. Drag-and-drop property controls inspired by Firebase. Rename, resolve, remove, and remap fields. Free for global transforms; Pro adds per-property control and fully custom JSON schemas.

**Automate Everything End-to-End** — Chain complex workflows: WordPress events → automations → webhooks → external services → incoming webhooks → WordPress. No code required, no external services needed.

## Free Features

| Feature | Description |
|---|---|
| **Authentication** | JWT and hardened WordPress Application Passwords (scoped to single authorized user) |
| **Per-User Rate Limiting** | Configurable request quotas with auto-blacklist on violations |
| **Auth Hardening** | Login form protection: rate limiting, brute-force prevention, configurable lockout |
| **Global IP Filtering** | Manual IPv4/IPv6 blacklisting, auto-blacklist on rate limit violations, read-only GeoIP stats |
| **Routes Control** | Enforce authentication globally, disable sensitive routes (`/users`, `/settings`), explore all routes with per-route test buttons |
| **Response Transforms** | Sitewide rules: resolve embedded data, flatten rendered fields, strip WordPress domain from URLs |
| **WordPress Security** | Disable XML-RPC, comments, pingbacks, RSS; enforce security headers; secure file permissions |
| **Webhook** | Single outbound webhook with customizable event triggers |
| **Hooks & Filters API** | Extend every feature with WordPress filters for customization |

## Pro Features

| Feature | Description |
|---|---|
| **Multi-Application Isolation** | Serve multiple clients with independent auth contexts, IP rules, webhooks, and logs |
| **Unlimited Users per Application** | No user limits per application instance |
| **WordPress Mode** | "Application Only Mode" enforces headless-only access; trusted IPs bypass restrictions; emergency reset token enables lockout recovery |
| **Advanced IP Filtering** | CIDR ranges, country-level blocking (GeoIP), configurable retention, per-application IP whitelisting and origin restrictions |
| **Per-Route Policies** | Control each route individually: restrict by HTTP method, user, IP, or origin; set custom responses; disable without breaking other plugins |
| **Per-Route Test Buttons** | Explore and debug each route with request/response inspection |
| **Per-Property Control** | Disable, rename, or remap individual JSON properties; remove empty properties; strip embedded data |
| **Custom JSON Schemas** | Build completely custom response schemas from scratch; map existing fields or add static data |
| **Settings Route Editor** | Customize `/wp/v2/settings` to include ACF options pages, WordPress menus, and custom fields |
| **Event-Driven Automations** | Chain WordPress events (post transitions, WooCommerce orders, security events) with conditions and multiple webhook/email actions |
| **Unlimited Webhooks** | Unlimited outbound webhooks per application; incoming webhook endpoints trigger automations via HMAC-signed requests |
| **Email Templates & SMTP** | Transactional email templates with per-application SMTP configuration |
| **Collections** | Enforce per-page limits, customize sort order, and organize content per application |
| **Request Logs & Audit Trail** | Full queryable logs with graphs and data exports |
| **Import & Export** | Backup and replicate application settings across environments |

## Free vs Pro

| Feature | Free | Pro |
|---|:---:|:---:|
| REST API route explorer | ✅ | ✅ |
| Per-route test button | ✅ | ✅ |
| Authentication (JWT & App Passwords) | ✅ | ✅ |
| Per-user rate limiting | ✅ | ✅ |
| Auth hardening (login protection) | ✅ | ✅ |
| Global IP filtering (blacklist) | ✅ | ✅ |
| Response transforms (sitewide) | ✅ | ✅ |
| WordPress security hardening | ✅ | ✅ |
| Single webhook with event triggers | ✅ | ✅ |
| Hooks & Filters API | ✅ | ✅ |
| Multiple applications | — | ✅ |
| Unlimited users per application | — | ✅ |
| IP filtering (whitelist + CIDR + country blocking) | — | ✅ |
| WordPress Mode (application-only, trusted IPs, emergency reset) | — | ✅ |
| Per-route policies (disable, redirect, user/IP/origin restrictions) | — | ✅ |
| Per-property control (disable, rename, remap) | — | ✅ |
| Custom JSON schemas | — | ✅ |
| Settings route editor (ACF options, custom fields) | — | ✅ |
| Event-driven automations | — | ✅ |
| Unlimited webhooks per application | — | ✅ |
| Incoming webhooks (external triggers) | — | ✅ |
| Email templates & SMTP | — | ✅ |
| Collections with sort order | — | ✅ |
| Request logs & audit trail | — | ✅ |
| Import & export | — | ✅ |

## See How It Works

WordPress Application Layer centers on REST API policy and response control, and also includes WordPress-wide protections such as global IP filtering and login hardening. Admin-authenticated requests are forwarded untouched where relevant, so normal WordPress administration workflows remain intact.

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

## Install in 4 Steps

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
yarn
yarn build
```

Optional architecture checks (recommended before major merges):

```bash
yarn graph:lint
composer graph:php
```

### 3. Activate the plugin through the WordPress admin

### 4. Optional: install the headless theme bundled with the plugin

Navigate to the **WordPress Application Layer** admin page, open the `Theme Options` tab, and click **Deploy**.

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

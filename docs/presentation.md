# What is WordPress Application Layer?

WordPress Application Layer sits between the WordPress REST API and your client applications.

It lets you control what data is exposed, who can access it, how it is shaped, and at what rate, without touching WordPress core or your theme.

Beyond REST API responses, it can also **drive your front-end through webhooks**. WordPress events (post publish, user register, WooCommerce order, custom CRON...) can push data to your application in real time using the same schema as the REST API.

You can combine both approaches, or rely on webhooks only.

It is designed for:
- **Headless WordPress** architectures (Next.js, Nuxt, SvelteKit, React, Vue, mobile apps)
- **Multi-application** setups where multiple clients share one WordPress back-end
- **Event-driven** architectures fed by webhooks instead of, or alongside, pull-based REST calls
- Any site that needs **security hardening** at the REST API layer

---

## Understand the Architecture

The plugin operates exclusively within REST API contexts. Admin-authenticated requests are forwarded untouched, so it never interferes with the WordPress admin or other plugins.

**REST API request pipeline:**

```
Incoming REST request
       │
       ▼
┌─────────────────────────┐
│  Global IP Filtering    │  ← Shared blocklist: IPs, CIDRs, countries (free + Pro)
└────────────┬────────────┘
             │  blocked → 403
             ▼
┌─────────────────────────┐
│  Application Matching   │  ← Which application owns this request? (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Authentication Check   │  ← JWT / WP App Passwords
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  IP / Rate Limiting     │  ← Per-app IP blocks, per-user quotas, GeoIP (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│    Routes Policy        │  ← Allowed methods, route-level rules (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  WordPress REST API     │  ← Native WP handler
└────────────┘────────────┘
             │
┌────────────▼────────────┐
│  Property Transforms    │  ← Models: rename, remove, resolve, remap fields
└────────────┬────────────┘
             │
       REST Response
```

Alongside this pipeline, **webhooks and email notifications** run independently of REST requests. Any WordPress event (post transitions, user actions, WooCommerce hooks, custom CRON, REST API hits) can trigger an outbound webhook and/or an email notification — scoped per application in Pro.

The flow also works in reverse: **incoming webhooks** let external services push events into WordPress and trigger automations directly (Pro).

**Outbound (push) pipeline:**

```
WordPress Event (post publish, order created, cron, …)
       │
       ▼
┌─────────────────────────┐
│  Automation / Trigger   │  ← Conditions, chained actions (Pro)
└────────────┬────────────┘
             │
       ┌─────┴──────┐
       ▼            ▼
┌────────────┐  ┌────────────┐
│  Webhook   │  │   Email    │
│  (push)    │  │ Notification│
└────────────┘  └────────────┘
```

**Incoming (pull) pipeline:** <span style="display:inline-block;padding:1px 6px;border-radius:3px;background:#1565c0;color:#fff;font-size:10px;font-weight:600">PRO</span>

```
External Service (Stripe, GitHub, CRM, IoT, …)
       │  POST + HMAC signature
       ▼
┌─────────────────────────┐
│  Incoming Webhook URL   │  ← Unique endpoint per entry, signature verified
└────────────┬────────────┘
             │  valid → fire automation
             ▼
┌─────────────────────────┐
│  Automation / Trigger   │  ← Payload fields available in conditions & actions
└────────────┬────────────┘
             │
       ┌─────┴──────┐
       ▼            ▼
┌────────────┐  ┌────────────┐
│  Webhook   │  │   Email    │
│  (push)    │  │ Notification│
└────────────┘  └────────────┘
```

---

## Explore Free Features

| Feature | Description |
|---|---|
| **Authentication** | WordPress Application Password (hardened to a single authorized user) and JWT |
| **Rate Limiting** | Global request quotas with configurable time windows |
| **Global IP Filtering** | Shared blocklist that runs before application resolution. Manual IPv4 blacklisting. Auto-blacklist from rate limit violations. Read-only GeoIP stats. CIDR ranges and country blocking require Pro |
| **Routes** | Enforce auth and rate limiting globally. Disable the default `/users` routes to prevent user enumeration |
| **Properties & Models** | Apply sitewide response transforms: resolve attachments, terms & authors, flatten rendered fields, remove domain from URLs. Rules apply globally across all routes — individual property control (disable, rename, remap) requires Pro |
| **WordPress Security** | Disable XML-RPC, comments, RSS. Secure files, security headers |
| **Webhook** | Single outbound webhook with event triggers |
| **Hooks API** | Every option exposes a WordPress filter for customisation |

## Explore Pro Features

| Feature | Description |
|---|---|
| **Applications** | Isolate all settings per client — auth, routes, data, webhooks |
| **Global IP Filtering (Pro additions)** | CIDR range support, country blocking via GeoIP, and configurable retention time on top of the free blocklist |
| **Per-App IP Filtering** | Application-scoped blocking layered on top of the global check (Pro only — requires Applications) |
| **Collections** | Enforce per-page limits and drag-and-drop sort order |
| **Routes Policy** | Per-route method control, user assignment, rate limiting and redirections. Safely disable any route with fine-grained per-application rules (avoids breaking unrelated plugin requests) |
| **Properties & Models** | Disable, rename or remap any individual property. Remove empty properties to lighten responses. Build fully custom JSON schemas from scratch — map existing fields and add new static ones |
| **Automations** | Event-driven workflows with conditions and chained actions |
| **Multiple Webhooks** | Unlimited outbound webhooks, scoped per application. Incoming webhooks let external services trigger automations via a signed endpoint |
| **Email Templates** | Transactional email templates with SMTP configuration, scoped per application |
| **Settings Route** | Schema editor for `/wp/v2/settings` — include ACF options pages and resolved WordPress menus, shaped with per-property control or custom schema |
| **Logs** | Full request history and audit trail |

---

## Requirements

- WordPress 6.0+
- PHP 7.4+

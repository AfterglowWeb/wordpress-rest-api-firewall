# What is WordPress Application Layer?

WordPress Application Layer is a plugin that sits between the WordPress REST API and your client applications. It lets you control exactly what data is exposed, who can access it, how it is shaped, and at what rate — without touching WordPress core or your theme.

It is designed for:
- **Headless WordPress** architectures (Next.js, Nuxt, SvelteKit, React, Vue, mobile apps)
- **Multi-application** setups where multiple clients share one WordPress back-end
- Any site that needs **security hardening** at the REST API layer

---

## Architecture

The plugin operates exclusively within REST API contexts. Admin-authenticated requests are forwarded untouched, so it never interferes with the WordPress admin or other plugins.

```
Incoming REST request
       │
       ▼
┌─────────────────────────┐
│  Application Matching   │  ← Which application owns this request? (Pro)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Authentication Check   │  ← JWT / OAuth / WP App Passwords
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

---

## Free Features

| Feature | Description |
|---|---|
| **Authentication** | Enforce JWT or OAuth token auth on REST requests |
| **Rate Limiting** | Per-user request quotas with configurable windows |
| **Properties & Models** | Transform REST responses server-side |
| **WordPress Security** | Disable XML-RPC, comments, RSS, secure files & headers |
| **Webhook** | Single outbound webhook with event triggers |
| **Hooks API** | Every option exposes a WordPress filter for customisation |

## Pro Features

| Feature | Description |
|---|---|
| **Applications** | Isolate all settings per client — auth, routes, data, webhooks |
| **IP Filtering** | Whitelist/blacklist by IP, CIDR, or country (GeoIP) |
| **Collections** | Enforce per-page limits and drag-and-drop sort order |
| **Routes Policy** | Per-route method control, user assignment, redirections |
| **Automations** | Event-driven workflows with conditions and chained actions |
| **Multiple Webhooks** | Unlimited outbound webhooks, scoped per application |
| **Email Templates** | Transactional email templates with SMTP configuration |
| **Logs** | Full request history and audit trail |

---

## Requirements

- WordPress 6.0+
- PHP 7.4+
- Node.js 18+ *(build only)*

---
layout: home

hero:
  name: "WordPress Application Layer"
  text: "WordPress as a modern application backend."
  tagline: "Decide what data is exposed, who can access it, and how it is shaped. Self-hosted, open-source, built for developers who are done rebuilding the same things from scratch."
  image:
    src: /wordpress-application-layer-applications-1-tab.webp
    alt: WordPress Application Layer admin interface
  actions:
    - theme: brand
      text: Get Started
      link: /presentation
    - theme: alt
      text: View on GitHub
      link: https://github.com/AfterglowWeb/wordpress-rest-api-firewall

features:
  - icon: 🔐
    title: Authentication & Rate Limiting
    details: Authenticate clients with WordPress Application Password (hardened to a single authorised user) or JWT. Set per-user request quotas with configurable time windows. Auto-blacklist IPs that exceed thresholds — no third-party service required.
    link: /users/users
    linkText: Learn more

  - icon: 🗂️
    title: Properties & Models
    details: Apply sitewide response transforms for free — resolve embedded terms, authors & attachments, flatten rendered fields, strip domain from URLs. Pro adds per-property disable, rename and remap, plus fully custom JSON schemas.
    link: /models/models
    linkText: Learn more

  - icon: 🔍
    title: Routes & Exposure Control
    details: Browse every REST API route and its schema from the admin. Globally disable HTTP methods, post types, or taxonomies from the API. Pro adds per-route policy — disable or redirect individual routes, restrict them to specific users, and apply fine-grained rate limits per endpoint.
    link: /routes/routes
    linkText: Learn more

  - icon: 🛡️
    title: WordPress Security Hardening
    details: Disable XML-RPC, comments, pingbacks, RSS feeds, and the theme editor. Secure file permissions, protect the uploads directory, and enforce HTTP security headers — all in one place.
    link: /global-security
    linkText: Learn more

  - icon: 📦
    title: Multi-Application Isolation
    details: Serve a corporate website, a mobile app, and an e-commerce store from one WordPress installation — each with its own authentication context, data view, rate limit, and webhook configuration.
    link: /applications/applications
    linkText: Learn more (Pro)

  - icon: ⚡
    title: Event-Driven Automations
    details: Chain actions on WordPress lifecycle events — send emails, trigger webhooks, fire custom hooks — with optional conditions. No code required, no external automation service needed.
    link: /automations/automations
    linkText: Learn more (Pro)
---

<div class="vp-doc home-extra">

## Own your stack. Own your data.

SaaS CMSes are convenient until they are not — pricing changes, data lives on someone else's server, and migrating out is painful. WordPress has powered the open web for 20 years. **Application Layer gives it the application infrastructure it was always missing.**

Authentication, data shaping, API scoping, event automation, security hardening: the features you have been assembling from a dozen plugins on every project, now in one coherent layer — with a clean admin UI, a full hooks API, and zero vendor lock-in.

---

## Built for real development workflows

<div class="pillars-grid">

<div class="pillar-card">

### Control what you expose

WordPress exposes a lot by default — user data, internal meta, raw field structures. Application Layer lets you audit every route, globally disable HTTP methods, post types or taxonomies, and in Pro, decide field by field what leaves your server.

</div>

<div class="pillar-card">

### Shape data for your front-end

Stop massaging responses client-side. Apply sitewide transforms for free: resolve embedded terms, flatten rendered wrappers, strip domain from URLs. Pro adds per-property rename, remap, and fully custom schemas.

</div>

<div class="pillar-card">

### Isolate clients from each other

One WordPress installation. Multiple applications — each with its own auth method, data view, rate limit, and secret. The same content, safely served to different consumers.

</div>

<div class="pillar-card">

### Self-host with confidence

No subscription required for the core feature set. No telemetry. No external dependency. Your WordPress, your server, your rules.

</div>

</div>

---

## Use Cases

<div class="use-cases-grid">

<div class="use-case-card">

### Headless CMS

Use WordPress as the content back-end for a React, Next.js, Nuxt, or mobile app. Enforce authentication, transform responses to match your front-end schema, and keep WordPress internals invisible to consumers.

</div>

<div class="use-case-card">

### Replace your SaaS CMS

Self-host your content infrastructure. Keep editorial teams on a familiar interface while giving developers a clean, controlled API — without recurring costs or third-party data custody.

</div>

<div class="use-case-card">

### Multi-Tenant Applications

Serve multiple client applications from a single WordPress back-end. Isolate authentication, content views, and rate limits per application — each client sees only what they are entitled to.

</div>

<div class="use-case-card">

### Multilingual Distribution

Serve content in multiple languages across separate websites or applications, each with its own REST API scope, response schema, and delivery configuration.

</div>

</div>

---

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
| Global IP Filtering (shared blocklist, runs before app resolution) | ✅ | ✅ |
| Global IP Filtering: CIDR ranges + country blocking | — | ✅ |
| Per-Application IP Filtering (additional app-scoped blocks) | ✅ | ✅ |
| Per-Application IP Filtering: CIDR + country blocking + retention time | — | ✅ |
| Collections & Sort Order | — | ✅ |
| Properties & Models (per-property control + custom schemas) | — | ✅ |
| Settings Route schema editor (ACF options, menus) | — | ✅ |
| Per-Route Policy (per-route disable, redirect, user restriction) | — | ✅ |
| Automations | — | ✅ |
| Multiple Webhooks (unlimited, per application) | — | ✅ |
| Email Templates | — | ✅ |
| Request Logs & Audit Trail | — | ✅ |

---

## Roadmap

The next modules in development:

<div class="roadmap-grid">

<div class="roadmap-card">
<span class="roadmap-tag">Coming next</span>

**WooCommerce Bridge**

Headless access to WooCommerce — products, cart, checkout, and Stripe/PayPal payments — through the same application security layer.
</div>

<div class="roadmap-card">
<span class="roadmap-tag">Coming next</span>

**Forms Bridge**

Secure form submission endpoints with entry management, configurable data retention, GDPR options, and AES-256 encryption. Compatible with WPForms and Contact Form 7.
</div>

<div class="roadmap-card">
<span class="roadmap-tag">Planned</span>

**Site Import / Export**

Cherry-pick content and configuration to sync, migrate, or replicate between WordPress installations through the REST API — powered by the same field mapping already in Models.
</div>

<div class="roadmap-card">
<span class="roadmap-tag">Planned</span>

**Editorial Workflow**

Authors scoped to their own posts and media. Validation workflows, co-authoring, post duplication, post type conversion, and multi-author taxonomies — for production editorial teams.
</div>

<div class="roadmap-card">
<span class="roadmap-tag">Planned</span>

**Static Pages & Custom URLs**

Spin up static landing pages on any domain directly from WordPress. Choose any URL pattern for posts and pages — free from WordPress's default URL constraints.
</div>

<div class="roadmap-card">
<span class="roadmap-tag">Planned</span>

**Database Encryption**

An optional encryption layer for sensitive data stored in `wp_options` and custom tables — transparent to the application.
</div>

</div>

---

## Screenshots

<div class="screenshots-grid">
  <figure>
    <img src="/wordpress-application-layer-auth-rate-limit-tab.webp" alt="Auth and Rate Limiting tab" />
    <figcaption>Auth & Rate Limiting</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-applications-1-tab.webp" alt="Applications list" />
    <figcaption>Applications List</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-applications-2-tab.webp" alt="Create Application" />
    <figcaption>New Application</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-ip-filters-tab.webp" alt="IP Filters" />
    <figcaption>IP Filtering</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-collections-tab.webp" alt="Collections" />
    <figcaption>Collections</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-properties-tab.webp" alt="Properties" />
    <figcaption>Properties & Models</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-routes-tab.webp" alt="Routes" />
    <figcaption>Routes Policy</figcaption>
  </figure>
  <figure>
    <img src="/wordpress-application-layer-webhook-tab.webp" alt="Webhooks" />
    <figcaption>Webhooks</figcaption>
  </figure>
</div>

</div>

<style>
.home-extra {
  max-width: 1152px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.home-extra h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.home-extra > p {
  font-size: 15px;
  color: var(--vp-c-text-2);
  max-width: 700px;
  line-height: 1.75;
  margin: 0 0 48px;
}

.pillars-grid,
.use-cases-grid,
.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 24px 0 56px;
}

.pillar-card,
.use-case-card,
.roadmap-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px 24px;
}

.pillar-card h3,
.use-case-card h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px;
  border: none;
  padding: 0;
}

.pillar-card p,
.use-case-card p {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.65;
}

.roadmap-card {
  position: relative;
  font-size: 14px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.roadmap-card strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 6px 0 4px;
}

.roadmap-tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 3px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.screenshots-grid figure {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.screenshots-grid img {
  width: 100%;
  display: block;
}

.screenshots-grid figcaption {
  font-size: 12px;
  color: var(--vp-c-text-2);
  padding: 8px 12px;
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}

.badge-pro {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  background: #1565c0;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  vertical-align: middle;
  margin-left: 4px;
}
</style>

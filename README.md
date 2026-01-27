# REST API Firewall

A WordPress plugin focused exclusively on REST API security and filtering.

REST API Firewall acts as a secure layer for the WordPress REST API by enforcing application password authentication and rate limiting on all routes. Rate-limited IPs are automatically blacklisted.

It integrates seamlessly with external applications built with Next.js, React, Vue, or any framework capable of consuming a REST API. Configure webhooks to notify your application of content changes.

## Free Features

- **Global Authentication** — Enforce WordPress application password authentication on all REST routes
- **Global Rate Limiting** — Protect against abuse with configurable request limits
- **Auto-Blacklist** — Automatically block IPs that exceed rate limits
- **Content Filtering** — Remove WordPress domain from permalinks and media URLs
- **Post Type Control** — Expose only selected post types via REST API
- **Routes Explorer** — Visualize all REST API routes and understand what each plugin exposes

# REST API Firewall Pro

## Security & Access Control
- **IP Filtering** — Whitelist and blacklist with CIDR support
- **Geo IP Blocking** — Automatically block or allow requests by country
- **Per-Route Control** — Fine-grained authentication, rate limiting, and disabling per endpoint
- **Cascade Rules** — Apply settings to child routes automatically

## Multi-Site & Multi-App
- **Multiple Applications** — Manage separate API users and webhooks for different frontends
- **WordPress Multisite** — Native support for network installations
- **Team Dashboards** — Spin off separate admin interfaces for large teams

## Monitoring
- **Activity Logs** — Monitor and export network activity
- **Server Metrics** — Track capacity and performance
- **Notifications** — Alerts via email and webhooks

## Advanced Options
- **Field Mapping** — Remap post fields to custom keys for cleaner API responses
- **Domain Stripping** — Remove all WordPress domain references from API output
- **Headless Theme** — Disable frontend rendering entirely with additional options:
    - Redirect all templates to a page or custom URL
    - Disable Gutenberg site-wide
    - Disable comments site-wide
    - Enable WebP and SVG support
    - Limit upload file sizes
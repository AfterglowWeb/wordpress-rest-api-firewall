# REST API Firewall

A WordPress plugin focused exclusively on REST API security and filtering.

REST API Firewall acts as a secure layer for the WordPress REST API by enforcing application password authentication and rate limiting on all routes. Rate-limited IPs are automatically blacklisted.

It integrates seamlessly with external applications built with Next.js, React, Vue, or any framework capable of consuming a REST API. Configure webhooks to notify your application of content changes.

> **Alpha Version**: This plugin is currently under extensive testing and significant changes may still occur in the code architecture. It is made public to gather feedback and contributions. You are free to test it, but we cannot guarantee its stability and cannot be held responsible for any data loss.

## Requirements

- WordPress 6.0+
- PHP 8.0+

## Installation

1. Download the latest release from GitHub
2. Upload to `/wp-content/plugins/rest-api-firewall`
3. Activate the plugin through the WordPress admin
4. Navigate to **Settings > REST API Firewall** to configure

## Free Features

- **Global Authentication** - Enforce WordPress application password authentication on all REST routes
- **Global Rate Limiting** - Protect against abuse with configurable request limits
- **Auto-Blacklist IPs** - Automatically block IPs that exceed rate limits *(under development)*
- **Content Filtering** - Remove WordPress domain from permalinks and media URLs
- **Post Type Control** - Expose only selected post types via REST API
- **Routes Explorer** - Visualize all REST API routes and understand what each plugin exposes
- **Headless Theme** - Deploy a theme to disable frontend rendering entirely with additional options:
  - Redirect all templates to a page or custom URL
  - Disable Gutenberg site-wide
  - Disable comments site-wide
  - Enable WebP and SVG support
  - Limit upload file sizes

## REST API Firewall Pro

### Security & Access Control
- **IP Filtering** - Whitelist and blacklist with CIDR support
- **Geo IP Blocking** - Automatically block or allow requests by country *(under development)*
- **Per-Route Control** - Fine-grained authentication, rate limiting, and disabling per endpoint
- **Cascade Rules** - Apply settings to child routes automatically

### Multi-Site & Multi-App
- **Multiple Applications** - Manage separate API users and webhooks for different frontends *(under development)*
- **WordPress Multisite** - Native support for network installations
- **Team Dashboards** - Separate admin interfaces for large teams *(under development)*

### Monitoring *(under development)*
- **Activity Logs** - Monitor and export network activity
- **Server Metrics** - Track capacity and performance
- **Notifications** - Alerts via email and webhooks

### Advanced Options *(under development)*
- **Field Mapping** - Remap post fields to custom keys for cleaner API responses
- **Domain Stripping** - Remove all WordPress domain references from API output

## Roadmap

| Version | Milestone |
|---------|-----------|
| 1.0.0 | Stable release |
| 0.1.0-beta.1 | Documentation |
| 0.1.0-alpha.3 | Linting and testing (PHPUnit, Jest) |
| 0.1.0-alpha.2 | Progressive migration from JavaScript to TypeScript |

### Upcoming in Alpha
- UI: Wording and layout improvements
- Auto-blacklist IPs on rate limit
- UI: Test results display, model application results, submit button rationalization

## Changelog

### 0.1.0-alpha.1
- Initial release
- Fork from Blank Headless Theme project
- Major refactoring to plugin architecture

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

GPL-2.0-or-later

## Credits

This project originated as a fork of a headless WordPress theme commissioned by a PR firm. It underwent major refactoring to adopt a plugin architecture, though the theme functionality has been preserved as a bundled extension.

# REST API Firewall — Architecture Reference

## Security Layers

The plugin operates in two tiers (free + pro) and enforces security across multiple layers:

```
Request
  │
  ├─ IP Filtering          (free+pro) — IP/CIDR allow/block lists, public rate limiting
  ├─ Auth Hardening        (free+pro) — brute-force protection, admin login whitelist
  ├─ Route Policy          (free+pro) — per-route auth enforcement, method restrictions
  ├─ Application Layer     (pro only) — per-application scoping of all rules above
  └─ Response              — enforced or passed through
```

---

## Auth Hardening

### Scope
**Global** — applies to all authentication endpoints, free and pro, not per-application.

### What it protects
- `wp-login.php` / `/wp-admin/` admin and customer login
- WP Application Passwords (REST API auth via `authenticate` filter)
- Basic Auth (REST API, same filter chain)
- JWT authentication (via `rest_authentication_errors` filter)

### How it works

**Auth Rate Limiter (`LoginRateLimiter.php`)**

1. On every auth attempt: `authenticate` filter at priority 5. If the requesting IP is in the temporary block transient → return `WP_Error` immediately (before credential check).
2. On auth failure:
   - `wp_login_failed` action → increment failure counter for the IP.
   - `application_password_failed_authentication` action → same counter.
   - `rest_authentication_errors` filter (priority 999, WP_Error result) → same counter.
3. When failure count ≥ `login_rate_limit_attempts` within `login_rate_limit_window` seconds:
   - Set block transient (TTL = `login_rate_limit_blacklist_time`).
   - Increment strike counter.
4. When strike count ≥ `login_rate_limit_promote_after` (and > 0):
   - Insert IP into `{prefix}_rest_api_firewall_ip_entries` as `list_type=global_blacklist`, `entry_type=rate_limit`.
   - IP is now permanently blacklisted — visible and releasable from the IP Filter panel.

**Transients used:**
| Transient | Content | TTL |
|-----------|---------|-----|
| `rest_firewall_login_{hash}` | failure count | `window` seconds |
| `rest_firewall_login_blocked_{hash}` | blocked IP string | `login_rate_limit_blacklist_time` |
| `rest_firewall_login_strikes_{hash}` | block-cycle count | `blacklist_time × (promote_after+1)` |

**Exemptions:** IPs in `absolute_whitelist` (Trusted IPs, pro WordPress Mode) and `admin_login_whitelist_ips` (free) are never rate-limited or blocked.

### Admin Login Whitelist (free + pro)
A separate IP allowlist that restricts `/wp-login.php` and `/wp-admin/` login attempts to specific IPs/CIDRs. Applied at `authenticate` priority 1 (before the rate limiter), only when `REST_REQUEST` is not defined.

- If enabled and requesting IP not in list → `WP_Error` before credential check.
- REST API auth is not gated by this whitelist — it is only for form-based admin/customer login.
- Stored in CoreOptions: `admin_login_whitelist_enabled` (bool), `admin_login_whitelist_ips` (array).

---

## IP Filtering

Separate from Auth Hardening. Covers:
- **Public rate limiting** — request flooding from unknown/anonymous IPs (not auth-specific).
- **Global blacklist** — IPs permanently blocked from all requests. Fed by: manual admin entry, Auth Hardening escalation (`entry_type=rate_limit`), pro automation rules.
- **Trusted IPs** (pro) — IPs exempt from all enforcement including rate limiting and auth restrictions.

---

## Rate Limiting — Panel Organization

| Panel | Rules |
|-------|-------|
| **Auth Hardening** | Auth Rate Limiting (failed credentials), Admin Login Whitelist, Blacklist Escalation, Active Auth Blocks |
| **IP Filtering** | Public Rate Limiting (traffic volume), Global Blacklist, Trusted IPs |

This mirrors conventional firewall UIs (Cloudflare, Nginx, etc.) — credential attacks and traffic floods are handled in separate sections.

---

## Option Storage

### Free tier (CoreOptions / `wp_options`)
| Key | Type | Description |
|-----|------|-------------|
| `login_rate_limit_enabled` | bool | Enable auth rate limiting |
| `login_rate_limit_attempts` | int | Max failed attempts before temp block |
| `login_rate_limit_window` | int | Rolling window (seconds) |
| `login_rate_limit_blacklist_time` | int | Temp block duration (seconds) |
| `login_rate_limit_promote_after` | int | Block cycles before permanent blacklist (0 = off) |
| `admin_login_whitelist_enabled` | bool | Restrict admin login to whitelisted IPs |
| `admin_login_whitelist_ips` | array | Allowed IPs/CIDRs for admin login |

### Pro tier (per-application, `wp_options` + pro tables)
Auth Hardening settings are **not per-application** — they remain in CoreOptions shared across all applications.

---

## Auth Method / User Dependency

### Rule
**Authentication method enforcement only applies when at least one user is configured.**

A public application (no users set) is a valid and supported use case:
- Free tier: admin uses IP filtering, route blocking, or other options without any REST API user.
- Pro tier: admin creates an application serving public endpoints with no user restriction.

If `enforce_auth = true` but no users are configured, the result would be a total lockout (every request returns 401 with no way to authenticate). The plugin must detect this and skip auth enforcement silently.

### Free tier check
`firewall_user_id` (CoreOptions): if `0` or unset → no user configured → auth not enforced regardless of `enforce_auth` flag.

Check point: `PolicyRuntime::resolve_settings()` must gate the `protect = true` override behind `has_configured_users()`. Same guard in `Firewall::wordpress_auth()`.

```php
// Free tier user check
private static function has_configured_users(): bool {
    return (int) CoreOptions::read_option( 'firewall_user_id' ) > 0;
}
```

### Pro tier check
Per-application: query the pro users repository for `application_id`. If `count === 0` → no users → skip auth enforcement for that application.

```php
// Pro tier user check (application-scoped)
private static function has_configured_users( string $application_id ): bool {
    return UsersRepository::count_for_application( $application_id ) > 0;
}
```

### Guard locations
| File | Hook | Guard added |
|------|------|-------------|
| `PolicyRuntime::resolve_settings()` | Before forcing `protect = true` for core routes | `has_configured_users()` |
| `Firewall::wordpress_auth()` | Before calling `authenticate()` | `has_configured_users()` |

### UI signals
- **Free tier `RestApiSingleUser.jsx`**: Authentication Method section is `disabled` when `firewall_user_id === 0`. Helper text: _"Select a REST API user above to enable this option."_
- **Pro tier `ApplicationEditorSettings.jsx`**: When `appAllowedAuthMethods` is set but `hasUsers === false`, show `Alert severity="info"`: _"Authentication methods have no effect until at least one user is assigned to this application."_ The checkboxes remain enabled (admin can pre-configure for when users are added).

---

## Application Scoping (Pro)

All route policy, model, collection, and user rules are scoped to an **Application** entity. Each application has its own:
- Route policy tree (per-route overrides)
- Allowed origins, allowed IPs, auth methods
- Users (with per-route access grants)
- Models, Collections, Webhooks, Mails, Automations

Auth Hardening and IP Filtering (blacklist) are **global** — shared across all applications. Trusted IPs (pro) is also global.

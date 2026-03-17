<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#2e7d32;color:#fff;font-size:11px;font-weight:600">FREE</span> <span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# IP Filtering

IP Filtering controls which IP addresses can reach the REST API. The free tier provides automatic and manual IP blacklisting. Pro adds whitelist mode, CIDR range support, and country-level blocking — all scoped per application.

---

## Free Tier

### Automatic Blacklisting

The plugin monitors rate limit violations. When an IP exceeds the blacklist threshold configured in the [Auth & Rate Limiting](/users/users) panel, it is added to the blacklist automatically. The Block Time setting determines how long the IP remains blocked.

### Manual Blacklist

IPs can be added to the blacklist manually at any time. Entries can also be removed individually.

Free tier supports **IPv4 addresses** only. CIDR ranges and IPv6 are not available.

### GeoIP Statistics

Read-only geographic statistics of incoming requests are available in the free tier. Country-level blocking is not available — it requires Pro.

---

## Pro — Modes

In Pro, IP Filtering is scoped per application. Each application can operate in a different mode.

### Blacklist Mode

Listed IPs and ranges are blocked. A configurable **retention time** determines how long a blacklisted entry remains active before it is automatically removed.

### Whitelist Mode

Only IPs explicitly listed are allowed through. All other IPs are rejected. Use this mode when your application is accessed from known, fixed IP addresses (e.g. a CI server or an internal corporate network).

---

## Pro — Advanced Options

### CIDR Ranges

Define IP ranges using CIDR notation (e.g. `192.168.1.0/24`). Works in both whitelist and blacklist modes.

### Country Blocking

Block or allow requests by country using GeoIP data. Two sub-modes available:

- **Block countries** — allow all traffic except the listed countries.
- **Allow countries** — block all traffic except the listed countries.

Country rules apply on top of individual IP rules.

---

## IP List Management

The IP list displays all active entries (manual or auto-detected). For each entry:

- **Add** an IP or CIDR range manually.
- **Delete** one or more entries.

Entries show the IP address, source (manual or auto-detected), and — in Pro — the retention expiry time.

---

## FAQ

**Is IP filtering per application in Pro?**

Yes. Each application has its own IP list and operates in its own mode (whitelist or blacklist). An IP blocked in one application is not affected in another.

**Does the auto-blacklist work in Pro?**

Yes. Rate limit auto-detection works in both tiers. In Pro, the resulting blacklist entry is scoped to the application that detected the violation.

**Are IPv6 addresses supported?**

IPv6 support is available in Pro with CIDR notation. The free tier supports IPv4 only.

**What happens to blocked IPs when an application is deleted?**

IP entries scoped to a deleted application are removed alongside it. Global free-tier entries are unaffected.

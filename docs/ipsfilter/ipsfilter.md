<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# IP Filtering (Per-Application)

Per-application IP Filtering is a Pro feature that adds application-scoped blocking on top of the [Global IP Filtering](/global-ip-filtering/global-ip-filtering) layer. Because applications themselves are a Pro concept, this module is only available with a Pro licence.

| Layer | Scope | Tier | Doc |
|---|---|---|---|
| **Global IP Filtering** | Shared across all applications — runs before application resolution | Free + Pro | [→ Global IP Filtering](/global-ip-filtering/global-ip-filtering) |
| **Per-Application IP Filtering** | Additional blocks scoped to one application — runs after application resolution | **Pro only** | This page |

Use Global IP Filtering for shared threats such as known bots, scrapers, and unwanted geographies. Use per-application IP Filtering for rules that only apply to one specific application. An IP that passes the global check can still be blocked here for a specific application.

---

## Features

### CIDR Ranges

Define IP ranges using CIDR notation (e.g. `192.168.1.0/24`). Supports both IPv4 and IPv6.

### Country Blocking

Block requests by country using GeoIP data, scoped to this application. Country rules apply on top of individual IP rules.

### Retention Time

Set an optional retention period. Entries are automatically removed when the retention time elapses.

---

## IP List Management

The IP list displays all active entries for this application (manual or auto-detected). For each entry:

- **Add** an IP or CIDR range manually.
- **Delete** one or more entries individually or in bulk.

Entries show the IP address, source (manual or auto-detected), detected country, and the optional retention expiry time.

---

## FAQ

**How does per-application filtering relate to the global blocklist?**

Both layers run independently. The global blocklist is checked first. If the IP passes, the per-application list is checked next. An IP can be blocked at either level.

**Are IPv6 addresses supported?**

Yes. Both IPv4 and IPv6 are supported via CIDR notation.

**What happens to blocked IPs when an application is deleted?**

Application-scoped entries are detached from that application and no longer enforced there. Global entries are unaffected.

**Can I keep one strict global policy and still allow variation per app?**

Yes. Keep broad controls in [Global IP Filtering](/global-ip-filtering/global-ip-filtering) and add stricter, app-specific rules here.

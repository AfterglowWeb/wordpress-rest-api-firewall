---
name: rest-api-firewall-ux
description: "Planning and architecture notes for the REST API Firewall plugin UI. Use when working on drawer navigation, tier/license gating, migration dialogs, ApplicationSelector, GlobalSecurity, or the free-vs-pro tier UX decisions."
---

# REST API Firewall – UI Architecture Reference

This skill tracks in-flight UX architecture decisions, known issues, and planned work for the plugin React app.

---

## A — Migration State Machine

### States

| State | Condition |
|---|---|
| **Free** | Pro plugin inactive OR not installed |
| **Pro (no license)** | Pro plugin active, license invalid/expired |
| **Pro (license, no apps)** | Pro active + valid license, `applications` table empty |
| **Pro (license, apps exist)** | Pro active + valid license + ≥1 application |

### Required Behaviors

**1. Pro deactivated while apps exist OR license expired while apps exist:**
- PHP `ProToFreeFallbackService::should_prompt()` returns `true`
- Bootstrap.php injects `restApiFirewallPro.shouldPromptFallback = true`
- `ProToFreeDialog.jsx` opens automatically in `App.jsx`
- User selects one app to export to free-tier wp_options; others are preserved but inaccessible
- "Dismiss for now" hides dialog for 7 days via transient

**2. Pro active + delete all applications:**
- After last application deleted: clear `selectedApplicationId` from ApplicationContext
- Navigate back to applications list (no dangling React navigation state)
- ApplicationSelector auto-expands (shows New Application button)
- No migration dialog should appear (user chose to delete, not downgrade)

**3. Migration dialog (free → pro) must NOT show when:**
- Pro plugin is active
- No applications exist yet
- But user has NOT previously had free-tier data (`migrationNeeded === false`)
- Guard: `restApiFirewallPro.migrationNeeded && !isMigrated`

**4. Migration (free → pro) SHOULD fire when:**
- User activates pro for the first time
- Free-tier data exists: `firewall_user_id`, `enforce_auth`, `enforce_rate_limit`, or `firewall_policy.routes/nodes`
- PHP: `MigrationService::is_migration_needed()` returns `true`
- Migration sets flag `rest_api_firewall_pro_migrated` to prevent re-firing
- Imported application: `enabled = false` by default (user activates manually)
  - Exception: dialog checkbox "Activate immediately" → `enabled = true`
- HTTP methods: all allowed (not set in free tier; pro default is all methods enabled)
- Whitelisted IPs/domains: empty (free tier only has IP blacklisting)
- JWT auth + WordPress auth migrated; no per-route overrides set initially

---

## B — Pending Work Items

### B1 — GlobalSecurity: spurious confirm dialog on navigation

**Problem:** When leaving the global security panel (`global_security`), the confirm dialog fires even if no changes were made.

**Root cause:** `GlobalSecurity.jsx` currently uses local `useState` for `form`/`savedForm`. If these get initialized at different times, `isDirty` may return `true` on first mount.

**Fix required:**
- Replace local state with a dedicated context or use `AdminDataContext` as the source of truth
- On mount, read initial values from `adminData.admin_options` and compare against those same values on dirty check
- Only fire `setDirtyFlag` when user has actually changed a field
- File: `src/components/GlobalSecurity/GlobalSecurity.jsx`

### B2 — Drawer navigation: application-scoped items live in ApplicationSelector

**Architecture (implemented):**
- All per-application module items (Routes, Users, Collections, Properties, Automations, Webhooks, Emails) are rendered INSIDE `ApplicationSelector.jsx` as nested items
- In **free tier**: collapsed by default; all modules shown disabled under "No application" + tooltip "Upgrade to Pro"
- In **pro tier (no app)**: expanded by default; modules under "No application" disabled + tooltip "Create an application first"; "All Applications" + "New Application" links shown above
- In **pro tier (app selected)**: modules enabled under the active app button

**Breadcrumbs in `Navigation.jsx`:**
- Because duplicate panel keys exist (metadata-only hidden items for pro + visible free-tier items), the breadcrumb lookup uses:
  ```js
  menuItems.filter(m => !m.hidden).find(m => m.key === panel)
    || menuItems.find(m => m.key === panel)
  ```
- Free-tier accessible items have `breadcrumbPrefix: 'Global Settings'`
- Pro metadata items (hidden) have `breadcrumbPrefix: 'REST API Firewall'` (for per-app context)

**Free-tier accessible panels (visible after Auth & Rate Limiting):**
- `per-route-settings` → RoutesPanel (free tier: GlobalRoutesPolicy only, no per-route tree tab)
  - Enabled: enforce_auth, enforce_rate_limit, hide_user_routes
  - Disabled (visible): oembed routes, batch routes, HTTP methods, object types
- `webhook` → Webhook.jsx (single outbound webhook, saved as wp_options)
  - Fields: endpoint, auto-trigger events
- `collections` → FreeTierCollections.jsx (global per-page + drag-drop sorting)
  - Free: per-page settings enabled; sorting options disabled (pro required)

---

## C — Previously Fixed Issues (reference)

| Item | Status | File(s) |
|---|---|---|
| ApplicationSelector `</Collapse>` in wrong position | ✅ Fixed | ApplicationSelector.jsx |
| MigrationDialog: removed `noApplications` dead scenario | ✅ Fixed | MigrationDialog.jsx |
| MigrationService: `is_migration_needed()` checks `firewall_policy` | ✅ Fixed | MigrationService.php |
| Bootstrap.php: `shouldPromptFallback` exposed to JS | ✅ Fixed | Bootstrap.php |
| ProToFreeFallbackService: exports first webhook to free tier | ✅ Fixed | ProToFreeFallbackService.php |
| ProToFreeDialog.jsx: new component created | ✅ Fixed | ProToFreeDialog.jsx |
| App.jsx: ProToFreeDialog wired with proFallbackOpen state | ✅ Fixed | App.jsx |

---

## File Map

| Concern | File |
|---|---|
| Drawer + main menu | `src/components/Navigation.jsx` |
| App/module selector | `src/components/ApplicationSelector.jsx` |
| Free→Pro migration dialog | `src/components/Migration/MigrationDialog.jsx` |
| Pro→Free downgrade dialog | `src/components/Migration/ProToFreeDialog.jsx` |
| PHP migration service | `inc/Migration/MigrationService.php` |
| PHP pro→free fallback | `inc/Migration/ProToFreeFallbackService.php` |
| PHP bootstrap / JS object | `inc/Core/Bootstrap.php` |
| Routes panel | `src/components/Firewall/Routes/RoutesPanel.jsx` |
| Global routes options (both tiers) | `src/components/Firewall/Routes/GlobalRoutesPolicy.jsx` |
| Free-tier webhook panel | `src/components/Webhooks/Webhook.jsx` |
| Free-tier collections panel | `src/components/Models/FreeTierCollections.jsx` |
| Pro collections panel | `src/components/Models/Collections.jsx` |
| Global security panel | `src/components/GlobalSecurity/GlobalSecurity.jsx` |
| License context | `src/contexts/LicenseContext.jsx` |
| Application context | `src/contexts/ApplicationContext.jsx` |

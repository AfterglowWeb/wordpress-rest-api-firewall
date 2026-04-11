---
name: rest-api-firewall-ux
description: "Planning and architecture notes for the REST API Firewall plugin UI. Use when working on drawer navigation, tier/license gating, migration dialogs, ApplicationSelector, GlobalSecurity, free-vs-pro tier UX decisions, save routines, or any panel UI. See also ARCHITECTURE.md in this directory for the full panel registry, data-flow diagrams, and regression checklists."
---

# REST API Firewall – UI Architecture Reference

This skill tracks in-flight UX architecture decisions, known issues, and planned work for the plugin React app.

## Build Notes
- **JavaScript builds** always use `yarn build` (never `npm`). This is the project standard.
  - Run from: `/Users/cedric/Local Sites/botoxs/app/public/wp-content/plugins/rest-api-firewall/`
  - Command: `yarn build`

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

## B — Save Routine Patterns

### RULES (never violate)
- **Never gate the Navigation AppBar save button with `hasValidLicense`** — that was a bug that made all free-tier saves invisible. The condition must be `showSaveButton` only.
- Free-tier panels that use `App.jsx` form state (`useSettingsForm`) MUST NOT render their own inline save button — the AppBar button is their save UI.
- Self-contained panels that manage their own form state (e.g. `GlobalSecurity`) MAY have an inline save Toolbar.

### Free Tier — App.jsx form state + Navigation AppBar button

How it works:
1. `useSettingsForm` in `App.jsx` owns all settings form state via `form` / `setField`
2. `PANEL_SAVE_GROUP` maps each panel key to a save group name
3. `isGroupDirty(group)` drives the AppBar Save button's disabled state (`formDirty`)
4. On click → `handleSave()` → `useSaveOptions.save()` → confirm dialog (from `SAVE_CONFIG[group].confirmMessage`) → AJAX `rest_api_firewall_update_options`
5. Pro panels are removed from `PANEL_SAVE_GROUP` when `hasValidLicense` is true (they use their own save)

| Panel key | Component | Save group | Notes |
|---|---|---|---|
| `webhook` | `Webhook.jsx` | `webhook` | Confirm dialog: "Save webhook settings?" |
| `theme` | `ThemeSettings.jsx` | `theme` | Confirm dialog: "Save theme settings?" |
| `per-route-settings` | `RoutesPanel.jsx` | `firewall_routes_policy` | Free tier only |
| `models-properties` | `Properties.jsx` | `models_properties` | Free tier only |
| `firewall_auth_rate` | `RestApiSingleUser.jsx` | `firewall_auth_rate` | Both tiers |

**Exception — self-contained panels (NOT in PANEL_SAVE_GROUP — AppBar Save hidden for these):**

| Component | Panel key | Save mechanism |
|---|---|---|
| `GlobalSecurity.jsx` | `global_security` | Owns `useSaveOptions` instance + inline `<Toolbar>` save button; manages its own local form state |
| `Collections.jsx` | `collections` | Owns `useSaveOptions` instance + inline Save button; scoped per collection type; `skipConfirm: true` |
| `PublicRateLimitSection.jsx` | child of `global-ip-filtering` | Owns `useSaveOptions` instance + inline Save button; always rendered inside IpFilter panel |

### Pro Tier — EntryToolbar + useRegisterToolbar + useProActions

How it works:
1. Entry editor components (e.g. `WebhookEditor`, `MailEditor`, `AutomationEditor`) call `useRegisterToolbar()` to push config into `EntryToolbarContext`
2. `EntryToolbar.jsx` replaces the Navigation AppBar while an editor is open
3. Save button enabled state is controlled by `canSave` prop passed to `updateToolbar()`
4. On save: `useProActions.save()` → optional confirm dialog → AJAX → `onSuccess` callback
5. Dirty state is tracked locally in the editor via `useMemo` snapshot comparison
6. Delete: `useProActions.remove()` → confirm dialog → navigate back

| Component | Toolbar registered via | Save hook |
|---|---|---|
| `WebhookEditor.jsx` | `useRegisterToolbar` | `useProActions.save` |
| `MailEditor.jsx` | `useRegisterToolbar` | `useProActions.save` |
| `AutomationEditor.jsx` | `useRegisterToolbar` | `useProActions.save` |

---

## C — Free-Tier Webhook Events

Source: `inc/Webhook/WebhookAutoTrigger.php` → `get_available_events()`  
Frontend filter: `WordpressEvents.jsx` filters by `context` array matching `'free'` or `'pro'`

**Free-tier events (context includes `'free'`):**

| Event key | Label | Group |
|---|---|---|
| `save_post` | Post saved | posts |
| `before_delete_post` | Post deleted | posts |
| `trashed_post` | Post trashed | posts |
| `untrashed_post` | Post restored | posts |
| `add_attachment` | Attachment added | attachments |
| `edit_attachment` | Attachment edited | attachments |
| `delete_attachment` | Attachment deleted | attachments |
| `created_term` | Term created | terms |
| `edited_term` | Term edited | terms |
| `delete_term` | Term deleted | terms |
| `wp_login` | User logged in | users |

**Pro-only events:** `user_register`, `profile_update`, `delete_user`, `inbound_webhook` (virtual)

To add a new event: add it to the PHP array with `context: ['free', 'pro']` or `['pro']`. The frontend picks it up automatically.

---

## D — Pending Work Items

### D1 — GlobalSecurity: spurious confirm dialog on navigation
✅ **Likely resolved** — GlobalSecurity was refactored to use its own self-contained local form state, initialized from `adminData.admin_options` at mount and compared against a `savedForm` snapshot. Verify in browser that navigating away from the Security panel without making changes does NOT trigger the confirm dialog.

### D2 — Drawer navigation: application-scoped items live in ApplicationSelector

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
  - Fields: endpoint, auto-trigger events, service format, auth secret
- `collections` → FreeTierCollections.jsx (global per-page + drag-drop sorting)
  - Free: per-page settings enabled; sorting options disabled (pro required)

---

## E — Previously Fixed Issues (reference)

| Item | Status | File(s) |
|---|---|---|
| ApplicationSelector `</Collapse>` in wrong position | ✅ Fixed | ApplicationSelector.jsx |
| MigrationDialog: removed `noApplications` dead scenario | ✅ Fixed | MigrationDialog.jsx |
| MigrationService: `is_migration_needed()` checks `firewall_policy` | ✅ Fixed | MigrationService.php |
| Bootstrap.php: `shouldPromptFallback` exposed to JS | ✅ Fixed | Bootstrap.php |
| ProToFreeFallbackService: exports first webhook to free tier | ✅ Fixed | ProToFreeFallbackService.php |
| ProToFreeDialog.jsx: new component created | ✅ Fixed | ProToFreeDialog.jsx |
| App.jsx: ProToFreeDialog wired with proFallbackOpen state | ✅ Fixed | App.jsx |
| Navigation: save button gated by `hasValidLicense` (free tier could never save) | ✅ Fixed | Navigation.jsx |
| useSaveOptions: hardcoded free nonce — would fail against pro AJAX handlers | ✅ Fixed | useSaveOptions.js |
| Plugin routes: global `enforce_auth` incorrectly applied in UI (PHP already excluded them) | ✅ Fixed | RoutesPolicyNodeContent.jsx |
| Pro-only Models options (Relative URLs etc.) showing as checked in free tier | ✅ Fixed | GlobalProperties.jsx |
| Redirect settings UI in Theme panel — moved to Security panel | ✅ Fixed | ThemeSettings.jsx / GlobalSecurity.jsx |

---

## F — Critical Cross-Cutting Rules

### Nonce — always use approved hooks
Two nonces exist: free (`rest_api_firewall_update_options_nonce`) and pro (`rest_api_firewall_update_pro_options_nonce`).
- Free `Permissions::ajax_validate_has_firewall_admin_caps()` accepts **both**
- Pro `Permissions::validate_ajax_crud_rest_api_firewall_pro_options()` accepts **pro nonce only** (`check_ajax_referer` → wp_die on mismatch)
- All three JS hooks resolve nonce as `proNonce || adminData.nonce` — never bypass them with a raw `fetch`
- See ARCHITECTURE.md §5 for the full table.

### Plugin routes — bypass rule
Routes whose first path segment is NOT in `['wp', 'oembed', 'batch', 'wp-site-health']` are plugin routes.
- `isPluginRoute(node)` helper in `routesPolicyUtils.js`
- PHP: `PolicyRuntime::is_wordpress_core_route()` (inverse)
- **Free tier UI**: `authIsGlobal` must be false for plugin routes — global `enforce_auth` does not apply to them
- **Pro tier**: plugin routes bypass per-application enforcement in `FirewallPro::check()` — they fall through with global defaults
- Route Settings Drawer stores plugin route settings globally in `rest_firewall_plugin_routes_policy`, not per-application
- See ARCHITECTURE.md §8 for the full decision record.

### Applications Only Mode
- Option: `applications_only_mode` (boolean, `global_security` group, free+pro)
- Free tier: activates template redirect + xmlrpc block when enabled
- Pro tier: additionally redirects unmatched core REST requests (HTTP redirect, not 404)
- Plugin routes always fall through — never redirected
- Redirect destination shared with theme redirect: `theme_redirect_templates_preset_url` / `theme_redirect_templates_free_url`
- See ARCHITECTURE.md §9.

### Models / Properties — tier gating
- `rest_models_relative_url_enabled` and `rest_models_relative_attachment_url_enabled` are **pro-only** (context `['pro']`)
- All pro-only fields in `GlobalProperties` are always displayed as `false` (unchecked) in free tier via `checkedValue` in the `Item` component — stored values from a prior pro activation are ignored in the UI

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
| Free plugin permissions + nonce validation | `inc/Core/Permissions.php` |
| Pro plugin permissions + nonce validation | `/rest-api-firewall-pro/inc/Core/Permissions.php` |
| App-level form state + save wiring | `src/App.jsx` |
| Settings form hook | `src/hooks/useSettingsForm.js` |
| Free-tier save hook (nonce-aware) | `src/hooks/useSaveOptions.js` |
| Pro-tier save/delete hook | `src/hooks/useProActions.js` |
| Generic AJAX hook | `src/hooks/useAjax.js` |
| Entry toolbar context | `src/contexts/EntryToolbarContext.jsx` |
| License context (`hasValidLicense`, `proNonce`) | `src/contexts/LicenseContext.jsx` |
| Admin data context | `src/contexts/AdminDataContext.jsx` |
| Application context | `src/contexts/ApplicationContext.jsx` |
| Routes panel | `src/components/Firewall/Routes/RoutesPanel.jsx` |
| Global routes options (both tiers) | `src/components/Firewall/Routes/GlobalRoutesPolicy.jsx` |
| Route tree node UI + auth/disable switches | `src/components/Firewall/Routes/RoutesPolicyNodeContent.jsx` |
| Route Settings Drawer (users + IPs + origins) | `src/components/Firewall/Routes/RouteSettingsDrawer.jsx` |
| `isPluginRoute()` + tree utils | `src/components/Firewall/Routes/routesPolicyUtils.js` |
| Free-tier webhook panel | `src/components/Webhooks/Webhook.jsx` |
| Pro webhook editor | `src/components/Webhooks/WebhookEditor.jsx` |
| Webhook auto-trigger events (PHP) | `inc/Webhook/WebhookAutoTrigger.php` |
| Free-tier collections panel | `src/components/Models/FreeTierCollections.jsx` |
| Pro collections panel | `src/components/Models/Collections.jsx` |
| Global model output settings (toggles) | `src/components/Models/GlobalProperties.jsx` |
| Properties panel (tabbed: Global / Per Model) | `src/components/Models/PropertiesPanel.jsx` |
| Global security panel (redirect + xmlrpc + apps-only mode) | `src/components/GlobalSecurity/GlobalSecurity.jsx` |
| Theme panel (deploy theme, ACF, content, images) | `src/components/Theme/ThemeSettings.jsx` |
| All option definitions, groups, defaults | `inc/Core/CoreOptions.php` |
| Route policy resolution + `is_wordpress_core_route()` | `inc/Policy/PolicyRuntime.php` |
| Pro application enforcement + plugin route bypass | `/rest-api-firewall-pro/inc/Firewall/FirewallPro.php` |

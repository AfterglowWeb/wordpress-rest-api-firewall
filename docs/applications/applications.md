<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Applications

An Application is the central orchestration unit of the Pro layer. Every feature module — auth, rate limiting, IP filtering, route policy, properties, collections, automations, webhooks, and emails — is configured independently per application. This lets you serve different clients from the same WordPress installation with completely isolated API surfaces: different auth methods, different data views, different rate limits, different allowed origins.

You can create as many applications as you need. Each one is independent.

---

## Applications List

The list view is the entry point for managing all your applications.

- **Create** a new application with the add button.
- **Enable / Disable** an application with the toggle. A confirmation dialog requires you to type the application name before the change is applied — this prevents accidental deactivation of a live application.
- **Delete** an application permanently. A confirmation dialog requires you to type the application name before deletion proceeds.
- **Open** any application to access its editor and module configuration.

Once at least one application exists and is enabled, any incoming REST request that does not match a registered application is blocked.

---

## Application Editor

Each application has its own editor with two areas:

### Identity

- **Title** — display name used throughout the admin.
- **Description** — optional notes for your own reference.
- **Enabled** — activate or deactivate the application without deleting it.

### Modules

Each module can be toggled on or off at the application level. A module must also be globally active to take effect. The editor shows a summary of the current configuration for each module and a direct link to its dedicated settings panel.

| Module | Description | Doc |
|---|---|---|
| **Auth & Rate Limiting** | Auth methods, allowed origins & IPs, HTTP methods, users and per-user overrides | [→ Auth & Rate Limit](/users/users) |
| **IP Filtering** | Whitelist / blacklist, CIDR ranges, country blocking | [→ IP Filtering](/ipsfilter/ipsfilter) |
| **Routes Policy** | Per-route auth, rate limit, disable, user restriction | [→ Routes](/routes/routes) |
| **Properties & Models** | Response transforms, per-property control, custom schemas | [→ Properties & Models](/models/models) |
| **Collections** | Per-page limits, drag-and-drop sort order | [→ Collections](/collections/collections) |
| **Automations** | Event-driven workflows with conditions and actions | [→ Automations](/automations/automations) |
| **Webhooks** | Outbound webhook entries with event triggers | [→ Webhooks](/webhooks/webhooks) |
| **Emails** | Transactional email templates with SMTP | [→ Emails](/mails/mails) |

---

## Auth & Rate Limiting Module

See the dedicated [Auth & Rate Limiting](/users/users) page for full documentation of application-level defaults, the users list, and the user editor.

---

## IP Filtering Module

Manages IP-based access control for this application.

- **Whitelist mode** — only requests from listed IPs or CIDR ranges are allowed through.
- **Blacklist mode** — listed IPs or ranges are blocked. Configurable retention time.
- **Country blocking** — block or allow requests by country using GeoIP data.
- **CIDR support** — define ranges in addition to individual addresses.

See the dedicated [IP Filtering](/ipsfilter/ipsfilter) page for full documentation.

---

## FAQ

**Can multiple applications share the same origin?**

Yes. The firewall matches the first enabled application whose origin matches the request. List order determines priority.

**What happens when no application matches a request?**

Once applications are enabled, any request that does not match a registered application is blocked.

**Can I test an application's policy before enabling it?**

Yes. The Routes module includes a Test panel that lets you fire live requests through the current policy without exposing it to real traffic.

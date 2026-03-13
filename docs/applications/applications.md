<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Applications

Applications define scoped authentication contexts for your REST API. Each application links a client to a specific origin, accepted auth methods, and per-module feature toggles. Use multiple applications to serve different clients from the same WordPress installation without exposing the full API surface to each.

---

<details>
<summary>Identity &amp; Host</summary>

<p><strong>Title</strong> is a display name for the application used in the admin interface.</p>
<p><strong>Host</strong> restricts accepted requests to a specific origin domain (e.g. <code>https://myapp.com</code>). Leave empty to accept requests from any origin.</p>
<p><strong>Enabled</strong> toggles the application on or off without deleting it. Disabled applications are skipped during firewall matching.</p>

</details>

<details>
<summary>Authentication Methods</summary>

<p>Select which authentication mechanisms are valid for this application. Available methods include WordPress Application Passwords, JWT, OAuth 2.0, and SSO — depending on which authenticators are active globally.</p>
<p>Requests authenticated with a non-listed method are rejected at stage 4 of the firewall pipeline with a <code>403</code> response.</p>

</details>

<details>
<summary>Feature Modules</summary>

<p>Each feature module (Users &amp; Rate Limit, Properties, Collections, Automations, Webhooks, Emails) can be enabled or disabled at the application level. A module must also be globally active to take effect here.</p>
<p>Use this to expose only the relevant features to each client application.</p>

</details>

---

**Entry type:** Application

- [MUI DataGrid — sorting, filtering &amp; pagination](https://mui.com/x/react-data-grid/)

---

## FAQ

**Can multiple applications share the same host?**

Yes. The firewall matches the first enabled application whose host matches the request origin. List order determines priority.

**What happens when no application matches a request?**

The request continues through the base firewall pipeline. Applications add a scoped layer on top — they do not replace the standard free-plugin rules.

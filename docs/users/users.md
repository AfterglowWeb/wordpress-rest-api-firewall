<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#2e7d32;color:#fff;font-size:11px;font-weight:600">FREE</span> <span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Auth. &amp; Rate Limit

The Users panel assigns per-user REST API access rules. Each entry links a WordPress user to an optional request quota. When the module is enabled, authenticated requests are checked against this list before the endpoint is reached. Unauthenticated requests are unaffected.

---

<details>
<summary>User Identity</summary>

<p><strong>User</strong> links this entry to an existing WordPress user account. The display name and email are resolved automatically from the user ID.</p>
<p><strong>Enabled</strong> toggles enforcement for this user entry without deleting it.</p>

</details>

<details>
<summary>Rate Limiting</summary>

<p><strong>Window (seconds)</strong> defines the time period over which requests are counted. For example, <code>60</code> means one minute.</p>
<p><strong>Max Requests</strong> is the maximum number of REST API requests allowed within one window. When exceeded, the firewall returns <code>429 Too Many Requests</code> until the window resets.</p>
<p>Leave both fields empty to grant unrestricted access while still tracking the user through the registered entry.</p>

</details>

---

**Entry type:** User

- [MUI DataGrid — sorting, filtering &amp; pagination](https://mui.com/x/react-data-grid/)

---

## FAQ

**Are rate limits shared across applications?**

Rate limits are enforced globally per user. The same counter applies regardless of which application the request matched.

**Can I add a user entry before they have made any API requests?**

Yes. Creating an entry in advance lets you set limits proactively. The counter starts at zero on first request.

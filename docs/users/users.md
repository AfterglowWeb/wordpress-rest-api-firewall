<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#2e7d32;color:#fff;font-size:11px;font-weight:600">FREE</span> <span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Auth. &amp; Rate Limit

The Users panel assigns per-user REST API access rules. Each entry links a WordPress user to an optional request quota. When the module is enabled, authenticated requests are checked against this list before the endpoint is reached. Unauthenticated requests are unaffected.
To block unauthenticated requests, you must enforce authentication globally or on a per-route basis in the Routes panel.

---

<details>
<summary>User Identity</summary>

<p><strong>User</strong> links this entry to an existing WordPress user account.</p>
<p><strong>Enabled</strong> toggles activation for this user without deleting it.</p>

</details>

<details>
<summary>Rate Limiting</summary>

<p><strong>Window (seconds)</strong> defines the time period over which requests are counted. For example, <code>60</code> means one minute.</p>
<p><strong>Max Requests</strong> is the maximum number of REST API requests allowed within one window. When exceeded, the firewall returns <code>429 Too Many Requests</code> until the window resets.</p>
<p>Leave both fields empty to grant unrestricted access while still tracking the user through the registered entry.</p>

<p><strong>Block Time</strong> is the time period to block an IP after it exceeded max requests.</p>
<p><strong>Black List</strong> is the maximum number of max requests hit before an IP is blacklisted.</p>

</details>

---

**Entry type:** User

---

## FAQ

**Are rate limits shared across applications?**

Rate limits are enforced globally per user. The same counter applies on users regardless of which application the request matched. We encourage you to use different users accross applications.

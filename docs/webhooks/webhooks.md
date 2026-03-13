<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Webhooks

Webhooks send HTTP POST payloads to an external URL when specific WordPress events occur. Each webhook entry configures a target URL, custom headers, and a body template. Delivery is asynchronous — it runs via WP-Cron and does not block the triggering request.

---

<details>
<summary>Target &amp; Headers</summary>

<p><strong>URL</strong> is the endpoint that will receive the payload (e.g. <code>https://api.myapp.com/hooks/wp</code>).</p>
<p><strong>Headers</strong> is a raw JSON object of key/value pairs added to every outgoing request. Use this for API keys or <code>Authorization</code> headers required by the receiving service:</p>
<pre><code>{ "X-Api-Key": "secret", "Content-Type": "application/json" }</code></pre>

</details>

<details>
<summary>Body Payload</summary>

<p><strong>Body</strong> is a JSON template for the request body. Use placeholder syntax to reference dynamic values from the triggering event context. Leave empty to send no body.</p>

</details>

<details>
<summary>Trigger Events</summary>

<p>Select the WordPress lifecycle events that activate this webhook. Available triggers include post create, update, and delete events as well as user events. Multiple triggers can be assigned to one webhook entry.</p>

</details>

---

**Entry type:** Webhook

- [MUI DataGrid — sorting, filtering &amp; pagination](https://mui.com/x/react-data-grid/)

---

## FAQ

**Are failed deliveries retried?**

Delivery failures are logged but not automatically retried. You can re-trigger manually by saving the entry, or use the Automations panel to handle retries programmatically.

**Can I send the same payload to multiple URLs?**

Create one webhook entry per destination URL and assign the same trigger configuration to each.

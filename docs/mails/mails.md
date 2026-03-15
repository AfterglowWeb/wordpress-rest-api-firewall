<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Emails

Email entries define reusable transactional templates used by Automations or triggered manually. Each entry stores the recipient address, subject line, and HTML body. SMTP delivery settings are managed globally in the Email settings panel.

---

<details>
<summary>Recipient &amp; Subject</summary>

<p><strong>To</strong> is the recipient email address. Dynamic placeholders resolve values from the trigger event context at send time:</p>
<pre><code v-pre>{{user.email}}   {{post.title}}   {{site.name}}</code></pre>
<p><strong>Subject</strong> supports the same placeholder syntax.</p>

</details>

<details>
<summary>Body</summary>

<p><strong>Body</strong> is the email content in HTML. Compose your template in the editor and use <code v-pre>{{object.field}}</code> placeholders to inject dynamic content. A plain text fallback is generated automatically from the HTML.</p>

</details>

<details>
<summary>SMTP</summary>

<p>Delivery uses the global SMTP configuration from the <strong>Email settings panel</strong>. If SMTP is disabled, WordPress <code>wp_mail()</code> is used as fallback (server default mailer).</p>
<p>SMTP host, port, encryption, credentials, and sender identity are all configured at the plugin level — not per template.</p>

</details>

---

**Entry type:** Email template

- [MUI DataGrid — sorting, filtering &amp; pagination](https://mui.com/x/react-data-grid/)

---

## FAQ

**Can I send to multiple recipients?**

Separate multiple addresses with commas in the **To** field.

**Are sent emails logged?**

Sent emails are recorded in the application log with timestamp, recipient, and delivery status.

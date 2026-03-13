<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Automations

Automations chain a WordPress trigger to one or more actions. When the trigger fires, all enabled actions execute in sequence. Use automations to send emails, call webhooks, or dispatch custom hooks in response to WordPress events — without writing plugin code.

---

<details>
<summary>Trigger</summary>

<p>The <strong>trigger</strong> is the WordPress event that starts the automation. Available trigger types:</p>
<ul>
  <li>Post lifecycle — publish, update, delete (filterable by post type)</li>
  <li>User events — registration, login</li>
  <li>REST API request events</li>
  <li>Scheduled interval (WP-Cron)</li>
</ul>
<p>Each trigger type exposes its own configuration options in the editor.</p>

</details>

<details>
<summary>Actions</summary>

<p><strong>Actions</strong> execute in order when the trigger fires. Available action types:</p>
<ul>
  <li><strong>Send Email</strong> — dispatches a configured Mail template</li>
  <li><strong>Call Webhook</strong> — triggers a registered Webhook entry</li>
  <li><strong>Run Hook</strong> — fires a custom <code>do_action()</code> WordPress hook</li>
</ul>
<p>Each action can be individually enabled or disabled within the automation without removing it.</p>

</details>

<details>
<summary>Conditions</summary>

<p><strong>Conditions</strong> are optional expressions evaluated before the action sequence runs. If any condition fails, the automation halts. Conditions can inspect post meta, user roles, request parameters, or custom values.</p>

</details>

---

**Entry type:** Automation

- [MUI DataGrid — sorting, filtering &amp; pagination](https://mui.com/x/react-data-grid/)

---

## FAQ

**Can an automation trigger another automation?**

Not directly. However, a *Run Hook* action can fire a WordPress action that another automation's trigger listens to, creating a chain.

**What happens if one action in a sequence fails?**

By default execution continues to the next action. Failures are written to the application log with the automation ID and action index.

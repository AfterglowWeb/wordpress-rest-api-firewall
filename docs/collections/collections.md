<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Collections

Collections extends REST API list endpoints with per-page enforcement and drag-and-drop post ordering. When the module is enabled, you can control how many items are returned per endpoint and expose a `menu_order` sort parameter for custom sequences. Taxonomy term ordering is also available via the `term_order` parameter.

---

<details>
<summary>Per Page Enforcement</summary>

<p><strong>Enforce Per Page Parameter</strong> overrides the default <code>per_page</code> query parameter for all REST list endpoints.</p>
<p><strong>Posts Per Page</strong> sets the maximum number of post objects returned per request.</p>
<p><strong>Attachments Per Page</strong> applies the same limit specifically to attachment endpoints.</p>

</details>

<details>
<summary>Drag-And-Drop Sorting</summary>

<p><strong>Enable Drag-And-Drop Sorting</strong> adds a sortable order column to post list admin screens. Administrators can drag rows to reorder them.</p>
<p><strong>Choose Post Types</strong> restricts the sorting column to the selected post types. Leave empty to enable sorting on all public REST post types.</p>
<p><strong>Choose Taxonomies</strong> enables term ordering via REST for the selected taxonomies. Terms expose a <code>term_order</code> field and accept <code>orderby=term_order</code> on list endpoints.</p>

</details>

<details>
<summary>Order Enforcement</summary>

<p><strong>Apply Sort Order in REST Requests</strong> — when no <code>orderby</code> parameter is present in a REST request, the saved drag-and-drop order is applied automatically.</p>
<p><strong>Apply Sort Order in WordPress Queries</strong> — the same behaviour applied to standard <code>WP_Query</code> calls with no <code>orderby</code> argument.</p>

</details>

---

## FAQ

**How is term order stored?**

Term order is stored in term meta under the key `_rest_firewall_term_order` (integer). It is set via drag-and-drop in the admin or directly via the REST API field.

**Does drag-and-drop work across pagination?**

Drag-and-drop reordering is scoped to the current admin list page. Use the REST `menu_order` field for precise server-side ordering across the full dataset.

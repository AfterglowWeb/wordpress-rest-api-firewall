<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#2e7d32;color:#fff;font-size:11px;font-weight:600">FREE</span> <span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Properties

Models define REST response transformation rules for a post type or taxonomy. Choose between the standard WordPress REST schema with optional transforms, or a fully custom property map. Transformations run server-side before the response is sent, removing the need for client-side data massaging.

---

<details>
<summary>WordPress Schema</summary>

<p>The <strong>WordPress schema</strong> applies the standard WP REST response structure with optional transforms layered on top. Available transforms:</p>
<ul>
  <li><strong>Relative URLs</strong> — strips the domain from attachment and post link fields</li>
  <li><strong>Embedded terms</strong> — inlines taxonomy term objects</li>
  <li><strong>Embedded author</strong> — inlines the author user object</li>
  <li><strong>Embedded attachments</strong> — inlines all post attachments</li>
  <li><strong>Resolve rendered props</strong> — unwraps <code>rendered</code> wrappers (e.g. <code>title.rendered</code> → <code>title</code>)</li>
  <li><strong>Remove empty props</strong> — strips null and empty string fields</li>
  <li><strong>Remove <code>_links</code></strong> — removes the HAL links object</li>
  <li><strong>Remove <code>_embedded</code></strong> — removes sideloaded embed data</li>
</ul>

</details>

<details>
<summary>Custom Schema</summary>

<p>The <strong>custom schema</strong> replaces the full REST response with a hand-crafted property map. Define each top-level key you want in the response and map it to a dot-path from the original REST response (e.g. <code>"headline": "title.rendered"</code>).</p>
<p>Use this mode to produce a minimal, application-specific payload that hides WordPress internals entirely.</p>

</details>

<details>
<summary>Test</summary>

<p>The <strong>Test</strong> tab fetches a live sample entry from WordPress and displays the raw REST response alongside the transformed result side by side. Use it to verify your schema before deploying — no external request needed.</p>
<p>The test uses the first available entry of the model's object type and runs the full transform pipeline.</p>

</details>

---

**Entry type:** Model (Post type or Taxonomy)

- [MUI DataGrid — sorting, filtering &amp; pagination](https://mui.com/x/react-data-grid/)

---

## FAQ

**Can I define one model per post type and one per taxonomy?**

Yes. Each model is scoped to a single object type. You can have separate models for `post`, `page`, custom post types, and any REST-exposed taxonomy.

**Do models affect all REST consumers?**

Models apply globally to the standard WP REST API (`/wp/v2/`). They do not affect custom endpoints or the admin API. Per-application overrides can be set via the `rest_firewall_model_context` filter.

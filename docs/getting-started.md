# Getting Started

## Installation

### 1. Clone the repository

```bash
cd wp-content/plugins/
git clone https://github.com/AfterglowWeb/wordpress-rest-api-firewall.git rest-api-firewall
cd rest-api-firewall
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install JS dependencies and build

```bash
npm install
npm run build
```

or with Yarn:

```bash
yarn
yarn build
```

### 4. Activate the plugin

Go to **WordPress Admin → Plugins** and activate **WordPress Application Layer**.

---

## First Configuration

After activation, a new **Application Layer** menu item appears in the WordPress admin sidebar.

### Recommended first steps

1. **Global Security tab** — enable the hardening options relevant to your setup (disable XML-RPC, secure wp-config.php, etc.).
2. **Auth & Rate Limiting tab** — optionally add users and assign rate limits if you want to restrict REST API access.
3. **Properties tab** — optionally create a Model for your post types to clean up REST responses.

---

## Development Server (plugin JS)

To develop the admin UI with hot reload:

```bash
npm run start
```

Make sure WordPress is running locally (e.g. via Local by Flywheel).

---

## Documentation Site (VitePress)

To preview the documentation site locally:

```bash
npm run docs:dev
```

The docs site runs at `http://localhost:5173` and hot-reloads on any `.md` change.

To build the static site for deployment:

```bash
npm run docs:build
```

Output goes to `docs/.vitepress/dist/` and is automatically deployed to GitHub Pages on every push to `main`.

---

## Optional: Deploy the Headless Theme

The plugin ships with a blank headless WordPress theme.

1. Go to the **Theme** tab in the plugin admin.
2. Click **Deploy** to install the theme.
3. Activate it from **Appearance → Themes**.

The blank theme redirects all front-end template requests, giving you full control of the front-end from your JS application.

---

## Multisite

The plugin is compatible with WordPress multisite installations. Options are stored per-site using `get_blog_option` / `update_blog_option`.

---

## Updating

```bash
git pull origin main
composer install
npm run build
```

If the plugin admin shows a **Database Schema — Update required** notice after updating, click **Run Update** in the **Configuration** tab.

# Getting Started

## Installation

1. Download or clone this repository into your `wp-content/themes/` directory:
```bash
cd wp-content/themes/
git clone https://github.com/AfterglowWeb/wordpress-headless-theme.git blank
```

2. Activate the theme from WordPress admin panel

3. Setup a WordPress application password in an administrator user profile

4. Go through the setup options in the theme admin page located at the bottom of the admin menu.

### Optional 

5. Create a child theme

6. Configure custom post types, taxonomies, and menus using JSON files in ``blank-child/config` directory (see Configuration section)

## Authentication - WordPress Application Password

Blank theme uses **WordPress Application Passwords**. In WordPress, you can setup application passwords in the user profiles.
By default, the theme validates the application password against **User ID 1** (typically the site administrator).

1. Go to **Users > Profile** in WordPress admin
2. Scroll to **Application Passwords** section
3. Create a new application password
4. **Important:** Copy the generated token 
5. Store it in your client application environement file (typically .env)
   ```
   WORDPRESS_BEARER_TOKEN=abcd efg hijk lmnop
   ```
6. Use it in your API requests with pipe delimiter format: `Bearer|token`

```bash
curl -H "Authorization: Bearer|abcd efg hijk lmnop" \
     https://your-site.com/wp-json/blank/v1/data
```

## REST API Endpoints

The theme provides **3 custom REST API endpoint** intended to serve only necessary data.
  - `/blank/v1/data`
  - `/blank/v1/<post_type>`
  - `/blank/v1/<post_type>/images`

Combined with the Posts per page setting in the theme option page, this speedup data and assets scrapping from your application.

### GET /wp-json/blank/v1/data

Provides site identity and menu data. 
Provides ACF options page fields if ACF support is activated in admin page.

**Response:**
```json
{
  "menus": {
    "main_menu": [...],
    "footer_menu": [...]
  },
  "identity": {
    "name": "Site Name",
    "description": "Site Description",
    "url": "https://your-site.com",
    "favicon": "https://your-site.com/favicon.ico",
    {..."acf_fields"}
  }
}
```

### GET /wp-json/blank/v1/{post_type}

**Description:**  
Provides flatten post objects containing the `post_type` parameter.

**Parameters:**
- `post_type` (string, required)

### GET /wp-json/blank/v1/{post_type}/images

**Description:**  
Provides flatten attachment objects attached to posts containing the `post_type` parameter.
The attachments src are filtered out to remove site domain and upload folder.

The posts are explored for:
- Post featured attachment, 
- ACF image and gallery fields

**Parameters:**
- `post_type` (string, required)

**Response**
```json
[
  {
    "id": 123,
    "src": "2025/01/image.jpg",
    "alt": "Image alt text",
    "width": 1200,
    "height": 800,
    "mime_type": "image/jpeg",
    "post_id": 122,
    "field_key": "featured_image"
  },
  ...
]
```

## Post Types, Menus and Taxonomies Configuration

### Custom Taxonomies

Define taxonomies in `config/custom_taxonomies.json`:

```json
{
  "custom_taxonomies": [
    {
      "slug": "portfolio-category",
      "singular_name": "Portfolio Category",
      "plural_name": "Portfolio Categories",
      "post_types": ["portfolio"]
    }
  ]
}
```

### Custom Post Types

Define custom post types in `config/custom_posts.json`:

```json
{
  "custom_posts": [
    {
      "slug": "portfolio",
      "singular_name": "Portfolio Item",
      "plural_name": "Portfolio Items",
      "public": true,
      "show_in_rest": true,
      "supports": ["title", "editor", "thumbnail", "excerpt"]
    }
  ]
}
```

### Custom Menus

Define navigation menus in `config/custom_menus.json`:

```json
{
  "custom_menus": [
    {
      "slug": "main-menu",
      "name": "Main Menu"
    },
    {
      "slug": "footer-menu",
      "name": "Footer Menu"
    }
  ]
}
```

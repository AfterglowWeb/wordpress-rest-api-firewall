# Blank – Headless WordPress Theme

Blank is a WordPress theme designed exclusively for headless usage. It acts as a secure and simplifier data layer for headless WordPress architectures. It integrates seamlessly with external front-end applications built with Next.js, React, Vue, or any other framework capable of consuming a REST API.

Blank can be configured to exposes flattened posts, attachments, menus, and site identity through custom REST API endpoints, protected by reinforced WordPress application authentication. It can also be configured to send data to your application via webhooks.

By default, Blank redirect all WordPress templates to a blank home page. It is then up to you to deploy the theme behind a bridge (such as a front-end application or proxy).

## Admin Options

From the WordPress admin interface, you can configure the following options:

- Select post types to be exposed

- Flatten post types: works like the _fields and _embed REST parameters. The goals are to narrow down the number of relevant fields, resolve author, term, and attachment relationships on the server side, and remove the need to construct complex queries on the front end.

- Restrict WordPress application credentials to a single user

- Rate-limit the WordPress application user

- Restrict and rate-limit front-facing wp/v2 endpoints

- Disable Gutenberg

- Disable comments

- Limit image file size

- Set up a webhook to send payloads to your front-end application

- Enable Advanced Custom Fields (ACF) support on flattened data (posts, terms, attachments, options page)

## Further Setup

You can use JSON files located in ./config/custom_*.json to:

- Define custom post types

- Define custom taxonomies

- Define custom menus

To ensure that your configuration files are preserved across Blank theme updates, you should create a child theme and add a config directory at its root, for example: `blank-child/config`
You can then copy the configuration files from the parent theme into this directory and customize them as needed.

A list of available filter hooks is provided below for further customization.
If you plan to extend this approach, it is recommended to create a child theme.

## Requirements

- **WordPress:** 6.0 or higher
- **PHP:** 7.4 or higher

## ChangeLog

### version 1.0.4

- Complete refactorisation

### version 1.0.3b

 - Added all front templates redirect to home_url() in cmk\RestApiFirewall\Theme::redirect_front_pages(), can be controlled through `rest_firewall_redirect_url`.
 - Added class cmk\RestApiFirewall\Cache to provide a webhook to flush application cache.
 - Added filters: `rest_firewall_application_host`, `rest_firewall_application_webhook_endpoint`
 - Added mandatory password identifier.

### version 1.0.2b

 - Added Composer support for autoloading and linting.
 - Fixed issue with copying language files using WP_Filesystem API.
 - Using '_wp_attached_file' meta key to get the relative src of the image.
 - Endpoint posts by <post_type> with bearer token and props filtering.
 
### version 1.0.1

 - Added filter on menu items 'rest_firewall_model_menu_item' to allow modification of individual menu items before returning in REST API.
 - Added endpoint '/images/{post_type}' to fetch flattened list of images used in specified post type.
 - Changed filter name from 'cmk_rest_api_allowed_post_types' to 'rest_api_allowed_post_types' for consistency.
 - Added filter 'rest_firewall_model_image' to allow modification of image properties before returning in REST API.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Credits

Developed by [Cédric Moris Kelly](https://www.moris-kelly.com)

## License

This theme is licensed under the **GNU General Public License v2 or later**.

See [LICENSE](http://www.gnu.org/licenses/gpl-2.0.html) for more details.

## Related Resources

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [WordPress Application Passwords](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/)

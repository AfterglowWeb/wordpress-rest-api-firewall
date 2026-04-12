<?php namespace cmk\RestApiFirewall;

/**
 * Application Layer
 *
 * @package Application Layer
 * @author  Cédric Moris Kelly
 *
 * @wordpress-plugin
 * Plugin Name:       WP Application Layer
 * Version:           0.1.0-alpha.8
 * Description:       Secure REST API endpoints through authentication, rate limiting and much more. Set application Webhook with authentication to trigger external front-end application routines.
 * Tags:              firewall, rest, api, application, webhook
 * Plugin URI:        https://www.abc-plugins.com/wordpress-rest-api-firewall
 * Author:            Cédric Moris Kelly
 * Author URI:        https://www.moriskelly.com
 * Update URI:        https://www.abc-plugins.com/wordpress-rest-api-firewall
 * Text Domain:       rest-api-firewall
 * Domain Path:       /languages
 * Requires PHP:      7.4
 * Requires at least: 6.0
 * Tested up to:      6.9.1
 * License: GNU General Public License v2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */

defined( 'ABSPATH' ) || exit;

define( 'REST_API_FIREWALL_VERSION', '0.1.0-alpha.8' );
define( 'REST_API_FIREWALL_DIR', plugin_dir_path( __FILE__ ) );
define( 'REST_API_FIREWALL_URL', plugin_dir_url( __FILE__ ) );
define( 'REST_API_FIREWALL_FILE', __FILE__ );

if ( file_exists( REST_API_FIREWALL_DIR . '/vendor/autoload.php' ) ) {
	require_once REST_API_FIREWALL_DIR . '/vendor/autoload.php';
} else {
	add_action(
		'admin_notices',
		function (): void {
			echo '<div class="notice notice-error"><p>';
			echo esc_html__( 'Application Layer encountered an error and could not be activated.', 'rest-api-firewall' );
			echo '</p></div>';
		}
	);
	return;
}

add_action(
	'admin_notices',
	function (): void {
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_data = get_plugin_data( REST_API_FIREWALL_FILE );

		if ( ! is_array( $plugin_data ) ) {
			return;
		}

		$requires_wp  = $plugin_data['RequiresWP'] ?? '';
		$requires_php = $plugin_data['RequiresPHP'] ?? '';

		if ( empty( $requires_wp ) && empty( $requires_php ) ) {
			return;
		}

		if ( ! Core\Utils::is_current_screen( 'plugins' ) ) {
			return;
		}

		if ( $requires_wp && version_compare( get_bloginfo( 'version' ), $requires_wp, '<' ) ) {
			echo '<div class="notice notice-error"><p>';
			/* translators: %s is the WordPress version */
			printf( esc_html__( 'Application Layer requires WordPress version %s.', 'rest-api-firewall' ), esc_html( $requires_wp ) );
			echo '</p></div>';
		}

		if ( $requires_php && version_compare( PHP_VERSION, $requires_php, '<' ) ) {
			echo '<div class="notice notice-error"><p>';
			/* translators: %s is the PHP version */
			printf( esc_html__( 'Application Layer requires PHP version %s.', 'rest-api-firewall' ), esc_html( $requires_php ) );
			echo '</p></div>';
		}
	}
);

register_activation_hook( __FILE__, array( Core\Bootstrap::class, 'activate' ) );

register_deactivation_hook( __FILE__, array( Core\Bootstrap::class, 'deactivate' ) );

add_action(
	'init',
	function (): void {
		load_plugin_textdomain(
			'rest-api-firewall',
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages'
		);
	}
);

add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	function ( array $links ): array {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			admin_url( 'admin.php?page=rest-api-firewall-admin' ),
			esc_html__( 'Settings', 'rest-api-firewall' )
		);
		array_unshift( $links, $settings_link );
		return $links;
	}
);

add_action(
	'plugins_loaded',
	function (): void {
		Core\Bootstrap::init();

		if ( is_admin() ) {
			Admin\AdminBootstrap::init();
		}
	},
	10
);

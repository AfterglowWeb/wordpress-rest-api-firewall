<?php namespace cmk\RestApiFirewall\GlobalSecurity;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\FileUtils;

class DisableBase {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {

		if ( true === CoreOptions::read_option( 'theme_disable_xmlrpc' ) ) {
			add_filter( 'xmlrpc_enabled', '__return_false' );
		}

		if ( true === CoreOptions::read_option( 'theme_disable_sitemap' ) ) {
			add_filter( 'wp_sitemaps_enabled', '__return_false' );
			remove_action( 'init', 'wp_sitemaps_get_server' );
		}

		if ( true === CoreOptions::read_option( 'theme_disable_pingbacks' ) ) {
			add_filter(
				'wp_headers',
				function ( $headers ) {
					if ( isset( $headers['X-Pingback'] ) ) {
						unset( $headers['X-Pingback'] );
					}
					return $headers;
				}
			);
			add_filter(
				'xmlrpc_methods',
				function ( $methods ) {
					if ( isset( $methods['pingback.ping'] ) ) {
						unset( $methods['pingback.ping'] );
					}
					return $methods;
				}
			);
		}
	}
}

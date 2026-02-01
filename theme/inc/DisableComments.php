<?php namespace cmk\RestApiFirewall\Theme;

use cmk\RestApiFirewall\Core\CoreOptions;

defined( 'ABSPATH' ) || exit;

class DisableComments {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {

		if ( true === CoreOptions::read_option('theme_disable_comments' ) ) {
			add_filter( 'comments_open', '__return_false', 20, 2 );
			add_filter( 'pings_open', '__return_false', 20, 2 );
			add_filter( 'comments_array', '__return_empty_array', 10, 2 );
		}
		
		add_action(
			'admin_init',
			function (): void {

				if ( empty( CoreOptions::read_option('theme_disable_comments' ) ) ) {
					return;
				}

				if ( ! wp_doing_ajax() ) {
					remove_menu_page( 'edit-comments.php' );
				}
				if ( is_admin_bar_showing() ) {
					remove_action( 'admin_bar_menu', 'wp_admin_bar_comments_menu', 60 );
				}

				global $pagenow;
				if ( 'edit-comments.php' === $pagenow ) {
					wp_safe_redirect( apply_filters( 'allowed_redirect_hosts', admin_url() ) );
					exit;
				}

				foreach ( get_post_types() as $post_type ) {
					if ( post_type_supports( $post_type, 'comments' ) ) {
						remove_post_type_support( $post_type, 'comments' );
						remove_post_type_support( $post_type, 'trackbacks' );
					}
				}

		});

		add_action(
			'init',
			function (): void {

				if ( empty( CoreOptions::read_option('theme_disable_comments' ) ) ) {
					return;
				}

				foreach ( get_post_types() as $post_type ) {
					if ( post_type_supports( $post_type, 'comments' ) ) {
						remove_post_type_support( $post_type, 'comments' );
						remove_post_type_support( $post_type, 'trackbacks' );
					}
				}

			});
	}
}
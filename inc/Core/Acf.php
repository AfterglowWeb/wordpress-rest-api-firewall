<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;

class Acf {

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	protected static $instance = null;

	private function __construct() {

		if ( ! function_exists( 'get_fields' ) ) {
			return;
		}

		if ( true === CoreOptions::read_option( 'rest_firewall_with_acf_enabled' ) ) {
			add_filter( 'rest_firewall_model_post_acf', array( self::class, 'get_acf_fields' ), 10, 1 );
			add_filter( 'rest_firewall_model_term_acf', array( self::class, 'get_acf_fields' ), 10, 1 );
			add_filter( 'rest_firewall_model_menu_item_acf', array( self::class, 'get_acf_fields' ), 10, 1 );
			add_filter( 'rest_firewall_model_image_acf', array( self::class, 'get_acf_fields' ), 10, 1 );
			add_filter( 'rest_firewall_model_site_data_acf', array( self::class, 'get_acf_fields' ), 10, 1 );
		}
	}

	public static function get_acf_fields( int $object_id ): array {
		return function_exists( 'get_fields' ) ? (array) get_fields( $object_id ) : array();
	}
}

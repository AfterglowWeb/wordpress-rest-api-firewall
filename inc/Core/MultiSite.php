<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

class MultiSite {
	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}


    public static function is_multisite_mode(): bool {
		return is_multisite()
			&& apply_filters( 'rest_api_firewall_pro_multisite_enabled', false );
	}

	public static function multisite_get_option( string $option_key, array $default_value = array() ): array {
		if ( self::is_multisite_mode() ) {
			$value = get_site_option( $option_key, null );
		} else {
			$value = get_option( $option_key, null );
		}

		if ( ! is_array( $value ) ) {
			return $default_value;
		}

		return $value;
	}

	public static function multisite_update_option( string $option_key, $value ): bool {
		if ( self::is_multisite_mode() ) {
			return update_site_option( $option_key, $value );
		}

		return update_option( $option_key, $value );
	}

}
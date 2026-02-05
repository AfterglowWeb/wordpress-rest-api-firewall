<?php
namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\MultiSite;
use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Core\Utils;
use cmk\RestApiFirewall\Firewall\WordpressAuth;


class FirewallOptions {

	protected static $instance = null;

	private const OPTION_KEY = 'rest_firewall_options';

	private static ?array $cache = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_get_firewall_options', array( $this, 'ajax_get_firewall_options' ) );
		add_action( 'wp_ajax_save_firewall_options', array( $this, 'ajax_save_firewall_options' ) );

		add_action(
			'rest_firewall_options_updated',
			function ( array $new_user, array $old_user ) {
				if ( ( $new_user['user_id'] ?? 0 ) !== ( $old_user['user_id'] ?? 0 ) ) {
					WordpressAuth::sync_rest_api_user( $new_user['user_id'], $old_user['user_id'] );
				}
			},
			10,
			2
		);
	}

	private static function options_config(): array {
		return array(
			'enforce_auth'              => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'enforce_rate_limit'        => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'user_id'                   => array(
				'default_value'     => 0,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'rate_limit'                => array(
				'default_value'     => 30,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'rate_limit_time'           => array(
				'default_value'     => 60,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'rate_limit_release'        => array(
				'default_value'     => 300,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'rate_limit_blacklist'      => array(
				'default_value'     => 5,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'rate_limit_blacklist_time' => array(
				'default_value'     => 3600,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'policy'                    => array(
				'default_value'     => array(
					'nodes'  => array(),
					'routes' => array(),
				),
				'type'              => 'array',
				'sanitize_callback' => '',
			),
			'hide_user_routes'          => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
		);
	}

	public function ajax_get_firewall_options(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		wp_send_json_success( self::get_options(), 200 );
	}

	public function ajax_save_firewall_options(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		if ( ! isset( $_POST['data'] ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'No data provided', 'rest-api-firewall' ) ), 400 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		$options = Utils::json_decode( sanitize_text_field( wp_unslash( $_POST['data'] ) ) );
		if ( ! is_array( $options ) ) {
			wp_send_json_error( array( 'error' => esc_html__( 'Invalid options data', 'rest-api-firewall' ) ), 400 );
		}

		$updated = self::update_options( $options );

		wp_send_json_success( $updated, 200 );
	}

	public static function get_options(): array {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$stored      = get_option( self::OPTION_KEY, null );
		self::$cache = wp_parse_args( $stored, self::default_options() );

		return self::$cache;
	}

	public static function get_option( string $key ) {
		$options = self::get_options();
		return $options[ $key ] ?? null;
	}

	public static function update_options( array $new_options ): array {
		$current = self::get_options();
		$merged  = wp_parse_args( $new_options, $current );

		$sanitized = self::sanitize_options( $merged );

		MultiSite::multisite_update_option( self::OPTION_KEY, $sanitized );
		self::$cache = $sanitized;

		do_action( 'rest_firewall_options_updated', $sanitized, $current );

		return $sanitized;
	}

	public static function update_option( string $key, $value ): array {
		$sanitized = self::sanitize_option( $key, $value );

		$current         = self::get_options();
		$current[ $key ] = $sanitized;

		MultiSite::multisite_update_option( self::OPTION_KEY, $current );
		self::$cache = $current;

		do_action( 'rest_firewall_option_updated', $key, $sanitized, $current );

		return $current;
	}

	public static function flush(): void {
		self::$cache = null;
	}

	private static function default_options(): array {
		$defaults = array();

		foreach ( self::options_config() as $key => $config ) {
			$defaults[ $key ] = $config['default_value'];
		}

		return $defaults;
	}

	private static function sanitize_options( array $options ): array {
		$options_config = self::options_config();
		$default_values = self::default_options();

		$options   = wp_parse_args( $options, $default_values );
		$sanitized = array();

		foreach ( $options_config as $option_key => $config ) {
			$sanitized_key = sanitize_key( $option_key );
			$value         = $options[ $option_key ];

			$sanitized[ $sanitized_key ] = self::sanitize_option( $option_key, $value );
		}

		return $sanitized;
	}

	private static function sanitize_option( string $option_key, $option_value ) {
		$options_config = self::options_config();

		if ( ! isset( $options_config[ $option_key ] ) ) {
			return null;
		}

		$config   = $options_config[ $option_key ];
		$callback = $config['sanitize_callback'] ?? null;
		$type     = $config['type'] ?? 'string';

		if ( ! is_callable( $callback ) ) {
			return $config['default_value'] ? $config['default_value'] : null;

		}

		switch ( $type ) {
			case 'boolean':
				return (bool) call_user_func( $callback, $option_value );

			case 'integer':
				return (int) call_user_func( $callback, $option_value );

			case 'array':
				return is_array( $option_value )
					? array_map( $callback, $option_value )
					: array();

			case 'string':
			default:
				return (string) call_user_func( $callback, $option_value );
		}
	}
}

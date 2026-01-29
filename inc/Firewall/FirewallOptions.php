<?php
namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Firewall\Permissions;
use cmk\RestApiFirewall\Core\Permissions as AdminPermissions;

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
					Permissions::sync_rest_api_user( $new_user['user_id'], $old_user['user_id'] );
				}
			},
			10,
			2
		);
	}

	private static function options_config(): array {
		return array(
			'enforce_auth'       => array(
				'default_value'     => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'enforce_rate_limit' => array(
				'default_value'     => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'user_id'            => array(
				'default_value'     => 0,
				'sanitize_callback' => 'absint',
			),
			'rate_limit'         => array(
				'default_value'     => 30,
				'sanitize_callback' => 'absint',
			),
			'rate_limit_time'    => array(
				'default_value'     => 60,
				'sanitize_callback' => 'absint',
			),
			'policy'             => array(
				'default_value'     => array(
					'nodes'  => array(),
					'routes' => array(),
				),
				'sanitize_callback' => '',
			),
		);
	}

	public function ajax_get_firewall_options(): void {
		if ( false === AdminPermissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		wp_send_json_success( self::get_options(), 200 );
	}

	public function ajax_save_firewall_options(): void {
		if ( false === AdminPermissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = array();

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['enforce_auth'] ) ) {
			$options['enforce_auth'] = rest_sanitize_boolean( $_POST['enforce_auth'] );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['enforce_rate_limit'] ) ) {
			$options['enforce_rate_limit'] = rest_sanitize_boolean( $_POST['enforce_rate_limit'] );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['user_id'] ) ) {
			$options['user_id'] = absint( $_POST['user_id'] );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['rate_limit'] ) ) {
			$options['rate_limit'] = absint( $_POST['rate_limit'] );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['rate_limit_time'] ) ) {
			$options['rate_limit_time'] = absint( $_POST['rate_limit_time'] );
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

		update_option( self::OPTION_KEY, $sanitized, false );
		self::$cache = $sanitized;

		do_action( 'rest_firewall_options_updated', $sanitized, $current );

		return $sanitized;
	}

	public static function update_option( string $key, $value ): array {
		return self::update_options( array( $key => $value ) );
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
			case 'bool':
				return (bool) call_user_func( $callback, $option_value );

			case 'int':
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

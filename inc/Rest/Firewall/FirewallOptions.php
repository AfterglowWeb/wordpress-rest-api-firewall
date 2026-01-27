<?php
namespace cmk\RestApiFirewall\Rest\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Firewall\Permissions;
use cmk\RestApiFirewall\Admin\Permissions as AdminPermissions;

class FirewallOptions {

	protected static $instance = null;

	private const OPTION_KEY = 'rest_firewall_firewall_options';

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
			'rest_firewall_firewall_options_updated',
			function ( array $new, array $old ) {
				if ( ( $new['user_id'] ?? 0 ) !== ( $old['user_id'] ?? 0 ) ) {
					Permissions::sync_rest_api_user( $new['user_id'], $old['user_id'] );
				}
			},
			10,
			2
		);
	}

	public static function default_options(): array {
		return array(
			'enforce_auth'       => false,
			'enforce_rate_limit' => false,
			'user_id'            => 0,
			'rate_limit'         => 30,
			'rate_limit_time'    => 60,
			'policy'             => array(
				'nodes'  => array(),
				'routes' => array(),
			),
		);
	}

	public static function get_options(): array {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$stored = get_option( self::OPTION_KEY, null );
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

		do_action( 'rest_firewall_firewall_options_updated', $sanitized, $current );

		return $sanitized;
	}

	public static function update_option( string $key, $value ): array {
		return self::update_options( array( $key => $value ) );
	}

	public static function sanitize_options( array $options ): array {
		$defaults = self::default_options();

		return array(
			'enforce_auth'    => (bool) ( $options['enforce_auth'] ?? $defaults['enforce_auth'] ),
			'enforce_rate_limit'    => (bool) ( $options['enforce_rate_limit'] ?? $defaults['enforce_rate_limit'] ),
			'user_id'         => absint( $options['user_id'] ?? $defaults['user_id'] ),
			'rate_limit'      => absint( $options['rate_limit'] ?? $defaults['rate_limit'] ),
			'rate_limit_time' => absint( $options['rate_limit_time'] ?? $defaults['rate_limit_time'] ),
			'policy'          => array(
				'nodes'  => is_array( $options['policy']['nodes'] ?? null ) ? $options['policy']['nodes'] : array(),
				'routes' => is_array( $options['policy']['routes'] ?? null ) ? $options['policy']['routes'] : array(),
			),
		);
	}

	public static function flush(): void {
		self::$cache = null;
	}

	public function ajax_get_firewall_options(): void {
		if ( false === AdminPermissions::validate_ajax_crud_rest_api_firewall_options() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = self::get_options();

		// Policy is loaded separately with routes.
		$response = array(
			'enforce_auth'       => $options['enforce_auth'],
			'enforce_rate_limit' => $options['enforce_rate_limit'],
			'user_id'            => $options['user_id'],
			'rate_limit'         => $options['rate_limit'],
			'rate_limit_time'    => $options['rate_limit_time'],
		);

		wp_send_json_success( $response, 200 );
	}

	public function ajax_save_firewall_options(): void {
		if ( false === AdminPermissions::validate_ajax_crud_rest_api_firewall_options() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = array();

		if ( isset( $_POST['enforce_auth'] ) ) {
			$options['enforce_auth'] = rest_sanitize_boolean( $_POST['enforce_auth'] );
		}

		if ( isset( $_POST['enforce_rate_limit'] ) ) {
			$options['enforce_rate_limit'] = rest_sanitize_boolean( $_POST['enforce_rate_limit'] );
		}

		if ( isset( $_POST['user_id'] ) ) {
			$options['user_id'] = absint( $_POST['user_id'] );
		}

		if ( isset( $_POST['rate_limit'] ) ) {
			$options['rate_limit'] = absint( $_POST['rate_limit'] );
		}

		if ( isset( $_POST['rate_limit_time'] ) ) {
			$options['rate_limit_time'] = absint( $_POST['rate_limit_time'] );
		}

		$updated = self::update_options( $options );

		wp_send_json_success( $updated, 200 );
	}

	/**
	 * Update only the policy part (called from RoutesRepository)
	 */
	public static function save_policy( array $policy ): void {
		$current = self::get_options();
		$current['policy'] = array(
			'nodes'  => $policy['nodes'] ?? array(),
			'routes' => $policy['routes'] ?? array(),
		);

		update_option( self::OPTION_KEY, $current, false );
		self::$cache = $current;
	}

	/**
	 * Get only the policy part
	 */
	public static function get_policy(): array {
		$options = self::get_options();
		return $options['policy'] ?? array( 'nodes' => array(), 'routes' => array() );
	}
}

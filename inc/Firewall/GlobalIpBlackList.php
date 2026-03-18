<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Firewall\IpBlackList;
use cmk\RestApiFirewall\Firewall\IpFilter\IpEntryRepository;
use WP_Error;
use Exception;

/**
 * Global IP blacklist — runs before application resolution.
 * Blocks known bad actors (bots, malicious IPs, attack-origin countries) for all applications.
 */
class GlobalIpBlackList {

	protected static $instance = null;

	private const OPTION_KEY = 'rest_firewall_global_ip_filter';

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_get_global_ip_filter',  array( $this, 'ajax_get_global_ip_filter' ) );
		add_action( 'wp_ajax_save_global_ip_filter', array( $this, 'ajax_save_global_ip_filter' ) );
	}

	public static function default_options(): array {
		return array(
			'enabled'        => false,
			'expiry_seconds' => 0,
		);
	}

	public static function get_options(): array {
		$stored = get_option( self::OPTION_KEY, null );
		return wp_parse_args( $stored, self::default_options() );
	}

	public static function get_option( string $key ) {
		return self::get_options()[ $key ] ?? null;
	}

	public static function update_options( array $new_options ): array {
		$current   = self::get_options();
		$merged    = wp_parse_args( $new_options, $current );
		$sanitized = self::sanitize_options( $merged );
		update_option( self::OPTION_KEY, $sanitized, false );
		return $sanitized;
	}

	public static function sanitize_options( array $options ): array {
		$defaults = self::default_options();

		return array(
			'enabled'        => (bool) ( $options['enabled'] ?? $defaults['enabled'] ),
			'expiry_seconds' => absint( $options['expiry_seconds'] ?? $defaults['expiry_seconds'] ),
		);
	}

	public static function check_request() {
		$client_ip = IpBlackList::get_client_ip();
		$options   = self::get_options();

		if ( ! $options['enabled'] ) {
			return true;
		}

		if ( self::has_pro_features() ) {
			return self::check_with_pro( $client_ip, $options );
		}

		if ( IpEntryRepository::ip_in_list( $client_ip, 'global_blacklist' ) ) {
			return new WP_Error(
				'ip_globally_blacklisted',
				__( 'Your IP address has been blocked.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	private static function has_pro_features(): bool {
		return CoreOptions::is_pro_active() &&
			class_exists( 'cmk\RestApiFirewallPro\Firewall\IpFilter\GlobalIpFilterPro' ) &&
			method_exists( 'cmk\RestApiFirewallPro\Firewall\IpFilter\GlobalIpFilterPro', 'check_request_global' );
	}

	private static function check_with_pro( string $client_ip, array $options ) {
		try {
			$pro_class = 'cmk\RestApiFirewallPro\Firewall\IpFilter\GlobalIpFilterPro';
			return call_user_func( array( $pro_class, 'check_request_global' ), $client_ip, $options );
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
			return true;
		}
	}

	public function ajax_get_global_ip_filter(): void {
		do_action( 'rest_api_firewall_ajax_get_global_ip_filter' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = self::get_options();

		wp_send_json_success(
			array(
				'enabled'        => $options['enabled'],
				'expiry_seconds' => $options['expiry_seconds'],
				'client_ip'      => IpBlackList::get_client_ip(),
			),
			200
		);
	}

	public function ajax_save_global_ip_filter(): void {
		do_action( 'rest_api_firewall_ajax_save_global_ip_filter' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = array();

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( isset( $_POST['enabled'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$options['enabled'] = rest_sanitize_boolean( wp_unslash( $_POST['enabled'] ) );
		}

		$updated = self::update_options( $options );

		wp_send_json_success( $updated, 200 );
	}
}

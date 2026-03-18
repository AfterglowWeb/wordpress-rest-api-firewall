<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Firewall\GeoIpService;
use cmk\RestApiFirewall\Firewall\IpFilter\IpEntryRepository;
use League\ISO3166\ISO3166;
use WP_Error;
use Exception;

class IpBlackList {

	protected static $instance = null;

	private const OPTION_KEY                = 'rest_firewall_ip_filter';
	private const AUTO_BLACKLIST_KEY_PREFIX = 'rest_firewall_auto_blacklist_';

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_get_ip_filter', array( $this, 'ajax_get_ip_filter' ) );
		add_action( 'wp_ajax_save_ip_filter', array( $this, 'ajax_save_ip_filter' ) );
		add_action( 'wp_ajax_get_ip_entries', array( $this, 'ajax_get_ip_entries' ) );
		add_action( 'wp_ajax_add_ip_entry', array( $this, 'ajax_add_ip_entry' ) );
		add_action( 'wp_ajax_delete_ip_entry', array( $this, 'ajax_delete_ip_entry' ) );
		add_action( 'wp_ajax_delete_ip_entries', array( $this, 'ajax_delete_ip_entries' ) );
			add_action( 'wp_ajax_get_country_stats', array( $this, 'ajax_get_country_stats' ) );
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
		$client_ip = self::get_client_ip();

		if ( self::is_auto_blacklisted( $client_ip ) ) {
			return new WP_Error(
				'ip_auto_blacklisted',
				__( 'Your IP address has been temporarily blocked due to excessive requests.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		$options = self::get_options();

		if ( ! $options['enabled'] ) {
			return true;
		}

		if ( self::has_pro_features() ) {
			return self::check_with_pro( $client_ip, $options );
		}

		if ( IpEntryRepository::ip_in_list( $client_ip, 'blacklist' ) ) {
			return new WP_Error(
				'ip_blacklisted',
				__( 'Your IP address has been blocked.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	private static function has_pro_features(): bool {
		return CoreOptions::is_pro_active() &&
			class_exists( 'cmk\RestApiFirewallPro\Firewall\IpFilter\IpFilterPro' ) &&
			method_exists( 'cmk\RestApiFirewallPro\Firewall\IpFilter\IpFilterPro', 'check_request_pro' );
	}

	private static function check_with_pro( string $client_ip, array $options ) {
		try {
			$pro_class = 'cmk\RestApiFirewallPro\Firewall\IpFilter\IpFilterPro';
			return call_user_func( array( $pro_class, 'check_request_pro' ), $client_ip, $options );
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
			return true;
		}
	}

	public static function ip_in_cidr( string $ip, string $cidr ): bool {
		list( $subnet, $mask ) = explode( '/', $cidr );

		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) &&
			filter_var( $subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {

			$ip_long     = ip2long( $ip );
			$subnet_long = ip2long( $subnet );
			$mask_long   = -1 << ( 32 - (int) $mask );

			return ( $ip_long & $mask_long ) === ( $subnet_long & $mask_long );
		}

		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) &&
			filter_var( $subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {

			$ip_bin     = inet_pton( $ip );
			$subnet_bin = inet_pton( $subnet );
			$mask       = (int) $mask;
			$mask_bin   = str_repeat( "\xff", (int) ( $mask / 8 ) );

			if ( $mask % 8 ) {
				$mask_bin .= chr( 256 - pow( 2, 8 - ( $mask % 8 ) ) );
			}

			$mask_bin = str_pad( $mask_bin, 16, "\x00" );

			return ( $ip_bin & $mask_bin ) === ( $subnet_bin & $mask_bin );
		}

		return false;
	}

	public static function is_valid_ip_or_cidr( string $entry ): bool {
		if ( strpos( $entry, '/' ) !== false ) {
			return self::is_valid_cidr( $entry );
		}

		return filter_var( $entry, FILTER_VALIDATE_IP ) !== false;
	}

	public static function is_valid_cidr( string $cidr ): bool {
		$parts = explode( '/', $cidr );

		if ( count( $parts ) !== 2 ) {
			return false;
		}

		list( $ip, $mask ) = $parts;

		if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return false;
		}

		$mask = (int) $mask;

		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			return $mask >= 0 && $mask <= 32;
		}

		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
			return $mask >= 0 && $mask <= 128;
		}

		return false;
	}

	public static function get_client_ip(): string {
		$headers = array(
			'HTTP_CF_CONNECTING_IP',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_REAL_IP',
			'REMOTE_ADDR',
		);

		foreach ( $headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) );

				if ( strpos( $ip, ',' ) !== false ) {
					$ip = trim( explode( ',', $ip )[0] );
				}

				if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
					return $ip;
				}
			}
		}

		return '0.0.0.0';
	}

	public static function is_auto_blacklisted( string $ip ): bool {
		return (bool) get_transient( self::AUTO_BLACKLIST_KEY_PREFIX . md5( $ip ) );
	}

	public static function auto_blacklist_ip( string $ip, int $duration ): void {
		set_transient( self::AUTO_BLACKLIST_KEY_PREFIX . md5( $ip ), time(), $duration );
	}

	public static function remove_auto_blacklist( string $ip ): void {
		delete_transient( self::AUTO_BLACKLIST_KEY_PREFIX . md5( $ip ) );
	}

	public function ajax_get_ip_filter(): void {
		do_action( 'rest_api_firewall_ajax_get_ip_filter' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = self::get_options();

		wp_send_json_success(
			array(
				'enabled'        => $options['enabled'],
				'expiry_seconds' => $options['expiry_seconds'],
				'client_ip'      => self::get_client_ip(),
			),
			200
		);
	}

	public function ajax_save_ip_filter(): void {
		do_action( 'rest_api_firewall_ajax_save_ip_filter' );

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

	public function ajax_get_ip_entries(): void {
		do_action( 'rest_api_firewall_ajax_get_ip_entries' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$list_type = isset( $_POST['list_type'] ) ? sanitize_text_field( wp_unslash( $_POST['list_type'] ) ) : 'blacklist';

		$result = IpEntryRepository::get_entries( array( 'list_type' => $list_type ) );

		wp_send_json_success( array( 'entries' => $result['entries'] ?? array() ), 200 );
	}

	public function ajax_add_ip_entry(): void {
		do_action( 'rest_api_firewall_ajax_add_ip_entry' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$ip        = isset( $_POST['ip'] ) ? sanitize_text_field( wp_unslash( $_POST['ip'] ) ) : '';
		$list_type = isset( $_POST['list_type'] ) ? sanitize_text_field( wp_unslash( $_POST['list_type'] ) ) : 'blacklist';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( empty( $ip ) || ! self::is_valid_ip_or_cidr( $ip ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid IP address', 'rest-api-firewall' ) ), 400 );
		}

		if ( IpEntryRepository::find_by_ip( $ip, $list_type ) ) {
			wp_send_json_error( array( 'message' => __( 'IP already in list', 'rest-api-firewall' ) ), 400 );
		}

		$expiry_seconds = (int) self::get_options()['expiry_seconds'];
		$expires_at     = $expiry_seconds > 0
			? gmdate( 'Y-m-d H:i:s', time() + $expiry_seconds )
			: null;

		$data = array(
			'ip'         => $ip,
			'list_type'  => $list_type,
			'entry_type' => 'manual',
			'expires_at' => $expires_at,
		);

		$geoip = GeoIpService::get_geoip( $ip );
		if ( $geoip ) {
			$data['country_code'] = $geoip['country'] ?? null;
			$data['country_name'] = $geoip['countryName'] ?? null;
		}

		$id = IpEntryRepository::insert( $data );

		if ( ! $id ) {
			wp_send_json_error( array( 'message' => __( 'Failed to add IP entry', 'rest-api-firewall' ) ), 500 );
		}

		$entry = IpEntryRepository::find_by_ip( $ip, $list_type );

		wp_send_json_success( array( 'entry' => $entry ), 201 );
	}

	public function ajax_delete_ip_entry(): void {
		do_action( 'rest_api_firewall_ajax_delete_ip_entry' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;

		if ( ! $id ) {
			wp_send_json_error( array( 'message' => __( 'Entry ID required', 'rest-api-firewall' ) ), 400 );
		}

		$deleted = IpEntryRepository::delete( $id );

		if ( ! $deleted ) {
			wp_send_json_error( array( 'message' => __( 'Entry not found', 'rest-api-firewall' ) ), 404 );
		}

		wp_send_json_success( array( 'deleted' => true ), 200 );
	}

	public function ajax_delete_ip_entries(): void {
		do_action( 'rest_api_firewall_ajax_delete_ip_entries' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$ids = isset( $_POST['ids'] ) ? sanitize_text_field( wp_unslash( $_POST['ids'] ) ) : array();
		if ( is_string( $ids ) ) {
			$ids = json_decode( $ids, true );
		}

		if ( ! is_array( $ids ) || empty( $ids ) ) {
			wp_send_json_error( array( 'message' => __( 'No entries selected', 'rest-api-firewall' ) ), 400 );
		}

		$count = IpEntryRepository::delete_many( $ids );

		wp_send_json_success( array( 'deleted' => $count ), 200 );
	}

	public static function get_all_countries(): array {
		$custom_names = array(
			'XC' => 'Northern Cyprus',
			'XO' => 'South Ossetia',
		);

		$iso3166   = new ISO3166();
		$countries = array();

		foreach ( $iso3166->all() as $entry ) {
			$code        = $entry['alpha2'];
			$countries[] = array(
				'country_code' => $code,
				'country_name' => $custom_names[ $code ] ?? $entry['name'],
			);
		}

		// XC and XO are not in the ISO standard — append them.
		foreach ( $custom_names as $code => $name ) {
			if ( ! in_array( $code, array_column( $countries, 'country_code' ), true ) ) {
				$countries[] = array(
					'country_code' => $code,
					'country_name' => $name,
				);
			}
		}

		usort( $countries, fn( $a, $b ) => strcmp( $a['country_name'], $b['country_name'] ) );

		return $countries;
	}

	public function ajax_get_country_stats(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$list_type = isset( $_POST['list_type'] ) ? sanitize_text_field( wp_unslash( $_POST['list_type'] ) ) : 'blacklist';

		$stats = IpEntryRepository::get_country_stats( $list_type );

		wp_send_json_success(
			array(
				'countries'         => self::get_all_countries(),
				'stats'             => $stats,
				'blocked_countries' => array(),
			),
			200
		);
	}
}

<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Permissions;
use WP_Error;

class IpBlackList {

	protected static $instance = null;

	private const OPTION_KEY = 'rest_firewall_ip_filter';

	private static ?array $cache = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_get_ip_filter', array( $this, 'ajax_get_ip_filter' ) );
		add_action( 'wp_ajax_save_ip_filter', array( $this, 'ajax_save_ip_filter' ) );
	}

	public static function default_options(): array {
		return array(
			'enabled'   => false,
			'mode'      => 'blacklist',
			'blacklist' => array(),
		);
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
		$current   = self::get_options();
		$merged    = wp_parse_args( $new_options, $current );
		$sanitized = self::sanitize_options( $merged );

		update_option( self::OPTION_KEY, $sanitized, false );
		self::$cache = $sanitized;

		return $sanitized;
	}

	public static function sanitize_options( array $options ): array {
		$defaults = self::default_options();

		return array(
			'enabled'   => (bool) ( $options['enabled'] ?? $defaults['enabled'] ),
			'mode'      => 'blacklist' ,
			'blacklist' => self::sanitize_ip_list( $options['blacklist'] ?? array() ),
		);
	}

	private static function sanitize_ip_list( $ip_list ): array {
		if ( ! is_array( $ip_list ) ) {
			$ip_list = array_filter( array_map( 'trim', explode( "\n", (string) $ip_list ) ) );
		}

		$sanitized = array();

		foreach ( $ip_list as $entry ) {
			$entry = trim( sanitize_text_field( $entry ) );

			if ( empty( $entry ) ) {
				continue;
			}

			if ( self::is_valid_ip_or_cidr( $entry ) ) {
				$sanitized[] = $entry;
			}
		}

		return array_unique( $sanitized );
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

	/**
	 * Check if the current request IP should be blocked.
	 *
	 * @return true|\WP_Error True if allowed, WP_Error if blocked.
	 */
	public static function check_request() {
		$options = self::get_options();

		if ( ! $options['enabled'] ) {
			return true;
		}

		$client_ip = self::get_client_ip();
		
		$blacklist = $options['blacklist'];

		if ( self::ip_in_list( $client_ip, $blacklist ) ) {
			return new WP_Error(
				'ip_blacklisted',
				__( 'Your IP address has been blocked.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	public static function ip_in_list( string $ip, array $ip_list ): bool {
		foreach ( $ip_list as $entry ) {
			if ( strpos( $entry, '/' ) !== false ) {
				if ( self::ip_in_cidr( $ip, $entry ) ) {
					return true;
				}
			} elseif ( $ip === $entry ) {
				return true;
			}
		}

		return false;
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

			$mask_bin = str_repeat( "\xff", (int) ( $mask / 8 ) );

			if ( $mask % 8 ) {
				$mask_bin .= chr( 256 - pow( 2, 8 - ( $mask % 8 ) ) );
			}

			$mask_bin = str_pad( $mask_bin, 16, "\x00" );

			return ( $ip_bin & $mask_bin ) === ( $subnet_bin & $mask_bin );
		}

		return false;
	}

	public static function get_client_ip(): string {
		$headers = array(
			'HTTP_CF_CONNECTING_IP', // Cloudflare.
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_REAL_IP',
			'REMOTE_ADDR',
		);

		foreach ( $headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) );

				// X-Forwarded-For can contain multiple IPs, take the first.
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

	public static function flush(): void {
		self::$cache = null;
	}

	public function ajax_get_ip_filter(): void {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options   = self::get_options();
		$client_ip = self::get_client_ip();

		$response = array(
			'enabled'   => $options['enabled'],
			'mode'      => $options['mode'],
			'blacklist' => $options['blacklist'],
			'client_ip' => $client_ip,
		);

		wp_send_json_success( $response, 200 );
	}

	public function ajax_save_ip_filter(): void {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = array();

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['enabled'] ) ) {
			$options['enabled'] = rest_sanitize_boolean( wp_unslash( $_POST['enabled'] ) );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['mode'] ) ) {
			$options['mode'] = sanitize_text_field( wp_unslash( $_POST['mode'] ) );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['blacklist'] ) ) {
			$blacklist = sanitize_text_field( wp_unslash( $_POST['blacklist'] ) );
			if ( is_string( $blacklist ) ) {
				$blacklist = json_decode( $blacklist, true );
			}
			$options['blacklist'] = is_array( $blacklist ) ? $blacklist : array();
		}

		$updated = self::update_options( $options );

		wp_send_json_success( $updated, 200 );
	}
}
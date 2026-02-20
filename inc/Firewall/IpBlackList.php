<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Core\Utils;
use WP_Error;
use Exception;

class IpBlackList {

	protected static $instance = null;

	private const OPTION_KEY                = 'rest_firewall_ip_filter';
	private const AUTO_BLACKLIST_KEY_PREFIX = 'rest_firewall_auto_blacklist_';

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
		add_action( 'wp_ajax_get_ip_entries', array( $this, 'ajax_get_ip_entries' ) );
		add_action( 'wp_ajax_add_ip_entry', array( $this, 'ajax_add_ip_entry' ) );
		add_action( 'wp_ajax_delete_ip_entry', array( $this, 'ajax_delete_ip_entry' ) );
	}

	public static function default_options(): array {
		return array(
			'enabled'   => false,
			'mode'      => 'blacklist',
			'blacklist' => array(),
			'whitelist' => array(),
		);
	}

	private static function ip_entry_config(): array {
		return array(
			'id'           => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'ip'           => array(
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'entry_type'   => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'manual',
				'allowed_values'    => array( 'manual', 'rate_limit' ),
			),
			'agent'        => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'country_code' => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'country_name' => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'blocked_at'   => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'expires_at'   => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'created_at'   => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
			'updated_at'   => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			),
		);
	}

	private static function sanitize_ip_entry( $entry ): ?array {
		$config = self::ip_entry_config();

		if ( ! is_array( $entry ) ) {
			$entry = array( 'ip' => (string) $entry );
		}

		if ( ! isset( $entry['ip'] ) || empty( trim( $entry['ip'] ) ) ) {
			return null;
		}

		$ip = trim( sanitize_text_field( $entry['ip'] ) );
		if ( ! self::is_valid_ip_or_cidr( $ip ) ) {
			return null;
		}

		$now       = current_time( 'mysql' );
		$sanitized = array();

		foreach ( $config as $key => $field_config ) {
			$value = $entry[ $key ] ?? null;

			if ( null === $value ) {
				switch ( $key ) {
					case 'id':
						$sanitized[ $key ] = wp_generate_uuid4();
						break;
					case 'blocked_at':
					case 'created_at':
					case 'updated_at':
						$sanitized[ $key ] = $now;
						break;
					default:
						$sanitized[ $key ] = $field_config['default'];
				}
			} else {
				$callback          = $field_config['sanitize_callback'];
				$sanitized[ $key ] = is_callable( $callback ) ? call_user_func( $callback, $value ) : $value;

				if ( isset( $field_config['allowed_values'] ) && ! in_array( $sanitized[ $key ], $field_config['allowed_values'], true ) ) {
					$sanitized[ $key ] = $field_config['default'];
				}
			}
		}

		return $sanitized;
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
			'mode'      => 'blacklist',
			'blacklist' => self::sanitize_ip_list( $options['blacklist'] ?? array() ),
			'whitelist' => array(),
		);
	}

	private static function sanitize_ip_list( $ip_list ): array {
		if ( ! is_array( $ip_list ) ) {
			$ip_list = array_filter( array_map( 'trim', explode( "\n", (string) $ip_list ) ) );
		}

		$sanitized = array();
		$seen_ips  = array();

		foreach ( $ip_list as $entry ) {
			$sanitized_entry = self::sanitize_ip_entry( $entry );

			if ( null === $sanitized_entry ) {
				continue;
			}

			if ( in_array( $sanitized_entry['ip'], $seen_ips, true ) ) {
				continue;
			}

			$seen_ips[]  = $sanitized_entry['ip'];
			$sanitized[] = $sanitized_entry;
		}

		return $sanitized;
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
			return self::check_with_pro_whitelist( $client_ip, $options );
		}

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

	private static function has_pro_features(): bool {
		return CoreOptions::is_pro_active() &&
		class_exists( 'cmk\RestApiFirewallPro\Firewall\IpFilter\IpFilterPro' )
		&& method_exists( 'cmk\RestApiFirewallPro\Firewall\IpFilter\IpFilterPro', 'check_request_pro' );
	}

	private static function check_with_pro_whitelist( string $client_ip, array $options ) {
		try {
			$pro_class = 'cmk\RestApiFirewallPro\Firewall\IpFilter\IpFilterPro';
			return call_user_func( array( $pro_class, 'check_request_pro' ), $client_ip, $options );
		} catch ( Exception $e ) {
			return true;
		}

		return true;
	}

	public static function ip_in_list( string $ip, array $ip_list ): bool {
		foreach ( $ip_list as $entry ) {
			$entry_ip = is_array( $entry ) && isset( $entry['ip'] ) ? $entry['ip'] : (string) $entry;

			if ( strpos( $entry_ip, '/' ) !== false ) {
				if ( self::ip_in_cidr( $ip, $entry_ip ) ) {
					return true;
				}
			} elseif ( $ip === $entry_ip ) {
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

	public static function is_auto_blacklisted( string $ip ): bool {
		$key = self::AUTO_BLACKLIST_KEY_PREFIX . md5( $ip );
		return (bool) get_transient( $key );
	}

	public static function auto_blacklist_ip( string $ip, int $duration ): void {
		$key = self::AUTO_BLACKLIST_KEY_PREFIX . md5( $ip );
		set_transient( $key, time(), $duration );
	}

	public static function remove_auto_blacklist( string $ip ): void {
		$key = self::AUTO_BLACKLIST_KEY_PREFIX . md5( $ip );
		delete_transient( $key );
	}

	public function ajax_get_ip_filter(): void {
		do_action( 'rest_api_firewall_ajax_get_ip_filter' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options   = self::get_options();
		$client_ip = self::get_client_ip();

		$response = array(
			'enabled'   => $options['enabled'],
			'mode'      => $options['mode'],
			'blacklist' => $options['blacklist'],
			'whitelist' => array(),
			'client_ip' => $client_ip,
		);

		wp_send_json_success( $response, 200 );
	}

	public function ajax_save_ip_filter(): void {
		do_action( 'rest_api_firewall_ajax_save_ip_filter' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = array();

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['enabled'] ) ) {
			$options['enabled'] = rest_sanitize_boolean( wp_unslash( $_POST['enabled'] ) );
		}

		if ( isset( $_POST['mode'] ) ) {
			$options['mode'] = sanitize_text_field( wp_unslash( $_POST['mode'] ) );
		}

		if ( isset( $_POST['blacklist'] ) ) {
			$blacklist = sanitize_text_field( wp_unslash( $_POST['blacklist'] ) );
			if ( is_string( $blacklist ) ) {
				$blacklist = json_decode( $blacklist, true );
			}
			$options['blacklist'] = is_array( $blacklist ) ? $blacklist : array();
		}
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		$updated = self::update_options( $options );

		wp_send_json_success( $updated, 200 );
	}

	public function ajax_get_ip_entries(): void {
		do_action( 'rest_api_firewall_ajax_get_ip_entries' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = self::get_options();

		wp_send_json_success( array( 'entries' => $options['blacklist'] ), 200 );
	}

	public function ajax_add_ip_entry(): void {
		do_action( 'rest_api_firewall_ajax_add_ip_entry' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		$ip = isset( $_POST['ip'] ) ? sanitize_text_field( wp_unslash( $_POST['ip'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( empty( $ip ) || ! self::is_valid_ip_or_cidr( $ip ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid IP address', 'rest-api-firewall' ) ), 400 );
		}

		$options = self::get_options();
		$list    = $options['blacklist'];

		foreach ( $list as $entry ) {
			$entry_ip = is_array( $entry ) ? $entry['ip'] : $entry;
			if ( $entry_ip === $ip ) {
				wp_send_json_error( array( 'message' => __( 'IP already in list', 'rest-api-firewall' ) ), 400 );
			}
		}

		$new_entry = self::sanitize_ip_entry(
			array(
				'ip'   => $ip,
				'type' => 'manual',
			)
		);
		$list[]    = $new_entry;

		self::update_options( array( 'blacklist' => $list ) );

		wp_send_json_success( array( 'entry' => $new_entry ), 201 );
	}

	public function ajax_delete_ip_entry(): void {
		do_action( 'rest_api_firewall_ajax_delete_ip_entry' );

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		$id = isset( $_POST['id'] ) ? sanitize_text_field( wp_unslash( $_POST['id'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( empty( $id ) ) {
			wp_send_json_error( array( 'message' => __( 'Entry ID required', 'rest-api-firewall' ) ), 400 );
		}

		$options = self::get_options();
		$list    = $options['blacklist'];
		$found   = false;

		$list = array_filter(
			$list,
			function ( $entry ) use ( $id, &$found ) {
				$entry_id = is_array( $entry ) ? ( $entry['id'] ?? '' ) : '';
				if ( $entry_id === $id ) {
					$found = true;
					return false;
				}
				return true;
			}
		);

		if ( ! $found ) {
			wp_send_json_error( array( 'message' => __( 'Entry not found', 'rest-api-firewall' ) ), 404 );
		}

		self::update_options( array( 'blacklist' => array_values( $list ) ) );

		wp_send_json_success( array( 'deleted' => true ), 200 );
	}
}

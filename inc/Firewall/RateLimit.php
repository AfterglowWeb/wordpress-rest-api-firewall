<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;

class RateLimit {

	private const VIOLATION_KEY_PREFIX = 'rest_firewall_rl_violations_';
	private const BLOCKED_KEY_PREFIX   = 'rest_firewall_rl_blocked_';

	public static function get_client_identifier( WP_REST_Request $request ): string {
		$user = wp_get_current_user();

		if ( $user && $user->exists() ) {
			return 'user_' . $user->ID;
		}

		$ip         = self::get_client_ip();
		$user_agent = $request->get_header( 'user-agent' ) ?? '';
		$auth       = $request->get_header( 'authorization' ) ?? '';

		return 'anon_' . md5( $ip . $user_agent . $auth );
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
					$ips = explode( ',', $ip );
					if ( ! empty( $ips ) ) {
						$ip = trim( $ips[0] );
					}
				}
				if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
					return $ip;
				}
			}
		}

		return '0.0.0.0';
	}

	public static function is_blocked( string $client_id ): bool {
		$key = self::BLOCKED_KEY_PREFIX . md5( $client_id );
		return (bool) get_transient( $key );
	}

	public static function block_client( string $client_id, int $release_time ): void {
		$key = self::BLOCKED_KEY_PREFIX . md5( $client_id );
		set_transient( $key, time(), $release_time );
	}

	public static function record_violation( string $client_id, int $blacklist_time ): int {
		$key   = self::VIOLATION_KEY_PREFIX . md5( $client_id );
		$count = (int) get_transient( $key );
		++$count;
		set_transient( $key, $count, $blacklist_time );
		return $count;
	}

	public static function get_violation_count( string $client_id ): int {
		$key = self::VIOLATION_KEY_PREFIX . md5( $client_id );
		return (int) get_transient( $key );
	}

	public static function clear_violations( string $client_id ): void {
		$key = self::VIOLATION_KEY_PREFIX . md5( $client_id );
		delete_transient( $key );
	}
}

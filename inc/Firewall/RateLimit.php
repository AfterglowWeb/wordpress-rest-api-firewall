<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;

class RateLimit {

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

	private static function get_client_ip(): string {
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
}

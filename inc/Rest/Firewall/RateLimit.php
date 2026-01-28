<?php namespace cmk\RestApiFirewall\Rest\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;

class RateLimit {

	/**
	 * Check rate limit for a request.
	 *
	 * @param \WP_REST_Request $request    The REST request.
	 * @param int|false        $rate_limit Optional rate limit (requests). Falls back to global.
	 * @param int|false        $time_limit Optional time window (seconds). Falls back to global.
	 * @return true|\WP_Error
	 */
	public static function check( \WP_REST_Request $request, $rate_limit = false, $time_limit = false ) {

		$client_id        = self::get_client_identifier( $request );
		$key              = 'rest_firewall_rl_' . md5( $client_id . $request->get_route() );
		$firewall_options = FirewallOptions::get_options();

		$rate_limit = ( $rate_limit !== false ) ? (int) $rate_limit : (int) $firewall_options['rate_limit'];
		$time_limit = ( $time_limit !== false ) ? (int) $time_limit : (int) $firewall_options['rate_limit_time'];

		$count = (int) get_transient( $key );

		if ( $count >= $rate_limit ) {
			return new \WP_Error(
				'rest_firewall_rate_limited',
				'Too many requests.',
				array( 'status' => 429 )
			);
		}

		set_transient( $key, $count + 1, $time_limit );

		return true;
	}


	private static function get_client_identifier( \WP_REST_Request $request ): string {
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
					$ip = trim( explode( ',', $ip )[0] );
				}
				if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
					return $ip;
				}
			}
		}

		return '0.0.0.0';
	}
}

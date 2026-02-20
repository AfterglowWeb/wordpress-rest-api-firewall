<?php
namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Firewall\WordpressAuth;
use cmk\RestApiFirewall\Firewall\IpBlackList;
use cmk\RestApiFirewall\Firewall\RateLimit;
use WP_REST_Request;
use WP_Error;

class Firewall {

	public static function result( $result ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$ip_check = self::ip_blacklist( $result );
		if ( is_wp_error( $ip_check ) ) {
			return $ip_check;
		}

		$auth_check = self::wordpress_auth( $result );
		if ( is_wp_error( $auth_check ) ) {
			return $auth_check;
		}

		return $result;
	}

	public static function request( WP_REST_Request $request ) {

		$rate_check = self::rate_limit( $request );
		if ( is_wp_error( $rate_check ) ) {
			return $rate_check;
		}

		return $request;
	}

	private static function ip_blacklist( $result ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === CoreOptions::read_option( 'enforce_ip_blacklist' ) ) {
			return $result;
		}

		$ip_check = IpBlackList::check_request();

		if ( is_wp_error( $ip_check ) ) {
			return $ip_check;
		}

		return $result;
	}

	public static function wordpress_auth( $result ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === CoreOptions::read_option( 'enforce_auth' ) ) {
			return $result;
		}

		if ( false === WordpressAuth::validate_wp_application_password() ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'Authentication required.', 'rest-api-firewall' ),
				array( 'status' => 401 )
			);
		}

		return $result;
	}

	/**
	 * Check rate limit for a request.
	 *
	 * @param \WP_REST_Request $request    The REST request.
	 * @param int|false        $rate_limit Optional rate limit (requests). Falls back to global.
	 * @param int|false        $time_limit Optional time window (seconds). Falls back to global.
	 * @return true|\WP_Error
	 */
	private static function rate_limit( WP_REST_Request $request, $rate_limit = false, $time_limit = false ) {

		$client_id = RateLimit::get_client_identifier( $request );
		$client_ip = RateLimit::get_client_ip();

		if ( IpBlackList::is_auto_blacklisted( $client_ip ) ) {
			return new WP_Error(
				'rest_firewall_ip_blacklisted',
				esc_html__( 'Your IP has been temporarily blocked due to repeated violations.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		$key              = 'rest_firewall_rl_' . md5( $client_id . $request->get_route() );
		$firewall_options = CoreOptions::read_options();

		$rate_limit          = false !== $rate_limit ? (int) $rate_limit : (int) $firewall_options['rate_limit'];
		$time_limit          = false !== $time_limit ? (int) $time_limit : (int) $firewall_options['rate_limit_time'];
		$release_time        = (int) $firewall_options['rate_limit_release'];
		$blacklist_threshold = (int) $firewall_options['rate_limit_blacklist'];
		$blacklist_time      = (int) $firewall_options['rate_limit_blacklist_time'];

		if ( RateLimit::is_blocked( $client_id ) ) {
			return new WP_Error(
				'rest_firewall_rate_limited',
				esc_html__( 'Too many requests. Please wait before trying again.', 'rest-api-firewall' ),
				array( 'status' => 429 )
			);
		}

		$count = (int) get_transient( $key );

		if ( $count >= $rate_limit ) {
			$violations = RateLimit::record_violation( $client_id, $blacklist_time );

			if ( $blacklist_threshold > 0 && $violations >= $blacklist_threshold ) {
				IpBlackList::auto_blacklist_ip( $client_ip, $blacklist_time );
				RateLimit::clear_violations( $client_id );

				return new WP_Error(
					'rest_firewall_ip_blacklisted',
					esc_html__( 'Your IP has been temporarily blocked due to repeated violations.', 'rest-api-firewall' ),
					array( 'status' => 403 )
				);
			}

			RateLimit::block_client( $client_id, $release_time );

			return new WP_Error(
				'rest_firewall_rate_limited',
				esc_html__( 'Too many requests. Please wait before trying again.', 'rest-api-firewall' ),
				array( 'status' => 429 )
			);
		}

		set_transient( $key, $count + 1, $time_limit );

		return true;
	}
}

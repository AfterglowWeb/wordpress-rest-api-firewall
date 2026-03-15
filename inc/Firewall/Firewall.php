<?php
namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Firewall\WordpressAuth;
use cmk\RestApiFirewall\Firewall\IpBlackList;
use cmk\RestApiFirewall\Firewall\RateLimit;
use cmk\RestApiFirewall\Policy\PolicyRuntime;
use WP_REST_Request;
use WP_Error;

class Firewall {

	/**
	 * WP_Error returned by Firewall::request() during rest_pre_dispatch.
	 * Saved so rest_authentication_errors can re-enforce it if a 3rd-party
	 * plugin resets rest_pre_dispatch to null after our priority-3 callback.
	 */
	private static ?WP_Error $pending_pre_dispatch_error = null;

	public static function set_pending_pre_dispatch_error( ?WP_Error $error ): void {
		self::$pending_pre_dispatch_error = $error;
	}

	public static function get_pending_pre_dispatch_error(): ?WP_Error {
		return self::$pending_pre_dispatch_error;
	}

	/**
	 * Check whether the current request is an internal firewall policy test.
	 * TestPolicy::make_request() sets a short-lived transient and appends the
	 * token as a _firewall_test query parameter so the admin bypass is skipped
	 * and real policy checks run. Query params are used (not headers) because
	 * some proxies/servers strip unknown custom request headers.
	 */
	public static function is_test_request(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- test token validated via transient below
		$token = isset( $_GET['_firewall_test'] )
			? sanitize_text_field( wp_unslash( $_GET['_firewall_test'] ) )
			: '';

		if ( empty( $token ) ) {
			return false;
		}

		$key = 'rest_firewall_test_ctx_' . md5( $token );
		$ctx = get_transient( $key );

		return ! empty( $ctx );
	}

	/**
	 * Return the application ID stored in the test transient, if any.
	 * Returns null when not a test request or when no application context was stored.
	 */
	public static function get_test_application_id(): ?string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- token validated via transient
		$token = isset( $_GET['_firewall_test'] )
			? sanitize_text_field( wp_unslash( $_GET['_firewall_test'] ) )
			: '';

		if ( empty( $token ) ) {
			return null;
		}

		$ctx = get_transient( 'rest_firewall_test_ctx_' . md5( $token ) );

		if ( ! is_array( $ctx ) || empty( $ctx['app_id'] ) ) {
			return null;
		}

		return (string) $ctx['app_id'];
	}

	public static function result( $result ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$is_test  = self::is_test_request();
		$is_admin = is_user_logged_in() && current_user_can( 'manage_options' );

		if ( $is_admin && ! $is_test ) {
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

		$is_test  = self::is_test_request();
		$is_admin = is_user_logged_in() && current_user_can( 'manage_options' );

		if ( $is_admin && ! $is_test ) {
			return $request;
		}

		if ( CoreOptions::read_option( 'firewall_routes_policy_enabled' ) ) {
			$policy = PolicyRuntime::resolve_for_request( $request );

			if ( ! $policy['state'] ) {
				$error = new WP_Error(
					'rest_firewall_route_disabled',
					esc_html__( 'This route is not available.', 'rest-api-firewall' ),
					array( 'status' => 404 )
				);
				/**
				 * Filters the response when a route is disabled.
				 * Return a WP_Error for a JSON error response, or call wp_redirect()+exit
				 * / exit directly for redirects or empty responses.
				 *
				 * @param WP_Error        $error   Default 404 error.
				 * @param WP_REST_Request $request The current REST request.
				 */
				return apply_filters( 'rest_api_firewall_disabled_route_response', $error, $request );
			}

			$enforce_auth_global = CoreOptions::read_option( 'enforce_auth' );
			
			if ( $policy['protect'] && ! $enforce_auth_global ) {
				if ( ! WordpressAuth::validate_wp_application_password() ) {
					return new WP_Error(
						'rest_forbidden',
						esc_html__( 'Authentication required.', 'rest-api-firewall' ),
						array( 'status' => 401 )
					);
				}
			}
		}

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

	private static function wordpress_auth( $result ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === CoreOptions::read_option( 'firewall_routes_policy_enabled' ) ) {
			return $result;
		}

		if ( false === CoreOptions::read_option( 'enforce_auth' ) ) {
			return $result;
		}

		$auth_valid = WordpressAuth::validate_wp_application_password();

		if ( false === $auth_valid ) {
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

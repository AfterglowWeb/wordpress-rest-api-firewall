<?php namespace cmk\RestApiFirewall\Rest\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;

class Permissions {

	public static function sync_rest_api_user( int $new_user_id, int $old_user_id = 0 ): void {
		if (
			! empty( $old_user_id )
			&& absint( $old_user_id ) !== absint( $new_user_id )
		) {
			self::remove_cap_from_user( absint( $old_user_id ) );
		}

		if ( empty( $new_user_id ) ) {
			return;
		}

		$user = get_user_by( 'id', absint( $new_user_id ) );
		if ( false === $user instanceof \WP_User ) {
			return;
		}

		$user->add_cap( 'rest_firewall_api_access' );
	}

	private static function remove_cap_from_user( int $user_id ): void {
		$user = get_user_by( 'id', $user_id );
		if ( $user instanceof \WP_User ) {
			$user->remove_cap( 'rest_firewall_api_access' );
		}
	}

	public static function rest_api_enforce_auth( $result ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === FirewallOptions::get_option( 'enforce_auth' ) ) {
			return $result;
		}

		if ( false === self::validate_wp_application_password() ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Authentication required.', 'rest-api-firewall' ),
				array( 'status' => 401 )
			);
		}

		return $result;
	}

	public static function rest_api_enforce_pre_dispatch_auth ( $result ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( true === FirewallOptions::get_option( 'enforce_auth' ) ) {
			return $result;
		}

		if ( false === self::validate_wp_application_password() ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Authentication required.', 'rest-api-firewall' ),
				array( 'status' => 401 )
			);
		}

		return $result;
	}

	/**
	 * Check rate limit for a REST request.
	 *
	 * @param \WP_REST_Request $request    The REST request.
	 * @param int|false        $rate_limit Optional rate limit (requests).
	 * @param int|false        $time_limit Optional time window (seconds).
	 * @return true|\WP_Error
	 */
	public static function rest_api_rate_limit_check( \WP_REST_Request $request, $rate_limit = false, $time_limit = false ) {

		$rate = RateLimit::check( $request, $rate_limit, $time_limit );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		return true;
	}

	private static function validate_wp_application_password(): bool {
		$user = wp_get_current_user();

		if ( ! $user || ! $user->exists() ) {
			return false;
		}

		return $user->has_cap( 'rest_firewall_api_access' );
	}

	public static function is_post_type_allowed( string $post_type ): bool {

		if ( false === CoreOptions::read_option( 'rest_api_restrict_post_types_enabled' ) ) {
			return true;
		}

		if ( ! post_type_exists( $post_type ) ) {
			return false;
		}

		$allowed_post_types = CoreOptions::read_option( 'rest_api_allowed_post_types' );

		if ( empty( $allowed_post_types ) ) { // If option is not set, all posts are allowed.
			return true;
		}

		if ( ! in_array( $post_type, $allowed_post_types, true ) ) {
			return false;
		}

		return true;
	}

	public static function filter_wp_rest_post_types( $result, $server, \WP_REST_Request $request ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === CoreOptions::read_option( 'rest_api_restrict_post_types_enabled' ) ) {
			return $result;
		}

		$parts     = explode( '/', trim( $request->get_route(), '/' ) );
		$post_type = isset( $parts[2] ) ? sanitize_key( $parts[2] ) : null;

		if ( ! $post_type ) {
			return $result;
		}

		if ( false === self::is_post_type_allowed( $post_type ) ) {
			return new \WP_Error(
				'forbidden_post_type',
				__( 'This post type is not allowed.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		return $result;
	}
}

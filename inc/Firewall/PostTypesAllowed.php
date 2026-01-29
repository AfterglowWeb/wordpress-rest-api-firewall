<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use WP_Error;
use WP_REST_Request;

class PostTypesAllowed {


	public static function is_allowed( string $post_type ): bool {

		if ( false === CoreOptions::read_option( 'rest_api_restrict_post_types_enabled' ) ) {
			return true;
		}

		if ( ! post_type_exists( $post_type ) ) {
			return false;
		}

		$allowed_post_types = CoreOptions::read_option( 'rest_api_allowed_post_types' );

		if ( empty( $allowed_post_types ) ) {
			return true;
		}

		if ( ! in_array( $post_type, $allowed_post_types, true ) ) {
			return false;
		}

		return true;
	}

	public static function filter_post_types( $result, $server, WP_REST_Request $request ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === CoreOptions::read_option( 'rest_api_restrict_post_types_enabled' ) ) {
			return $result;
		}

		$post_type = sanitize_key( wp_unslash( $request->get_param( 'type' ) ) );

		if ( ! $post_type ) {
			$parts     = explode( '/', trim( $request->get_route(), '/' ) );
			$post_type = isset( $parts[2] ) ? sanitize_key( $parts[2] ) : null;
		}

		if ( ! $post_type ) {
			return $result;
		}

		if ( false === self::is_allowed( $post_type ) ) {
			return new WP_Error(
				'forbidden_post_type',
				esc_html__( 'This post type is not allowed.', 'rest-api-firewall' ),
				array( 'status' => 403 )
			);
		}

		return $result;
	}
}

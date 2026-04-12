<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;

final class RestRequestBootstrap {

	public static function register(): void {
		add_action(
			'rest_pre_serve_request',
			function () {
				header_remove( 'Cache-Control' );
				header_remove( 'Expires' );
				header_remove( 'Pragma' );
			},
			5
		);

		add_filter( 'rest_json_encode_options', fn() => JSON_UNESCAPED_SLASHES );

		add_filter( 'application_password_is_api_request', '__return_true' );

		add_filter( 'rest_authentication_errors', array( Firewall::class, 'result' ), 10, 3 );

		add_filter(
			'rest_authentication_errors',
			function ( $result ) {
				if ( is_wp_error( $result ) ) {
					return $result;
				}

				$pending = Firewall::get_pending_pre_dispatch_error();
				if ( $pending ) {
					return $pending;
				}

				return $result;
			},
			99
		);

		add_filter( 'rest_pre_dispatch', array( UsersRouteHider::class, 'filter_users_route' ), 5, 3 );

		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, WP_REST_Request $request ) {

				$firewall = Firewall::request( $request );

				if ( is_wp_error( $firewall ) ) {
					Firewall::set_pending_pre_dispatch_error( $firewall );
					return $firewall;
				}

				Firewall::set_pending_pre_dispatch_error( null );
				return $result;
			},
			3,
			3
		);

		add_filter(
			'rest_pre_dispatch',
			// phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
			function ( $result, $_server, WP_REST_Request $_request ) {
				$pending = Firewall::get_pending_pre_dispatch_error();
				if ( $pending && ! is_wp_error( $result ) ) {
					return $pending;
				}
				return $result;
			},
			999,
			3
		);
	}
}
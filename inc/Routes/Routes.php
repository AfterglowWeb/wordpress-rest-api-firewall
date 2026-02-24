<?php namespace cmk\RestApiFirewall\Routes;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Firewall\Firewall;
use cmk\RestApiFirewall\Firewall\UsersRouteHider;

use WP_REST_Request;
use WP_REST_Response;

class Routes {

	public static function register() {

		self::set_posts_per_page();

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

		add_filter( 'rest_pre_dispatch', array( UsersRouteHider::class, 'filter_users_route' ), 5, 3 );

		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, WP_REST_Request $request ) {

				$firewall = Firewall::request( $request );

				if ( is_wp_error( $firewall ) ) {
					return $firewall;
				}

				return $result;
			},
			3,
			10
		);

	}

	private static function set_posts_per_page(): void {

		if ( false === CoreOptions::read_option( 'rest_collections_per_page_enabled' ) ) {
			return;
		}

		$post_types = get_post_types(
			array(
				'show_in_rest' => true,
			)
		);

		if ( empty( $post_types ) ) {
			return;
		}

		foreach ( $post_types as $post_type ) {

			add_filter(
				'rest_' . $post_type . '_collection_params',
				function ( $query_params ) use ( $post_type ) {

					$posts_per_page       = CoreOptions::read_option( 'rest_collections_posts_per_page' );
					$attachments_per_page = CoreOptions::read_option( 'rest_collections_attachments_per_page' );
					$per_page             = 'attachment' !== $post_type ? $posts_per_page : $attachments_per_page;

					if ( ! empty( $per_page ) && isset( $query_params['per_page'] ) ) {
						$query_params['per_page']['default'] = $per_page;
						$query_params['per_page']['maximum'] = $per_page;
					}
					return $query_params;
				},
				10,
				2
			);

		}
	}

	private static function deactivate_cache( WP_REST_Response $response ): WP_REST_Response {
		$response->header( 'Cache-Control', 'no-cache, must-revalidate, max-age=0' );
		$response->header( 'Expires', gmdate( 'D, d M Y H:i:s', time() - 1800 ) . ' GMT' );
		$response->header( 'Pragma', 'no-cache' );
		return $response;
	}
}

<?php namespace cmk\RestApiFirewall\Routes;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Firewall\Firewall;
use cmk\RestApiFirewall\Firewall\UsersRouteHider;
use cmk\RestApiFirewall\Controllers\RoutesController;

use WP_REST_Request;

class Routes {

	public static function register() {

		self::set_posts_per_page();

		add_filter( 'rest_json_encode_options', fn() => JSON_UNESCAPED_SLASHES );

		add_filter( 'application_password_is_api_request', '__return_true');

		add_filter( 'rest_authentication_errors', array( Firewall::class, 'result' ), 10, 3 );

		add_filter( 'rest_pre_dispatch', array( UsersRouteHider::class, 'filter_users_route' ), 5, 3 );

		add_filter( 'rest_pre_dispatch', function ( $result, $server, WP_REST_Request $request ) {

			$firewall = Firewall::request( $request );

			if ( is_wp_error( $firewall ) ) {
				return $firewall;
			}

			return $result;

		}, 3, 10);

		add_filter( 'rest_post_dispatch', array( new RoutesController(), 'resolve_rest_controller'), 10, 3 );

	}

	private static function set_posts_per_page(): void {

		$post_types = get_post_types([
			'public'       => true,
			'show_in_rest' => true
		]);
		
		foreach ( $post_types as $post_type ) {

			add_filter(
				'rest_' . $post_type . '_collection_params',
				function ( $query_params ) {

					$posts_per_page = CoreOptions::read_option( 'rest_api_posts_per_page' );

					if ( ! empty( $posts_per_page ) && isset( $query_params['per_page'] ) ) {
						$query_params['per_page']['default'] = $posts_per_page;
						$query_params['per_page']['maximum'] = $posts_per_page;
					}
					return $query_params;
				},
				10,
				2
			);

		}
	}
}

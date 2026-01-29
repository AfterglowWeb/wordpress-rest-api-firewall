<?php namespace cmk\RestApiFirewall\Rest\Routes;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Firewall\Permissions;
use cmk\RestApiFirewall\Models\Controllers\PostController;
use cmk\RestApiFirewall\Models\Controllers\SiteDataController;
use cmk\RestApiFirewall\Models\Controllers\AttachmentController;
use cmk\RestApiFirewall\Firewall\Policy\PolicyRuntime;
use cmk\RestApiFirewall\Core\CoreOptions;
use WP_REST_Request;

class Routes {

	public static function register() {

		self::set_posts_per_page();

		add_filter(
			'rest_authentication_errors',
			array( Permissions::class, 'rest_api_enforce_auth' ),
			10,
			3
		);

		add_filter(
			'rest_pre_dispatch',
			array( Permissions::class, 'filter_wp_rest_post_types' ),
			10,
			3
		);

		add_filter(
			'rest_json_encode_options',
			function () {
				return JSON_UNESCAPED_SLASHES;
			}
		);

		add_filter(
			'application_password_is_api_request',
			'__return_true'
		);

		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, WP_REST_Request $request ) {

				if ( is_wp_error( $result ) ) {
					return $result;
				}

				$policy = PolicyRuntime::resolve_for_request( $request );

				if ( empty( $policy['state'] ) ) {
					return new \WP_Error(
						'rest_disabled',
						'This endpoint is disabled',
						array( 'status' => 404 )
					);
				}

				if ( ! empty( $policy['protect'] ) ) {
					$auth_check = Permissions::rest_api_enforce_pre_dispatch_auth( $result );
					if ( is_wp_error( $auth_check ) ) {
						return $auth_check;
					}
				}

				if ( ! empty( $policy['rate_limit'] ) ) {
					$rate_check = Permissions::rest_api_rate_limit_check(
						$request,
						$policy['rate_limit'],
						$policy['rate_limit_time']
					);
					if ( is_wp_error( $rate_check ) ) {
						return $rate_check;
					}
				}

				return $result;
			},
			3,
			10
		);

		add_action(
			'rest_api_init',
			function () {
				register_rest_route(
					'blank/v1',
					'/data',
					array(
						'methods'             => 'GET',
						'callback'            => array( SiteDataController::class, 'site_data' ),
						'permission_callback' => array( Permissions::class, 'rest_api_rate_limit_check' ),
					)
				);

				register_rest_route(
					'blank/v1',
					'/(?P<post_type>[a-zA-Z0-9_-]{2,20})',
					array(
						'methods'             => 'GET',
						'callback'            => array( PostController::class, 'posts_per_post_type' ),
						'permission_callback' => array( Permissions::class, 'rest_api_rate_limit_check' ),
						'args'                => array(
							'post_type' => array(
								'required'          => true,
								'sanitize_callback' => 'sanitize_key',
								'validate_callback' => array( Permissions::class, 'is_post_type_allowed' ),
							),
						),
					)
				);

				register_rest_route(
					'blank/v1',
					'/(?P<post_type>[a-zA-Z0-9_-]{2,20})/images',
					array(
						'methods'             => 'GET',
						'callback'            => array( AttachmentController::class, 'attachments_per_post_type' ),
						'permission_callback' => array( Permissions::class, 'rest_api_rate_limit_check' ),
						'args'                => array(
							'post_type' => array(
								'required'          => true,
								'sanitize_callback' => 'sanitize_key',
								'validate_callback' => array( Permissions::class, 'is_post_type_allowed' ),
							),
						),
					)
				);
			}
		);
	}

	private static function set_posts_per_page(): void {

		$allowed_post_types = CoreOptions::read_option( 'rest_api_allowed_post_types' );

		if ( empty( $allowed_post_types ) ) { // Bail early if not post types are enforced.
			return;
		}

		foreach ( $allowed_post_types as $allowed_post_type ) {

			add_filter(
				'rest_' . $allowed_post_type . '_collection_params',
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

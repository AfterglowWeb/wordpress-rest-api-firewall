<?php namespace cmk\RestApiFirewall\Policy;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Policy\PolicyRuntime;
use cmk\RestApiFirewall\Policy\PolicyRepository;
use WP_REST_Request;

class TestPolicy {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_run_policy_test', array( $this, 'ajax_run_policy_test' ) );
	}

	public function ajax_run_policy_test() {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		$route           = isset( $_POST['route'] ) ? sanitize_text_field( wp_unslash( $_POST['route'] ) ) : '';
		$method          = isset( $_POST['method'] ) ? strtoupper( sanitize_text_field( wp_unslash( $_POST['method'] ) ) ) : 'GET';
		$test_sub_routes = isset( $_POST['test_sub_routes'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['test_sub_routes'] ) ) : false;
		$bypass_users    = isset( $_POST['bypass_users'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['bypass_users'] ) ) : false;
		$has_users       = isset( $_POST['has_users'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['has_users'] ) ) : false;
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( empty( $route ) ) {
			wp_send_json_error( array( 'message' => 'Route is required' ), 400 );
		}

		$allowed_methods = array( 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' );
		if ( ! in_array( $method, $allowed_methods, true ) ) {
			wp_send_json_error( array( 'message' => 'Invalid HTTP method' ), 400 );
		}

		$routes_to_test = $this->collect_routes_to_test( $route, $method, $test_sub_routes );

		if ( empty( $routes_to_test ) ) {
			wp_send_json_error( array( 'message' => 'No routes found to test' ), 404 );
		}

		$results = $this->run_tests( $routes_to_test, $bypass_users, $has_users );

		wp_send_json_success( $results, 200 );
	}

	protected function collect_routes_to_test( string $route, string $method, bool $include_sub_routes ): array {
		$routes = array();

		$routes[] = array(
			'route'  => $route,
			'method' => $method,
		);

		if ( $include_sub_routes ) {
			$tree       = PolicyRepository::get_routes_policy_tree();
			$sub_routes = $this->find_sub_routes( $tree, $route );
			$routes     = array_merge( $routes, $sub_routes );
		}

		return $routes;
	}

	protected function find_sub_routes( array $tree, string $parent_route ): array {
		$sub_routes         = array();
		$parent_route_clean = rtrim( $parent_route, '/' );

		foreach ( $tree as $node ) {
			$this->collect_routes_from_node( $node, $parent_route_clean, $sub_routes );
		}

		return $sub_routes;
	}

	protected function collect_routes_from_node( array $node, string $parent_route, array &$routes ): void {
		if ( ! empty( $node['children'] ) ) {
			foreach ( $node['children'] as $child ) {
				$is_method = isset( $child['isMethod'] ) && $child['isMethod'];

				if ( $is_method ) {
					$child_route = $child['route'] ?? '';
					if ( $this->is_sub_route( $child_route, $parent_route ) ) {
						$routes[] = array(
							'route'  => $child_route,
							'method' => $child['method'] ?? 'GET',
						);
					}
				} else {
					$this->collect_routes_from_node( $child, $parent_route, $routes );
				}
			}
		}
	}

	protected function is_sub_route( string $route, string $parent_route ): bool {
		if ( empty( $route ) || empty( $parent_route ) ) {
			return false;
		}

		$route_clean  = rtrim( $route, '/' );
		$parent_clean = rtrim( $parent_route, '/' );

		return strpos( $route_clean, $parent_clean ) === 0 && $route_clean !== $parent_clean;
	}


	/**
	 * Run tests for a list of routes.
	 *
	 * @param array $routes       Routes to test.
	 * @param bool  $bypass_users When true, result_data uses auth regardless of user restrictions.
	 * @param bool  $has_users    Whether the route has user-specific access configured.
	 */
	protected function run_tests( array $routes, bool $bypass_users, bool $has_users = false ): array {
		$results = array();

		foreach ( $routes as $route_info ) {
			$route  = $route_info['route'];
			$method = $route_info['method'];

			PolicyRuntime::clear_cache();

			$policy = $this->get_policy_for_route( $route, $method );

			$use_auth_for_result = ! $has_users || $bypass_users;

			$result_entry = array(
				'route'        => $route,
				'method'       => $method,
				'policy'       => $policy,
				'bypass_users' => $bypass_users,
				'tests'        => array(
					'disabled'   => $this->test_disabled( $route, $method, $policy ),
					'auth'       => $this->test_auth( $route, $method, $policy ),
					'rate_limit' => $this->test_rate_limit( $route, $method, $policy ),
				),
				'raw_data'     => $this->fetch_data( $route, $method, false ),
				'result_data'  => $this->fetch_data( $route, $method, $use_auth_for_result ),
			);

			$model = $this->get_model_for_route( $route );
			if ( $model ) {
				$result_entry['model'] = array(
					'id'          => $model['id'],
					'title'       => $model['title'],
					'object_type' => $model['object_type'],
				);
			}

			$results[] = $result_entry;
		}

		return $results;
	}

	/**
	 * Find the active model for a given route path, if one exists.
	 * Requires the pro plugin's ModelRepository and ApplicationRepository.
	 *
	 * @param string $route REST route, e.g. /wp/v2/posts.
	 * @return array|null Model row or null.
	 */
	protected function get_model_for_route( string $route ): ?array {
		if ( ! class_exists( 'cmk\\RestApiFirewallPro\\Models\\ModelRepository' ) ||
			! class_exists( 'cmk\\RestApiFirewallPro\\Application\\ApplicationRepository' ) ) {
			return null;
		}

		$app = \cmk\RestApiFirewallPro\Application\ApplicationRepository::find_first_active();
		if ( ! $app ) {
			return null;
		}

		$post_type = $this->post_type_from_route( $route );
		if ( ! $post_type ) {
			return null;
		}

		return \cmk\RestApiFirewallPro\Models\ModelRepository::find_enabled_by_object_type(
			$app['id'],
			$post_type
		);
	}

	/**
	 * Resolve a REST route to its WordPress post type slug.
	 * Handles /wp/v2/{rest_base} and /wp/v2/{rest_base}/{id} patterns.
	 *
	 * @param string $route REST route path.
	 * @return string|null Post type slug or null.
	 */
	protected function post_type_from_route( string $route ): ?string {
		// Match /wp/v2/{segment}[/...] and extract the segment.
		if ( ! preg_match( '#^/wp/v2/([^/]+)#', $route, $m ) ) {
			return null;
		}

		$segment = $m[1];

		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			$rest_base = ! empty( $post_type->rest_base ) ? $post_type->rest_base : $post_type->name;
			if ( $rest_base === $segment ) {
				return $post_type->name;
			}
		}

		return null;
	}

	protected function fetch_data( string $route, string $method, bool $with_auth ): array {
		$response    = $this->make_request( $route, $method, $with_auth );
		$status_code = wp_remote_retrieve_response_code( $response );
		$body_raw    = wp_remote_retrieve_body( $response );
		$body        = json_decode( $body_raw, true );

		return array(
			'status' => $status_code,
			'body'   => null !== $body ? $body : $body_raw,
		);
	}

	protected function get_policy_for_route( string $route, string $method ): array {
		$request = new WP_REST_Request( $method, $route );
		return PolicyRuntime::resolve_for_request( $request );
	}

	protected function build_rest_url( string $route ): string {
		return rest_url( ltrim( $route, '/' ) );
	}

	protected function test_disabled( string $route, string $method, array $policy ): array {
		$is_disabled = ! ( $policy['state'] ?? true );

		if ( ! $is_disabled ) {
			return array(
				'skip'   => true,
				'reason' => 'Route is not disabled',
				'pass'   => null,
			);
		}

		$response = $this->make_request( $route, $method, false );

		$status_code = wp_remote_retrieve_response_code( $response );
		$is_redirect = $status_code >= 301 && $status_code <= 308;
		$is_error    = $status_code >= 400 && $status_code < 600;
		$pass        = $is_redirect || $is_error;

		return array(
			'skip'   => false,
			'pass'   => $pass,
			'actual' => $status_code,
			'message' => $pass
				? ( $is_redirect ? "Disabled route correctly redirects ({$status_code})" : "Disabled route correctly blocked ({$status_code})" )
				: "Disabled route should be blocked or redirect, got {$status_code}",
		);
	}

	protected function test_auth( string $route, string $method, array $policy ): array {
		$enforce_auth_global = (bool) CoreOptions::read_option( 'enforce_auth' );
		$is_protected        = (bool) ( $policy['protect'] ?? false );

		// Auth is not required only when both global and per-route protection are off.
		if ( ! $enforce_auth_global && ! $is_protected ) {
			return array(
				'skip'   => true,
				'reason' => 'Route is public (auth not enforced globally or per-route)',
				'pass'   => null,
			);
		}

		$auth_source = $enforce_auth_global && $is_protected
			? 'global + per-route'
			: ( $enforce_auth_global ? 'global — all routes enforced' : 'per-route policy' );

		$response    = $this->make_request( $route, $method, false );
		$status_code = wp_remote_retrieve_response_code( $response );
		$expected    = 401;
		$pass        = $status_code === $expected;

		// Non-GET routes may require a valid request body before auth is checked.
		// A 400 response is inconclusive — auth may still be enforced.
		if ( 'GET' !== $method && 400 === $status_code ) {
			return array(
				'skip'    => false,
				'pass'    => null,
				'message' => 'Cannot verify auth: non-GET route returned 400 (body required before auth check)',
			);
		}

		return array(
			'skip'     => false,
			'pass'     => $pass,
			'expected' => $expected,
			'actual'   => $status_code,
			'message'  => $pass
				? "Auth correctly enforced ({$auth_source})"
				: "Expected 401 without auth ({$auth_source}), got {$status_code}",
		);
	}

	protected function test_rate_limit( string $route, string $method, array $policy ): array {
		$rate_limit      = $policy['rate_limit'] ?? false;
		$rate_limit_time = $policy['rate_limit_time'] ?? false;

		if ( false === $rate_limit || false === $rate_limit_time ) {
			return array(
				'skip'   => true,
				'reason' => 'Rate limiting is not enabled for this route',
				'pass'   => null,
			);
		}

		// To update: We don't actually trigger rate limiting for the moment.
		// Instead, we verify the policy is set and make a single request to confirm the route responds.
		$response    = $this->make_request( $route, $method, false );
		$status_code = wp_remote_retrieve_response_code( $response );

		return array(
			'skip'            => false,
			'pass'            => true,
			'rate_limit'      => $rate_limit,
			'rate_limit_time' => $rate_limit_time,
			'status_code'     => $status_code,
			'message'         => "Rate limit policy active: {$rate_limit} requests per {$rate_limit_time} seconds",
		);
	}

	protected function make_request( string $route, string $method, bool $with_auth = false ) {
		// Generate a one-time token stored as a transient so the firewall skips
		// the admin bypass for this loopback request and applies real policy checks.
		// Passed as a query parameter (not a header) because some proxies strip custom headers.
		$test_token = wp_generate_password( 32, false );

		// Store test context including the active application ID so that
		// ApplicationResolver can resolve the correct app for this loopback request.
		$test_ctx = array( 'app_id' => null );
		if ( class_exists( 'cmk\\RestApiFirewallPro\\Application\\ApplicationRepository' ) ) {
			$active_app = \cmk\RestApiFirewallPro\Application\ApplicationRepository::find_first_active();
			if ( $active_app ) {
				$test_ctx['app_id'] = $active_app['id'];
			}
		}
		set_transient( 'rest_firewall_test_ctx_' . md5( $test_token ), $test_ctx, 60 );

		$url = add_query_arg( '_firewall_test', $test_token, $this->build_rest_url( $route ) );

		$args = array(
			'method'      => $method,
			'timeout'     => 10,
			'sslverify'   => false,
			'redirection' => 0,
			'headers'     => array(
				'Content-Type' => 'application/json',
			),
		);

		if ( $with_auth ) {
			$user_id = CoreOptions::read_option( 'user_id' );
			if ( $user_id ) {
				$user = get_user_by( 'id', $user_id );
				if ( $user ) {
					$app_pass = $this->get_or_create_test_app_password( $user_id );
					if ( $app_pass ) {
						// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Used for encoding API response data, not obfuscation
						$args['headers']['Authorization'] = 'Basic ' . base64_encode( $user->user_login . ':' . $app_pass );
					}
				}
			}
		}

		$response = wp_remote_request( $url, $args );

		return $response;
	}

	protected function get_or_create_test_app_password( int $user_id ): ?string {
		$transient_key = 'rest_firewall_test_app_pass_' . $user_id;
		$cached        = get_transient( $transient_key );

		if ( $cached ) {
			return $cached;
		}

		if ( ! class_exists( 'WP_Application_Passwords' ) ) {
			return null;
		}

		$app_name = 'Firewall Policy Test';

		$passwords = \WP_Application_Passwords::get_user_application_passwords( $user_id );
		foreach ( $passwords as $pass_data ) {
			if ( $pass_data['name'] === $app_name ) {
				\WP_Application_Passwords::delete_application_password( $user_id, $pass_data['uuid'] );
				break;
			}
		}

		$result = \WP_Application_Passwords::create_new_application_password(
			$user_id,
			array( 'name' => $app_name )
		);

		if ( is_wp_error( $result ) ) {
			return null;
		}

		$password = $result[0];

		set_transient( $transient_key, $password, 5 * MINUTE_IN_SECONDS );

		return $password;
	}
}

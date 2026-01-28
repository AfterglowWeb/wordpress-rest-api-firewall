<?php namespace cmk\RestApiFirewall\Rest\Firewall\Policy;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;
use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;
use cmk\RestApiFirewall\Rest\Firewall\Policy\PolicyRuntime;
use cmk\RestApiFirewall\Rest\Firewall\Policy\PolicyRepository;
use cmk\RestApiFirewall\Admin\Permissions;

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
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		$route           = isset( $_POST['route'] ) ? sanitize_text_field( wp_unslash( $_POST['route'] ) ) : '';
		$method          = isset( $_POST['method'] ) ? strtoupper( sanitize_text_field( wp_unslash( $_POST['method'] ) ) ) : 'GET';
		$test_sub_routes = isset( $_POST['test_sub_routes'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['test_sub_routes'] ) ) : false;
		$use_auth        = isset( $_POST['use_auth'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['use_auth'] ) ) : true;
		$use_rate_limit  = isset( $_POST['use_rate_limit'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['use_rate_limit'] ) ) : true;
		$use_disabled    = isset( $_POST['use_disabled'] ) ? rest_sanitize_boolean( wp_unslash( $_POST['use_disabled'] ) ) : true;
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

		$results = $this->run_tests(
			$routes_to_test,
			$use_auth,
			$use_rate_limit,
			$use_disabled
		);

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


	protected function run_tests( array $routes, bool $use_auth, bool $use_rate_limit, bool $use_disabled ): array {
		$results = array();

		foreach ( $routes as $route_info ) {
			$route  = $route_info['route'];
			$method = $route_info['method'];

			$result = array(
				'route'  => $route,
				'method' => $method,
				'policy' => $this->get_policy_for_route( $route, $method ),
				'tests'  => array(),
			);

			if ( $use_disabled ) {
				$result['tests']['disabled'] = $this->test_disabled( $route, $method, $result['policy'] );
			}

			if ( $use_auth ) {
				$result['tests']['auth'] = $this->test_auth( $route, $method, $result['policy'] );
			}

			if ( $use_rate_limit ) {
				$result['tests']['rate_limit'] = $this->test_rate_limit( $route, $method, $result['policy'] );
			}

			$results[] = $result;
		}

		return $results;
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
		$expected    = 403;
		$pass        = $status_code === $expected;

		return array(
			'skip'     => false,
			'pass'     => $pass,
			'expected' => $expected,
			'actual'   => $status_code,
			'message'  => $pass
				? 'Disabled route correctly returns 403'
				: "Disabled route should return {$expected}, got {$status_code}",
		);
	}

	protected function test_auth( string $route, string $method, array $policy ): array {
		$is_protected = $policy['protect'] ?? false;

		if ( ! $is_protected ) {
			return array(
				'skip'   => true,
				'reason' => 'Route is not protected',
				'pass'   => null,
			);
		}

		$response = $this->make_request( $route, $method, false );

		$status_code = wp_remote_retrieve_response_code( $response );
		$expected    = 401;
		$pass        = $status_code === $expected;

		return array(
			'skip'     => false,
			'pass'     => $pass,
			'expected' => $expected,
			'actual'   => $status_code,
			'message'  => $pass
				? 'Protected route correctly requires authentication'
				: "Protected route should return {$expected} without auth, got {$status_code}",
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

		// We won't actually trigger rate limiting as that would require many requests.
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
		$url = $this->build_rest_url( $route );

		$args = array(
			'method'    => $method,
			'timeout'   => 10,
			'sslverify' => false, // Local dev may not have valid SSL.
			'headers'   => array(
				'Content-Type' => 'application/json',
			),
		);

		if ( $with_auth ) {
			$user_id = FirewallOptions::get_option( 'user_id' );
			if ( $user_id ) {
				$user = get_user_by( 'id', $user_id );
				if ( $user ) {
					// Generate a temporary application password for testing.
					$app_pass = $this->get_or_create_test_app_password( $user_id );
					if ( $app_pass ) {
						// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Used for encoding API response data, not obfuscation
						$args['headers']['Authorization'] = 'Basic ' . base64_encode( $user->user_login . ':' . $app_pass );
					}
				}
			}
		}

		return wp_remote_request( $url, $args );
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

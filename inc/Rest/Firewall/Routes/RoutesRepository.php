<?php namespace cmk\RestApiFirewall\Rest\Firewall\Routes;

defined( 'ABSPATH' ) || exit;

class RoutesRepository {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
	}

	public static function list_all_rest_routes(): array {

		$cached = get_transient( 'rest_firewall_routes_list' );
		if ( false !== $cached && is_array( $cached ) ) {
			return $cached;
		}

		do_action( 'rest_api_init' );

		$server = rest_get_server();
		$routes = $server->get_routes();

		$output = array();

		foreach ( $routes as $route => $endpoints ) {

			foreach ( $endpoints as $endpoint ) {

				$methods = array_keys( $endpoint['methods'] ?? array() );
				if ( empty( $methods ) ) {
					continue;
				}

				foreach ( $methods as $method ) {

					$permission_cb = $endpoint['permission_callback'] ?? null;
					$route_params  = self::extract_route_params( $route );

					$output[] = array(
						'route'               => $route,
						'params'              => $route_params,
						'method'              => $method,
						'callback'            => self::normalize_callable(
							$endpoint['callback'] ?? null
						),
						'permission_callback' => self::normalize_callable(
							$permission_cb
						),
						'permission_type'     => self::describe_permission_callback(
							$permission_cb
						),
						'show_in_index'       => (bool) ( $endpoint['show_in_index'] ?? false ),
						'namespace'           => explode( '/', trim( $route, '/' ) )[0] ?? '',
					);

				}
			}
		}

		set_transient( 'rest_firewall_routes_list', $output, HOUR_IN_SECONDS );

		return $output;
	}

	private static function normalize_callable( $callback_name ) {

		if ( is_string( $callback_name ) ) {
			return $callback_name;
		}

		if ( is_array( $callback_name ) && isset( $callback_name[0], $callback_name[1] ) ) {
			if ( is_object( $callback_name[0] ) ) {
				return get_class( $callback_name[0] ) . '::' . $callback_name[1];
			}

			if ( is_string( $callback_name[0] ) ) {
				return $callback_name[0] . '::' . $callback_name[1];
			}
		}

		if ( $callback_name instanceof \Closure ) {
			return 'closure';
		}

		return null;
	}

	private static function describe_permission_callback( $cb ): string {

		if ( empty( $cb ) ) {
			return 'public';
		}

		if ( '__return_true' === $cb ) {
			return 'public';
		}

		if ( '__return_false' === $cb ) {
			return 'forbidden';
		}

		if ( $cb instanceof \Closure ) {
			return 'custom';
		}

		if ( is_array( $cb ) ) {
			return 'protected';
		}

		return 'custom';
	}

	private static function extract_route_params( string $route ): array {

		preg_match_all(
			'#\(\?P<([^>]+)>([^)]+)\)#',
			$route,
			$matches,
			PREG_SET_ORDER
		);

		$params = array();

		foreach ( $matches as $match ) {
			$params[] = array(
				'name'  => $match[1],
				'regex' => $match[2],
			);
		}

		return $params;
	}
}

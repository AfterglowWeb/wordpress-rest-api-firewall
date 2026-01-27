<?php namespace cmk\RestApiFirewall\Rest\Routes;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\Permissions;
use cmk\RestApiFirewall\Rest\Routes\RoutesToTree;
use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;

class RoutesRepository {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_list_rest_api_routes', array( $this, 'ajax_list_rest_api_routes' ) );
		add_action( 'wp_ajax_save_rest_api_policy', array( $this, 'ajax_save_rest_api_policy' ) );
	}


	public function ajax_list_rest_api_routes(): void {
		if ( false === Permissions::validate_ajax_crud_rest_api_firewall_options() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$routes_tree = self::get_rest_routes_tree();
		wp_send_json_success( $routes_tree, 200 );
	}

	public function ajax_save_rest_api_policy(): void {
		if ( false === Permissions::validate_ajax_crud_rest_api_firewall_options() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$tree = isset( $_POST['tree'] ) ? json_decode( stripslashes( $_POST['tree'] ), true ) : null;

		if ( ! is_array( $tree ) ) {
			wp_send_json_error( array( 'message' => 'Invalid tree data' ), 400 );
		}

		$diff = self::extract_diff_from_tree( $tree );
		self::save_diff( $diff );

		wp_send_json_success( array( 'message' => 'Policy saved successfully' ), 200 );
	}

	public static function get_rest_routes_tree(): array {

		$flat = self::list_all_rest_routes();
		$tree = RoutesToTree::build_tree( $flat );
		$diff = self::get_diff();
		$result = self::apply_diff( $tree, $diff );
		return $result;
	}

	private static function list_all_rest_routes(): array {

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

	private static function normalize_callable( $callable ) {

		if ( is_string( $callable ) ) {
			return $callable;
		}

		if ( is_array( $callable ) && isset( $callable[0], $callable[1] ) ) {
			if ( is_object( $callable[0] ) ) {
				return get_class( $callable[0] ) . '::' . $callable[1];
			}

			if ( is_string( $callable[0] ) ) {
				return $callable[0] . '::' . $callable[1];
			}
		}

		if ( $callable instanceof \Closure ) {
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

	private static function apply_diff( array $tree, array $diff ): array {

		foreach ( $tree as &$namespace ) {
			self::apply_node_diff( $namespace, $diff );
		}

		return $tree;
	}

	private static function apply_node_diff( array &$node, array $diff ): void {

		// Check if this is a route (HTTP method) or a path node
		$is_method = isset( $node['isMethod'] ) && $node['isMethod'];

		if ( $is_method ) {
			// This is an HTTP method - check routes diff
			if ( isset( $node['id'], $diff['routes'][ $node['id'] ] ) ) {
				$saved_settings = $diff['routes'][ $node['id'] ];

				// Initialize settings array if it doesn't exist
				if ( ! isset( $node['settings'] ) ) {
					$node['settings'] = array();
				}

				// Merge saved settings into node settings structure
				foreach ( $saved_settings as $key => $value ) {
					$node['settings'][ $key ] = $value;
				}
			}
		} else {
			// This is a path node - check nodes diff
			if ( isset( $node['id'], $diff['nodes'][ $node['id'] ] ) ) {
				$saved_settings = $diff['nodes'][ $node['id'] ];

				// Initialize settings array if it doesn't exist
				if ( ! isset( $node['settings'] ) ) {
					$node['settings'] = array();
				}

				// Merge saved settings into node settings structure
				foreach ( $saved_settings as $key => $value ) {
					$node['settings'][ $key ] = $value;
				}
			}
		}

		// Recurse into children (both route methods and path nodes are now in children)
		if ( ! empty( $node['children'] ) ) {
			foreach ( $node['children'] as &$child ) {
				self::apply_node_diff( $child, $diff );
			}
		}
	}

	public static function save_diff( array $diff ): void {
		$diff = array(
			'nodes'  => $diff['nodes'] ?? array(),
			'routes' => $diff['routes'] ?? array(),
		);

		FirewallOptions::save_policy( $diff );
	}

	public static function get_diff(): array {
		return FirewallOptions::get_policy();
	}

	public static function flush(): void {
		FirewallOptions::flush();
		delete_transient( 'rest_firewall_routes_list' );
	}

	private static function extract_diff_from_tree( array $tree ): array {
		$diff = array(
			'nodes'  => array(),
			'routes' => array(),
		);

		foreach ( $tree as $node ) {
			self::extract_node_diff( $node, $diff );
		}

		return $diff;
	}

	private static function extract_node_diff( array $node, array &$diff ): void {
		// Extract node settings if they exist and are not default
		if ( isset( $node['id'], $node['settings'] ) ) {
			$settings = array();

			// Only save settings that are not inherited (explicitly set by user)
			if ( isset( $node['settings']['protect'] ) ) {
				$protect = $node['settings']['protect'];
				// JavaScript sends: { value: true, inherited: false }
				if ( is_array( $protect ) && isset( $protect['value'] ) ) {
					// Only save if NOT inherited (user explicitly set it)
					if ( ! ( $protect['inherited'] ?? false ) ) {
						$settings['protect'] = (bool) $protect['value'];
					}
				}
			}

			if ( isset( $node['settings']['disabled'] ) ) {
				$disabled = $node['settings']['disabled'];
				// JavaScript sends: { value: true, inherited: false }
				if ( is_array( $disabled ) && isset( $disabled['value'] ) ) {
					// Only save if NOT inherited (user explicitly set it)
					if ( ! ( $disabled['inherited'] ?? false ) ) {
						$settings['disabled'] = (bool) $disabled['value'];
					}
				}
			}

			// Save to appropriate array based on node type
			if ( ! empty( $settings ) ) {
				$is_method = isset( $node['isMethod'] ) && $node['isMethod'];
				if ( $is_method ) {
					// This is an HTTP method (route)
					$diff['routes'][ $node['id'] ] = $settings;
				} else {
					// This is a path node
					$diff['nodes'][ $node['id'] ] = $settings;
				}
			}
		}

		// Recurse into children
		if ( ! empty( $node['children'] ) && is_array( $node['children'] ) ) {
			foreach ( $node['children'] as $child ) {
				self::extract_node_diff( $child, $diff );
			}
		}
	}
}

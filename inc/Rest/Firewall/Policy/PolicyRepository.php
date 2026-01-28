<?php namespace cmk\RestApiFirewall\Rest\Firewall\Policy;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\Permissions;
use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;
use cmk\RestApiFirewall\Rest\Firewall\Routes\RoutesRepository;

class PolicyRepository {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	public static function is_pro_active(): bool {
		return (bool) apply_filters( 'rest_api_firewall_pro_active', false );
	}

	private function __construct() {
		add_action( 'wp_ajax_get_routes_policy_tree', array( $this, 'ajax_get_routes_policy_tree' ) );
		add_action( 'wp_ajax_save_routes_policy_tree', array( $this, 'ajax_save_routes_policy_tree' ) );
	}

	/** Services */
	public static function get_routes_policy_tree(): array {
		$flat   = RoutesRepository::list_all_rest_routes();
		$tree   = self::build_policy_tree( $flat );
		$diff   = self::get_diff();
		$result = self::apply_diff( $tree, $diff );
		return $result;
	}

	public function ajax_get_routes_policy_tree(): void {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$routes_tree = self::get_routes_policy_tree();
		wp_send_json_success(
			array(
				'tree'       => $routes_tree,
				'pro_active' => self::is_pro_active(),
			),
			200
		);
	}

	public function ajax_save_routes_policy_tree(): void {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// Check if pro is active - per-route policy editing requires Pro
		$pro_active = apply_filters( 'rest_api_firewall_pro_active', false );
		if ( ! $pro_active ) {
			wp_send_json_error(
				array(
					'message'      => __( 'Pro version required to edit route policies', 'rest-api-firewall' ),
					'pro_required' => true,
				),
				403
			);
		}

		$tree = isset( $_POST['tree'] ) ? json_decode( stripslashes( $_POST['tree'] ), true ) : null;

		if ( ! is_array( $tree ) ) {
			wp_send_json_error( array( 'message' => 'Invalid tree data' ), 400 );
		}

		$diff  = self::extract_diff_from_tree( $tree );
		$saved = self::save_diff( $diff );

		if ( ! $saved ) {
			wp_send_json_error( array( 'message' => 'Failed to save policy' ), 500 );
		}

		wp_send_json_success( array( 'message' => 'Policy saved successfully' ), 200 );
	}



	/** Controller */
	public static function save_diff( array $diff ): bool {
		$diff = array(
			'nodes'  => $diff['nodes'] ?? array(),
			'routes' => $diff['routes'] ?? array(),
		);

		/**
		 * Filter to handle policy saving.
		 * Pro plugin hooks here to save to its own storage.
		 *
		 * @param bool  $saved Whether the policy was saved.
		 * @param array $diff  The policy diff to save.
		 * @return bool True if saved successfully.
		 */
		$saved = apply_filters( 'rest_api_firewall_save_policy', false, $diff );

		// Fallback to free version storage if no pro handler.
		if ( ! $saved ) {
			FirewallOptions::update_option( 'policy', $diff );
			return true;
		}

		return $saved;
	}

	public static function get_diff(): array {
		$default = array(
			'nodes'  => array(),
			'routes' => array(),
		);

		/**
		 * Filter to provide policy data.
		 * Pro plugin hooks here to provide its policy.
		 *
		 * @param array $default Default empty policy.
		 * @return array Policy with 'nodes' and 'routes' keys.
		 */
		$policy = apply_filters( 'rest_api_firewall_get_policy', $default );

		// If no pro filter, fallback to free version storage
		if ( $policy === $default ) {
			return FirewallOptions::get_option( 'policy' );
		}

		return $policy;
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

		if ( ! empty( $node['children'] ) && is_array( $node['children'] ) ) {
			foreach ( $node['children'] as $child ) {
				self::extract_node_diff( $child, $diff );
			}
		}
	}

	public static function flush(): void {
		FirewallOptions::flush();
		delete_transient( 'rest_firewall_routes_list' );
	}


	/** Tree Model */
	public static function build_policy_tree( array $flat_routes ): array {

		$tree = array();

		foreach ( $flat_routes as $route ) {

			$parsed = self::route_to_segments( $route['route'] );

			if ( empty( $parsed ) ) {
				continue;
			}

			$namespace = $parsed['namespace'];
			$segments  = $parsed['segments'];

			if ( ! isset( $tree[ $namespace ] ) ) {
				$tree[ $namespace ] = array(
					'id'       => self::node_id( '/' . $namespace ),
					'label'    => $namespace,
					'path'     => '/' . $namespace,
					'children' => array(),
					'routes'   => array(),
				);
			}

			if ( empty( $segments ) ) {
				$tree[ $namespace ]['routes'][] = self::build_route_entry( $route );
				continue;
			}

			self::insert_route(
				$tree[ $namespace ]['children'],
				$segments,
				$route,
				'/' . $namespace
			);

		}

		return self::normalize_tree( $tree );
	}

	private static function normalize_tree( array $tree ): array {
		$out = array();

		foreach ( $tree as $node ) {
			if ( ! isset( $node['id'] ) || ! $node['id'] ) {
				$node['id'] = self::node_id( $node['path'] ?? uniqid() );
			}

			$all_children = array();

			if ( ! empty( $node['routes'] ) ) {
				foreach ( $node['routes'] as $route ) {
					$all_children[] = array(
						'id'         => $route['uuid'],
						'label'      => $route['method'],
						'path'       => $node['path'],
						'method'     => $route['method'],
						'route'      => $route['route'],
						'params'     => $route['params'],
						'isMethod'   => true,
						'callback'   => $route['callback'],
						'permission' => $route['permission'],
						'settings'   => $route['settings'],
						'children'   => array(),
					);
				}
				unset( $node['routes'] );
			}

			if ( ! empty( $node['children'] ) ) {
				$all_children = array_merge(
					$all_children,
					self::normalize_tree( $node['children'] )
				);
			}

			if ( ! empty( $all_children ) ) {
				$node['children'] = $all_children;
			} else {
				unset( $node['children'] );
			}

			if ( empty( $node['meta'] ) ) {
				unset( $node['meta'] );
			}

			$out[] = $node;
		}

		return $out;
	}

	private static function node_id( string $path ): string {
		return md5( $path );
	}

	/** Route Model */
	private static function route_to_segments( string $route ): array {

		$route = trim( $route, '/' );
		if ( '' === $route ) {
			return array();
		}

		$segments = array();
		$buffer   = '';
		$depth    = 0;
		$length   = strlen( $route );

		for ( $i = 0; $i < $length; $i++ ) {
			$char = $route[ $i ];

			if ( '(' === $char ) {
				++$depth;
			} elseif ( ')' === $char ) {
				--$depth;
			}

			if ( '/' === $char && 0 === $depth ) {
				$segments[] = $buffer;
				$buffer     = '';
				continue;
			}

			$buffer .= $char;
		}

		if ( '' !== $buffer ) {
			$segments[] = $buffer;
		}

		// Need at least namespace.
		if ( count( $segments ) < 2 ) {
			return array();
		}

		$namespace = $segments[0] . '/' . $segments[1];
		$segments  = array_slice( $segments, 2 );

		$segments = array_map(
			static function ( $segment ) {

				if ( preg_match( '#^\(\?P<([^>]+)>#', $segment, $m ) ) {
					return '{' . $m[1] . '}';
				}

				return $segment;
			},
			$segments
		);

		return array(
			'namespace' => $namespace,
			'segments'  => $segments,
		);
	}

	private static function insert_route( array &$tree, array $segments, array $route, string $base_path = '' ): void {

		$current =& $tree;
		$path    = $base_path;

		foreach ( $segments as $index => $segment ) {

			$path .= '/' . $segment;

			if ( ! isset( $current[ $segment ] ) ) {
				$current[ $segment ] = array(
					'id'       => self::node_id( $path ),
					'label'    => $segment,
					'path'     => $path,
					'children' => array(),
					'routes'   => array(),
				);
			}

			$current_node =& $current[ $segment ];

			if ( $index === count( $segments ) - 1 ) {

				$existing_index = null;
				foreach ( $current_node['routes'] as $i => $r ) {
					if ( $r['method'] === $route['method'] && $r['route'] === $route['route'] ) {
						$existing_index = $i;
						break;
					}
				}

				if ( null !== $existing_index ) {
					$current_node['routes'][ $existing_index ]['settings'] = array_merge(
						$current_node['routes'][ $existing_index ]['settings'] ?? array(),
						array(
							'protect'         => false,
							'rate_limit'      => false,
							'rate_limit_time' => false,
							'disabled'        => false,
							'tags'            => array(),
						)
					);
				} else {
					$current_node['routes'][] = self::build_route_entry( $route );
				}
			}

			$current =& $current_node['children'];
		}
	}

	private static function build_route_entry( array $route ): array {

		return array(
			'uuid'       => self::route_uuid( $route ),
			'method'     => $route['method'],
			'route'      => $route['route'],
			'params'     => $route['params'],
			'settings'   => array(
				'protect'         => false,
				'rate_limit'      => false,
				'rate_limit_time' => false,
				'disabled'        => false,
				'tags'            => array(),
			),
			'callback'   => $route['callback'],
			'permission' => array(
				'type'     => $route['permission_type'],
				'callback' => $route['permission_callback'],
			),
		);
	}

	private static function route_uuid( array $route ): string {
		return md5( $route['route'] . '|' . $route['method'] );
	}
}

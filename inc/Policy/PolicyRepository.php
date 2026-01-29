<?php namespace cmk\RestApiFirewall\Policy;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Rest\Routes\RoutesRepository;
use cmk\RestApiFirewall\Firewall\FirewallOptions;

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

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( ! isset( $_POST['tree'] ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Bad request error', 'rest-api-firewall' ),
				),
				400
			);
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		$tree = json_decode( sanitize_text_field( wp_unslash( $_POST['tree'] ) ), true );

		if ( ! is_array( $tree ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Bad request error', 'rest-api-firewall' ),
				),
				400
			);
		}

		$diff  = self::extract_diff_from_tree( $tree );
		$saved = self::save_diff( $diff );

		if ( ! $saved ) {
			wp_send_json_error(
				array(
					'message' => __( 'Failed to save policy', 'rest-api-firewall' ),
				),
				500
			);
		}

		wp_send_json_success(
			array(
				'message' => __( 'Policy saved successfully', 'rest-api-firewall' ),
			),
			200
		);
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

		$is_method = isset( $node['isMethod'] ) && $node['isMethod'];

		if ( isset( $node['id'], $diff['routes'][ $node['id'] ] ) ) {

			if ( ! isset( $node['settings'] ) ) {
				$node['settings'] = array();
			}

			$saved_settings = $is_method ? $diff['routes'][ $node['id'] ] : $diff['nodes'][ $node['id'] ];

			foreach ( $saved_settings as $key => $value ) {
				$node['settings'][ $key ] = $value;
			}
		}

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

		if ( isset( $node['id'], $node['settings'] ) ) {
			$settings = array();

			if ( isset( $node['settings']['protect'] ) ) {
				$protect = $node['settings']['protect'];
				if ( is_array( $protect ) && isset( $protect['value'] ) ) {
					if ( ! ( $protect['inherited'] ?? false ) ) {
						$settings['protect'] = (bool) $protect['value'];
					}
				}
			}

			if ( isset( $node['settings']['disabled'] ) ) {
				$disabled = $node['settings']['disabled'];
				if ( is_array( $disabled ) && isset( $disabled['value'] ) ) {
					if ( ! ( $disabled['inherited'] ?? false ) ) {
						$settings['disabled'] = (bool) $disabled['value'];
					}
				}
			}

			if ( ! empty( $settings ) ) {
				$is_method = isset( $node['isMethod'] ) && $node['isMethod'];
				if ( $is_method ) {
					$diff['routes'][ $node['id'] ] = $settings;
				} else {
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

			if ( count( $segments ) - 1 === $index ) {

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

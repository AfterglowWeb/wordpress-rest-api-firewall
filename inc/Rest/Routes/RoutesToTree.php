<?php namespace cmk\RestApiFirewall\Rest\Routes;

defined( 'ABSPATH' ) || exit;

class RoutesToTree {

	public static function build_tree( array $flat_routes ): array {

		$tree = [];

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
					'children' => [],
					'routes'   => [],
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

	private static function route_to_segments( string $route ): array {

		$route = trim( $route, '/' );
		if ( '' === $route ) {
			return [];
		}

		$segments = [];
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
			return [];
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
					'children' => [],
					'routes'   => [],
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
						$current_node['routes'][ $existing_index ]['settings'] ?? [],
						array(
							'protect'  => false,
							'rate_limit' => false,
							'rate_limit_time' => false,
							'disabled' => false,
							'tags'     => [],
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
				'protect'    => false,
				'rate_limit' => false,
				'rate_limit_time' => false,
				'disabled'   => false,
				'tags'     => [],
			),
			'callback' => $route['callback'],
			'permission' => array(
				'type'     => $route['permission_type'],
				'callback' => $route['permission_callback'],
			),
		);
	}

	private static function node_id( string $path ): string {
		return md5( $path );
	}

	private static function route_uuid( array $route ): string {
		return md5( $route['route'] . '|' . $route['method'] );
	}

	private static function normalize_tree( array $tree ): array {
		$out = [];

		foreach ( $tree as $node ) {
			if ( ! isset( $node['id'] ) || ! $node['id'] ) {
				$node['id'] = self::node_id( $node['path'] ?? uniqid() );
			}

			$all_children = [];

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
						'children'   => [],
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

}

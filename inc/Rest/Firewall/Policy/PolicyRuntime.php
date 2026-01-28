<?php namespace cmk\RestApiFirewall\Rest\Firewall\Policy;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;
use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;
use cmk\RestApiFirewall\Rest\Firewall\Policy\PolicyRepository;

class PolicyRuntime {

	protected static $cache = array();

	public static function resolve_for_request( WP_REST_Request $request ): array {

		$route  = $request->get_route();
		$method = $request->get_method();

		$cache_key = $method . ':' . $route;

		if ( isset( self::$cache[ $cache_key ] ) ) {
			return self::$cache[ $cache_key ];
		}

		$policy = self::resolve_for_route( $route, $method );

		self::$cache[ $cache_key ] = $policy;

		return $policy;
	}

	protected static function resolve_for_route( string $route, string $method ): array {

		$tree = PolicyRepository::get_routes_policy_tree();

		$node_chain = self::find_node_chain( $tree, $route );

		$node_settings = array();

		foreach ( $node_chain as $node ) {
			if ( ! empty( $node['settings'] ) ) {
				$node_settings[] = $node['settings'];
			}
		}

		$route_settings = self::find_route_settings(
			$node_chain,
			$route,
			$method
		);

		$effective = self::resolve_settings(
			$node_settings,
			$route_settings
		);

		return $effective;
	}

	protected static function find_node_chain( array $tree, string $route ): array {

		$segments = explode( '/', trim( $route, '/' ) );

		$namespace = $segments[0] . '/' . $segments[1];
		$path      = '/' . $namespace;

		$chain = array();

		foreach ( $tree as $node ) {
			if ( $node['path'] === $path ) {
				$chain[] = $node;
				self::walk_chain(
					$node,
					array_slice( $segments, 2 ),
					$chain
				);
				break;
			}
		}

		return $chain;
	}

	protected static function walk_chain( array $node, array $segments, array &$chain ): void {

		if ( empty( $segments ) || empty( $node['children'] ) ) {
			return;
		}

		$next = array_shift( $segments );

		foreach ( $node['children'] as $child ) {
			if ( $child['label'] === $next ) {
				$chain[] = $child;
				self::walk_chain( $child, $segments, $chain );
				return;
			}
		}
	}

	protected static function find_route_settings( array $node_chain, string $route, string $method ): array {

		$uuid = md5( $route . '|' . $method );

		$leaf = end( $node_chain );

		if ( empty( $leaf['routes'] ) ) {
			return array();
		}

		foreach ( $leaf['routes'] as $route_entry ) {
			if ( $route_entry['uuid'] === $uuid ) {
				return $route_entry['settings'] ?? array();
			}
		}

		return array();
	}

	protected static function resolve_settings( array $node_settings_chain, array $route_settings ): array {

		$firewall_options       = FirewallOptions::get_options();
		$global_enforce_auth    = (bool) ( $firewall_options['enforce_auth'] ?? false );
		$global_enforce_rate    = (bool) ( $firewall_options['enforce_rate_limit'] ?? false );
		$global_rate_limit      = (int) ( $firewall_options['rate_limit'] ?? 30 );
		$global_rate_limit_time = (int) ( $firewall_options['rate_limit_time'] ?? 60 );

		$resolved = array(
			'disabled'        => false,
			'protect'         => $global_enforce_auth,
			'rate_limit'      => $global_enforce_rate ? $global_rate_limit : false,
			'rate_limit_time' => $global_enforce_rate ? $global_rate_limit_time : false,
			'tags'            => array(),
		);

		foreach ( $node_settings_chain as $settings ) {
			$resolved = self::merge_settings( $resolved, $settings );
		}

		$final = self::merge_settings( $resolved, $route_settings );

		if ( $global_enforce_auth ) {
			$final['protect'] = true;
		}

		if ( $global_enforce_rate ) {
			$final['rate_limit']      = $global_rate_limit;
			$final['rate_limit_time'] = $global_rate_limit_time;
		}

		return array(
			'state'           => ! $final['disabled'],
			'protect'         => $final['protect'],
			'rate_limit'      => $final['rate_limit'],
			'rate_limit_time' => $final['rate_limit_time'],
			'tags'            => $final['tags'] ?? array(),
		);
	}

	private static function merge_settings( array $base, array $override ): array {

		foreach ( $override as $key => $value ) {

			if ( null === $value ) {
				continue;
			}

			if ( is_array( $value ) && isset( $value['value'] ) ) {
				if ( ! ( $value['inherited'] ?? false ) || isset( $base[ $key ] ) === false ) {
					$base[ $key ] = $value['value'];
				}
			} elseif ( is_array( $value ) && 'tags' === $key ) {
				$base[ $key ] = array_values(
					array_unique(
						array_merge( $base[ $key ] ?? array(), $value )
					)
				);
			} else {
				$base[ $key ] = $value;
			}
		}

		return $base;
	}
}

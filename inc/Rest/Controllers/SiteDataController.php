<?php namespace cmk\RestApiFirewall\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Models\Factory;
use WP_REST_Response;

class SiteDataController {

	public static function site_data(): WP_REST_Response {

		$default_options = array(
			'name'        => (string) sanitize_text_field( get_bloginfo( 'name' ) ),
			'description' => (string) sanitize_text_field( get_bloginfo( 'description' ) ),
			'url'         => (string) sanitize_url( get_bloginfo( 'url' ) ),
			'favicon'     => (string) get_site_icon_url() ? sanitize_url( get_site_icon_url() ) : '',
		);

		$data = array(
			'menus'    => self::menus_flat(),
			'identity' => array_merge(
				$default_options,
				apply_filters( 'rest_firewall_model_site_data_acf', 'options' )
			),
		);

		$data = (array) apply_filters( 'rest_firewall_model_site_data', $data );

		if ( empty( $data ) ) {
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => esc_html__( 'No data available', 'rest-api-firewall' ),
				),
				404
			);
		}

		$response = new WP_REST_Response( $data, 200 );

		add_action(
			'rest_pre_serve_request',
			function () {
				header_remove( 'Cache-Control' );
				header_remove( 'Expires' );
				header_remove( 'Pragma' );
			},
			5
		);

		$response->header( 'Cache-Control', 'no-cache, must-revalidate, max-age=0' );
		$response->header( 'Expires', gmdate( 'D, d M Y H:i:s', time() - 1800 ) . ' GMT' );
		$response->header( 'Pragma', 'no-cache' );

		return $response;
	}

	private static function menus_flat(): array {
		$locations = get_nav_menu_locations();
		if ( empty( $locations ) ) {
			return array();
		}

		$flattened_menus = array();

		foreach ( $locations as $location => $menu_id ) {
			$flattened_menu = self::menu_flat( $menu_id );
			if ( empty( $flattened_menu ) ) {
				continue;
			}
			$location                     = str_replace( '-', '_', $location );
			$flattened_menus[ $location ] = $flattened_menu;
		}

		if ( empty( $flattened_menus ) ) {
			return array();
		}

		/**
		 * Filter the menus data before returning to REST API.
		 *
		 * @param array $flattened_menus The hierarchical menus array.
		 * @return array Modified menus data.
		 */
		return apply_filters( 'rest_firewall_model_menus', $flattened_menus );
	}

	private static function menu_flat( $menu_id ): array {

		$menu_id = (int) $menu_id;
		if ( empty( $menu_id ) ) {
			return array();
		}

		$menu = wp_get_nav_menu_items( $menu_id );

		if ( ! is_array( $menu ) || empty( $menu ) ) {
			return array();
		}

		$menu_map = array();
		foreach ( $menu as $item ) {
			$menu_map[ $item->ID ] = self::menu_item_model( $item );
		}

		$hierarchical_menu = array();
		foreach ( $menu_map as $id => $item ) {
			if ( ! empty( $item['parent'] ) && isset( $menu_map[ $item['parent'] ] ) ) {
				$menu_map[ $item['parent'] ]['children'][] = &$menu_map[ $id ];
			} else {
				$hierarchical_menu[] = &$menu_map[ $id ];
			}
		}

		return $hierarchical_menu;
	}

	private static function menu_item_model( \WP_Post $post ): array {

		$factory = new Factory();
		$context = $factory->context();

		if ( $context->use_core_rest ) {
			$controller = new \WP_REST_Menu_Items_Controller( 'nav_menu_item' );
			return $controller
				->prepare_item_for_response( $post, new \WP_REST_Request() )
				->get_data();
		}

		return $factory->menu_item( $post );
	}
}

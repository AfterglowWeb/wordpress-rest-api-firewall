<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewallPro\Controllers\ModelsPropertiesController;
use cmk\RestApiFirewall\Controllers\ModelContext;

class SettingsModel {

	public function __invoke( array $settings, ModelContext $context ): array {

		$settings = $this->apply_filters( $settings, $context );

		return apply_filters(
			'rest_settings_site_data',
			$settings,
			$context
		);
	}

	private function apply_filters( array $settings, ModelContext $context ): array {
		if ( $context->remove_site_url && isset( $settings['url'] ) ) {
			unset( $settings['url'] );
		}

		if ( $context->remove_site_email && isset( $settings['email'] ) ) {
			unset( $settings['email'] );
		}

		if ( $context->embed_menus ) {
			$settings['menus'] = self::menus_flat( $context );
		}

		if ( $context->with_acf_options_page ) {
			$settings['acf_options_page'] = ModelsPropertiesController::embed_acf_fields( 'options' );
		}

		if ( $context->remove_empty_props ) {
			$settings = array_filter( $settings, fn( $value ) => ! empty( $value ) || 0 === $value || false === $value );
		}
		return $settings;
	}

	private static function menus_flat( ModelContext $context ): array {
		$locations = get_nav_menu_locations();
		if ( empty( $locations ) ) {
			return array();
		}

		$flattened_menus = array();

		foreach ( $locations as $location => $menu_id ) {
			$flattened_menu = self::menu_flat( $menu_id, $context );
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

	private static function menu_flat( int $menu_id, ModelContext $context ): array {

		$menu = wp_get_nav_menu_items( $menu_id );

		if ( empty( $menu ) ) {
			return array();
		}

		$menu_map = array();
		foreach ( $menu as $item ) {
			$menu_item_model       = new MenuItemModel();
			$menu_map[ $item->ID ] = $menu_item_model( $item, $context );
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
}

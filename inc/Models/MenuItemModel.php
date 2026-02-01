<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\ModelContext;
use cmk\RestApiFirewall\Schemas\SchemaFilters;

class MenuItemModel {

	public function __invoke( array $menu_item, ModelContext $context ): array {

		$menu_item = $this->remove_disabled_properties( $menu_item, $context );
		$menu_item = $this->apply_filters( $menu_item, $context );

		return apply_filters(
			'rest_firewall_model_menu_item',
			$menu_item,
			$context
		);
	}

	/**
	 * Remove disabled properties from the menu item data.
	 */
	protected function remove_disabled_properties( array $menu_item, ModelContext $context ): array {

		foreach ( array_keys( $menu_item ) as $property_key ) {
			if ( $context->is_disabled( $property_key ) ) {
				unset( $menu_item[ $property_key ] );
			}
		}

		return $menu_item;
	}

	/**
	 * Apply configured filters to the menu item data.
	 */
	protected function apply_filters( array $menu_item, ModelContext $context ): array {

		// Relative URL filter
		if ( isset( $menu_item['url'] ) && $context->should_relative_url( 'url' ) ) {
			$menu_item['url'] = SchemaFilters::relative_url( $menu_item['url'] );
		}

		// Rendered filters
		if ( isset( $menu_item['title'] ) && $context->should_render( 'title' ) ) {
			if ( is_array( $menu_item['title'] ) && isset( $menu_item['title']['rendered'] ) ) {
				$menu_item['title'] = $menu_item['title']['rendered'];
			}
		}

		// ACF fields
		if ( $context->with_acf && isset( $menu_item['id'] ) ) {
			$menu_item['acf'] = SchemaFilters::embed_acf_fields( $menu_item['id'] );
		}

		// Remove _links if configured
		if ( $context->remove_links_prop && isset( $menu_item['_links'] ) ) {
			unset( $menu_item['_links'] );
		}

		return $menu_item;
	}
}

<?php namespace cmk\RestApiFirewall\Rest\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Models\ModelContext;
use WP_Post;

class MenuItemModel {

	public function build( WP_Post $menu_item, ModelContext $context ): array {

		$context = apply_filters(
			'rest_firewall_model_menu_item_context',
			$context,
			$menu_item
		);

		$data = $this->base_fields( $menu_item, $context );

		$data = apply_filters(
			'rest_firewall_model_menu_item_build',
			$data,
			$menu_item,
			$context
		);

		$data = apply_filters(
			'rest_firewall_model_menu_item_fields',
			$data,
			$menu_item,
			$context
		);

		return apply_filters(
			'rest_firewall_model_menu_item',
			$data,
			$menu_item,
			$context
		);
	}

	protected function base_fields( WP_Post $menu_item, ModelContext $context ): array {

		$menu_item = sanitize_post( $menu_item );

		$data = array(
			'id'          => (int) $menu_item->ID,
			'title'       => (string) $menu_item->title,
			'description' => (string) $menu_item->description,
			'link'        => (string) get_the_permalink( $menu_item ),
			'type'        => (string) $menu_item->type,
			'parent'      => (int) $menu_item->menu_item_parent,
			'classes'     => (array) $menu_item->classes,
			'target'      => (string) $menu_item->target,
			'attr_title'  => (string) $menu_item->attr_title,
		);

		if ( $context->with_acf ) {
			$data['acf'] = apply_filters( 'rest_firewall_model_menu_item_acf', $menu_item->ID );
		}

		if ( $context->relative_urls ) {
			$data['link'] = apply_filters( 'rest_firewall_relative_url_enabled', $data['link'] );
		}

		return $data;
	}
}

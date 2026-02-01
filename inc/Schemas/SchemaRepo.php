<?php namespace cmk\RestApiFirewall\Schemas;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Utils;

use WP_REST_Settings_Controller;
use WP_REST_Terms_Controller;
use WP_Post_Type;
use WP_REST_Attachments_Controller;

class SchemaRepo {

	/**
	 * Get the appropriate REST controller for an object type.
	 */
	public static function get_rest_controller( string $object_type, string $subtype = '' ): ?object {

		$object_type = sanitize_key( $object_type );

		if ( 'site' === $object_type ) {
			return new WP_REST_Settings_Controller();
		}

		if ( 'term' === $object_type ) {
			$taxonomy = $subtype ?: 'category';

			if ( taxonomy_exists( $taxonomy ) ) {
				return new WP_REST_Terms_Controller( $taxonomy );
			}

			return null;
		}

		$post_type_object = get_post_type_object( $object_type );

		if ( ! ( $post_type_object instanceof WP_Post_Type ) || ! $post_type_object->show_in_rest ) {
			return null;
		}

		$controller_class = $post_type_object->rest_controller_class;

		if ( ! class_exists( $controller_class ) ) {
			return null;
		}

		if ( 'attachment' === $object_type ) {
			return new WP_REST_Attachments_Controller( 'attachment' );
		}

		return new $controller_class( $object_type );
	}

	public static function properties_filters(): array {

		$taxonomy_options = Utils::list_taxonomies();
		$formated_taxonomy_options = [];
		
		foreach($taxonomy_options as $taxonomy_option) {
			$formated_taxonomy_options[ $taxonomy_option['value'] ] = [
				'value' => false, 
				'label' => $taxonomy_option['label']
			];
		}
		
		return [
			[
				'key' => 'embed',
				'label' => 'Embed',
				'properties' => array_merge( 
					[
						'featured_media' => [
							'value' => false, 
							'label' => esc_html__('Featured Media', 'blank')
						], 
						'author' => [
							'value' => false, 
							'label' => esc_html__('Author', 'blank')
						], 
						'terms' => [
							'value' => false, 
							'label' => esc_html__('Terms', 'blank')
						], 
					],
					 $formated_taxonomy_options
				),
			],
			[
				'key' => 'rendered',
				'label' => 'Rendered',
				'properties' => [
					'guid' => [
						'value' => false,
						'label' => esc_html__('Guid', 'blank')
					],
					'title' => [
						'value' => false,
						'label' => esc_html__('Title', 'blank')
					],
					'excerpt' => [
						'value' => false,
						'label' => esc_html__('Excerpt', 'blank')
					],
					'content' => [
						'value' => false,
						'label' => esc_html__('Content', 'blank')
					],
				],
			],
			[
				'key' => 'relative_url',
				'label' => 'Relative url',
				'properties' => [
					'featured_media' => [
						'value' => false,
						'label' => esc_html__('Featured Media', 'blank')
					],
					'link' => [
						'value' => false,
						'label' => esc_html__('Link', 'blank')
					],
					'guid' => [
						'value' => false,
						'label' => esc_html__('Guid', 'blank')
					],
				],
			]
		];
		
	}	

	public static function post_schemas(): array {

		$post_types = Utils::list_post_types();
		$result     = [];
		

		foreach ( $post_types as $post_type ) {
			$result[ $post_type['value'] ] = [
				'label'    => $post_type['label'],
				'settings' => [],
				'props'    => self::post_schema( $post_type['value']),
			];
		}

		return $result;
	}

	public static function post_schema( string $post_type ): array {


			$controller = self::get_rest_controller( $post_type );
			$filters    = self::properties_filters();

			if ( ! $controller || ! method_exists( $controller, 'get_item_schema' ) ) {
				return [];
			}

			$schema = $controller->get_item_schema();

			if ( empty( $schema['properties'] ) ) {
				return [];
			}

			$properties = [];

			foreach ( $schema['properties'] as $property_key => $property ) {

				$property_filters = [];

				foreach ( $filters as $filter ) {
					if ( in_array( $property_key, $filter['properties'], true ) ) {
						$property_filters[] = $filter['key'];
					}
				}

				$properties[ $property_key ] = array_merge(
					$property,
					[
						'settings' => [
							'disable' => false,
							'filters' => $property_filters,
						],
					]
				);
			}
		

		return $properties;
	}

	public static function taxonomy_schemas(): array {

		$taxonomies = Utils::list_taxonomies();
		$result     = [];
		$filters    = self::properties_filters();

		foreach ( $taxonomies as $taxonomy ) {
			$result[ $taxonomy['value'] ] = [
				'label'    => $taxonomy['label'],
				'settings' => [],
				'props'    => self::taxonomy_schema( $taxonomy['value'], $filters ),
			];
		}

		return $result;
	}

	public static function taxonomy_schema( string $taxonomy, array $filters ): array {

		$controller = self::get_rest_controller( 'term', $taxonomy );

		if ( ! $controller || ! method_exists( $controller, 'get_item_schema' ) ) {
			return [];
		}

		$schema = $controller->get_item_schema();

		if ( empty( $schema['properties'] ) ) {
			return [];
		}

		$properties = [];

		foreach ( $schema['properties'] as $property_key => $property ) {

			$property_filters = [];

			foreach ( $filters as $filter ) {
				if ( in_array( $property_key, array_keys( $filter['properties'] ), true ) ) {
					$property_filters[] = $filter['properties'];
				}
			}

			$properties[ $property_key ] = array_merge(
				$property,
				[
					'settings' => [
						'disable' => false,
						'filters' => $property_filters,
					],
				]
			);
		}

		return $properties;
	}

}


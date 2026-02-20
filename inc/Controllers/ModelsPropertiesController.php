<?php namespace cmk\RestApiFirewall\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Utils;

use WP_REST_Settings_Controller;
use WP_REST_Terms_Controller;
use WP_Post_Type;
use WP_REST_Attachments_Controller;

class ModelsPropertiesController {

	public static function models_properties(): array {

		$post_types = Utils::list_post_types();
		$taxonomies = Utils::list_taxonomies();

		$object_types = array_merge( $post_types, $taxonomies );
		$result       = array();

		foreach ( $object_types as $object_type ) {
			$result[ $object_type['value'] ] = array(
				'label'    => $object_type['label'],
				'settings' => array(),
				'props'    => self::model_properties( $object_type['value'] ),
			);
		}

		return $result;
	}

	public static function model_properties( string $post_type ): array {

		$controller = self::get_rest_controller( $post_type );
		$filters    = self::properties_filters();

		if ( ! $controller || ! method_exists( $controller, 'get_item_schema' ) ) {
			return array();
		}

		$schema = $controller->get_item_schema();

		if ( empty( $schema['properties'] ) ) {
			return array();
		}

		$properties = array();

		foreach ( $schema['properties'] as $property_key => $property ) {

			$property_filters = self::get_filters_per_property( $property_key, $filters );

			$properties[ $property_key ] = array_merge(
				$property,
				array(
					'settings' => array(
						'disable' => false,
						'filters' => $property_filters,
					),
				)
			);
		}

		return $properties;
	}


	private static function get_filters_per_property( $property_key, $filters ): array {
		$property_filters = array();
		foreach ( $filters as $filter ) {
			if ( in_array( $property_key, $filter['properties'], true ) ) {
				$property_filters[] = $filter;
			}
		}
		return $property_filters;
	}

	private static function get_rest_controller( string $object_type, string $subtype = '' ): ?object {

		$object_type = sanitize_key( $object_type );

		if ( 'site' === $object_type ) {
			return new WP_REST_Settings_Controller();
		}

		if ( 'term' === $object_type ) {
			$taxonomy = ! empty( $subtype ) ? $subtype : 'category';

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

	private static function properties_filters(): array {

		$taxonomy_options = Utils::list_taxonomies();

		$taxonomy_values = array_map(
			function ( $taxonomy_option ) {
				return $taxonomy_option['value'];
			},
			$taxonomy_options
		);

		return array(
			array(
				'key'        => 'embed',
				'tooltip'    => 'Embed Object',
				'label'      => 'Embed',
				'properties' => array_merge(
					array(
						'featured_media',
						'author',
					),
					$taxonomy_values
				),
			),
			array(
				'key'        => 'rendered',
				'tooltip'    => 'Resolve Rendered',
				'label'      => 'Rendered',
				'properties' => array(
					'guid',
					'title',
					'excerpt',
					'content',
				),
			),
			array(
				'key'        => 'relative_url',
				'tooltip'    => 'Relative URL',
				'label'      => 'URL',
				'properties' => array(
					'featured_media',
					'link',
					'guid',
					'source_url',
					'media_details',
					'_embed',
					'_links',
				),
			),
			array(
				'key'        => 'date_format',
				'tooltip'    => 'Date Format',
				'label'      => 'Format',
				'properties' => array(
					'date',
					'date_gmt',
					'modified',
					'modified_gmt',
				),
			),
		);
	}
}

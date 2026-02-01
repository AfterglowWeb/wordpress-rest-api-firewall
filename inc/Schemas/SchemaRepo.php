<?php namespace cmk\RestApiFirewall\Schemas;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Utils;

use WP_REST_Settings_Controller;
use WP_REST_Terms_Controller;
use WP_Post_Type;
use WP_REST_Attachments_Controller;

class SchemaRepo {

	public static function get_rest_controller( string $object_type, string $subtype = '' ): ?object {

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

	public static function properties_filters(): array {

		$taxonomy_options          = Utils::list_taxonomies();
		$formated_taxonomy_options = array();

		foreach ( $taxonomy_options as $taxonomy_option ) {
			$formated_taxonomy_options[ $taxonomy_option['value'] ] = array(
				'value' => false,
				'label' => $taxonomy_option['label'],
			);
		}

		return array(
			array(
				'key'        => 'embed',
				'label'      => 'Embed',
				'properties' => array_merge(
					array(
						'featured_media' => array(
							'value' => false,
							'label' => esc_html__( 'Featured Media', 'blank' ),
						),
						'author'         => array(
							'value' => false,
							'label' => esc_html__( 'Author', 'blank' ),
						),
						'terms'          => array(
							'value' => false,
							'label' => esc_html__( 'Terms', 'blank' ),
						),
					),
					$formated_taxonomy_options
				),
			),
			array(
				'key'        => 'rendered',
				'label'      => 'Rendered',
				'properties' => array(
					'guid'    => array(
						'value' => false,
						'label' => esc_html__( 'Guid', 'blank' ),
					),
					'title'   => array(
						'value' => false,
						'label' => esc_html__( 'Title', 'blank' ),
					),
					'excerpt' => array(
						'value' => false,
						'label' => esc_html__( 'Excerpt', 'blank' ),
					),
					'content' => array(
						'value' => false,
						'label' => esc_html__( 'Content', 'blank' ),
					),
				),
			),
			array(
				'key'        => 'relative_url',
				'label'      => 'Relative url',
				'properties' => array(
					'featured_media' => array(
						'value' => false,
						'label' => esc_html__( 'Featured Media', 'blank' ),
					),
					'link'           => array(
						'value' => false,
						'label' => esc_html__( 'Link', 'blank' ),
					),
					'guid'           => array(
						'value' => false,
						'label' => esc_html__( 'Guid', 'blank' ),
					),
				),
			),
		);
	}

	public static function post_schemas(): array {

		$post_types = Utils::list_post_types();
		$result     = array();

		foreach ( $post_types as $post_type ) {
			$result[ $post_type['value'] ] = array(
				'label'    => $post_type['label'],
				'settings' => array(),
				'props'    => self::post_schema( $post_type['value'] ),
			);
		}

		return $result;
	}

	public static function post_schema( string $post_type ): array {

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

			$property_filters = array();

			foreach ( $filters as $filter ) {
				if ( in_array( $property_key, $filter['properties'], true ) ) {
					$property_filters[] = $filter['key'];
				}
			}

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

	public static function taxonomy_schemas(): array {

		$taxonomies = Utils::list_taxonomies();
		$result     = array();
		$filters    = self::properties_filters();

		foreach ( $taxonomies as $taxonomy ) {
			$result[ $taxonomy['value'] ] = array(
				'label'    => $taxonomy['label'],
				'settings' => array(),
				'props'    => self::taxonomy_schema( $taxonomy['value'], $filters ),
			);
		}

		return $result;
	}

	public static function taxonomy_schema( string $taxonomy, array $filters ): array {

		$controller = self::get_rest_controller( 'term', $taxonomy );

		if ( ! $controller || ! method_exists( $controller, 'get_item_schema' ) ) {
			return array();
		}

		$schema = $controller->get_item_schema();

		if ( empty( $schema['properties'] ) ) {
			return array();
		}

		$properties = array();

		foreach ( $schema['properties'] as $property_key => $property ) {

			$property_filters = array();

			foreach ( $filters as $filter ) {
				if ( in_array( $property_key, array_keys( $filter['properties'] ), true ) ) {
					$property_filters[] = $filter['properties'];
				}
			}

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
}

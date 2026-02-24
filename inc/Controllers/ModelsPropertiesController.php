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

		foreach ( self::get_additional_properties( $post_type ) as $property_key => $property ) {
			if ( isset( $properties[ $property_key ] ) ) {
				continue;
			}

			$property_filters             = self::get_filters_per_property( $property_key, $filters );
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

	private static function get_additional_properties( string $object_type ): array {
		$extra        = array();
		$sub_settings = array( 'disable' => false, 'filters' => array() );

		$extra['_links'] = array(
			'type'        => 'object',
			'description' => 'Links to related resources.',
			'properties'  => array(
				'self'                => array( 'type' => 'array', 'description' => 'Link to the item itself.', 'settings' => $sub_settings ),
				'collection'          => array( 'type' => 'array', 'description' => 'Link to the collection.', 'settings' => $sub_settings ),
				'about'               => array( 'type' => 'array', 'description' => 'Link to the post type definition.', 'settings' => $sub_settings ),
				'author'              => array( 'type' => 'array', 'description' => 'Link to the author.', 'settings' => $sub_settings ),
				'replies'             => array( 'type' => 'array', 'description' => 'Link to replies.', 'settings' => $sub_settings ),
				'version-history'     => array( 'type' => 'array', 'description' => 'Link to the version history.', 'settings' => $sub_settings ),
				'predecessor-version' => array( 'type' => 'array', 'description' => 'Link to the predecessor version.', 'settings' => $sub_settings ),
				'wp:featuredmedia'    => array( 'type' => 'array', 'description' => 'Link to the featured media.', 'settings' => $sub_settings ),
				'wp:attachment'       => array( 'type' => 'array', 'description' => 'Link to attachments.', 'settings' => $sub_settings ),
				'wp:term'             => array( 'type' => 'array', 'description' => 'Links to terms.', 'settings' => $sub_settings ),
				'curies'              => array( 'type' => 'array', 'description' => 'Curies.', 'settings' => $sub_settings ),
			),
		);

		$extra['_embed'] = array(
			'type'        => 'object',
			'description' => 'Embedded related resources.',
			'properties'  => array(
				'author'           => array( 'type' => 'array', 'description' => 'Embedded author data.', 'settings' => $sub_settings ),
				'replies'          => array( 'type' => 'array', 'description' => 'Embedded replies.', 'settings' => $sub_settings ),
				'wp:featuredmedia' => array( 'type' => 'array', 'description' => 'Embedded featured media.', 'settings' => $sub_settings ),
				'wp:term'          => array( 'type' => 'array', 'description' => 'Embedded taxonomy terms.', 'settings' => $sub_settings ),
				'wp:attachment'    => array( 'type' => 'array', 'description' => 'Embedded attachments.', 'settings' => $sub_settings ),
			),
		);

		if ( function_exists( 'acf_get_field_groups' ) ) {
			$all_fields   = array();
			$field_groups = acf_get_field_groups( array( 'post_type' => $object_type ) );

			foreach ( $field_groups as $group ) {
				$fields = acf_get_fields( $group['key'] ) ?: array();
				foreach ( $fields as $field ) {
					$all_fields[] = $field;
				}
			}

			$extra['acf'] = array(
				'type'        => 'object',
				'description' => 'Advanced Custom Fields.',
				'properties'  => self::build_acf_subprops( $all_fields, $sub_settings ),
			);
		} elseif ( function_exists( 'get_fields' ) ) {
			$extra['acf'] = array(
				'type'        => 'object',
				'description' => 'Advanced Custom Fields.',
			);
		}

		global $wp_rest_additional_fields;

		if ( ! empty( $wp_rest_additional_fields[ $object_type ] ) ) {
			foreach ( $wp_rest_additional_fields[ $object_type ] as $field_name => $field_options ) {
				if ( isset( $extra[ $field_name ] ) ) {
					continue;
				}
				$schema               = $field_options['schema'] ?? array();
				$extra[ $field_name ] = array(
					'type'        => $schema['type'] ?? 'object',
					'description' => $schema['description'] ?? '',
				);
			}
		}

		return $extra;
	}


	private static function build_acf_subprops( array $fields, array $sub_settings ): array {
		$props = array();

		foreach ( $fields as $field ) {
			if ( ! isset( $field['name'], $field['type'] ) ) {
				continue;
			}

			$key        = sanitize_key( $field['name'] );
			$field_data = array(
				'type'        => sanitize_text_field( $field['type'] ),
				'description' => sanitize_text_field( $field['label'] ?? '' ),
				'settings'    => $sub_settings,
			);

			// Repeater / Group: recurse into sub_fields.
			if ( ! empty( $field['sub_fields'] ) && is_array( $field['sub_fields'] ) ) {
				$field_data['properties'] = self::build_acf_subprops( $field['sub_fields'], $sub_settings );
			}

			// Flexible Content: each layout has its own sub_fields.
			if ( 'flexible_content' === $field['type'] && ! empty( $field['layouts'] ) && is_array( $field['layouts'] ) ) {
				$layout_props = array();
				foreach ( $field['layouts'] as $layout ) {
					$layout_key = sanitize_key( $layout['name'] ?? '' );
					if ( '' === $layout_key ) {
						continue;
					}
					$layout_props[ $layout_key ] = array(
						'type'        => 'object',
						'description' => sanitize_text_field( $layout['label'] ?? '' ),
						'settings'    => $sub_settings,
						'properties'  => self::build_acf_subprops( $layout['sub_fields'] ?? array(), $sub_settings ),
					);
				}
				$field_data['properties'] = $layout_props;
			}

			$props[ $key ] = $field_data;
		}

		return $props;
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

		if ( taxonomy_exists( $object_type ) ) {
			return new WP_REST_Terms_Controller( $object_type );
		}

		$post_type_object = get_post_type_object( $object_type );

		if ( ! ( $post_type_object instanceof WP_Post_Type ) || ! $post_type_object->show_in_rest ) {
			return null;
		}

		if ( 'attachment' === $object_type ) {
			return new WP_REST_Attachments_Controller( 'attachment' );
		}

		$controller_class = $post_type_object->rest_controller_class;

		if ( ! class_exists( $controller_class ) ) {
			$controller_class = 'WP_REST_Posts_Controller';
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

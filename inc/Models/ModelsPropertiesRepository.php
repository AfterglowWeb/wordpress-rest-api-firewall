<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Utils;

use WP_REST_Settings_Controller;
use WP_REST_Terms_Controller;
use WP_Post_Type;
use WP_REST_Attachments_Controller;
use WP_REST_Request;

class ModelsPropertiesRepository {

	public static function models_properties(): array {

		$object_types = Utils::list_rest_api_object_types();
		$result       = array();

		foreach ( $object_types as $object_type ) {
			$result[ $object_type['value'] ] = array(
				'label'    => $object_type['label'],
				'settings' => array(),
				'props'    => self::model_properties( $object_type['value'] ),
			);
		}

		$result['settings_route'] = array(
			'label'    => 'Settings Route',
			'settings' => array(),
			'props'    => self::settings_route_properties(),
		);

		return $result;
	}

	public static function model_properties( string $post_type ): array {

		$filters = self::properties_filters();
		$data    = self::get_sample_rest_response_data( $post_type );

		if ( ! empty( $data ) ) {
			$props = self::build_props_from_data( $data, $filters );

			if ( isset( $props['acf'] ) && function_exists( 'acf_get_field_groups' ) ) {
				$all_fields   = array();
				$field_groups = acf_get_field_groups( array( 'post_type' => $post_type ) );
				foreach ( $field_groups as $group ) {
					$fields = isset( $group['key'] ) && acf_get_fields( $group['key'] ) ? acf_get_fields( $group['key'] ) : array();
					foreach ( $fields as $field ) {
						$all_fields[] = $field;
					}
				}
				if ( ! empty( $all_fields ) ) {
					$props['acf']['properties'] = self::build_acf_subprops( $all_fields );
				}
			}

			return $props;
		}

		$controller = self::get_rest_controller( $post_type );

		if ( ! $controller || ! method_exists( $controller, 'get_item_schema' ) ) {
			return array();
		}

		$schema = $controller->get_item_schema();

		if ( empty( $schema['properties'] ) ) {
			return array();
		}

		$properties = array();

		foreach ( $schema['properties'] as $property_key => $property ) {
			$property_filters            = self::get_filters_per_property( $property_key, $filters );
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

		if ( isset( $properties['acf'] ) && function_exists( 'acf_get_field_groups' ) ) {
			$all_fields   = array();
			$field_groups = acf_get_field_groups( array( 'post_type' => $post_type ) );
			foreach ( $field_groups as $group ) {
				$fields = isset( $group['key'] ) && acf_get_fields( $group['key'] ) ? acf_get_fields( $group['key'] ) : array();
				foreach ( $fields as $field ) {
					$all_fields[] = $field;
				}
			}
			if ( ! empty( $all_fields ) ) {
				$properties['acf']['properties'] = self::build_acf_subprops( $all_fields );
			}
		}

		return $properties;
	}

	private static function get_sample_rest_response_data( string $object_type ): array {

		$rest_base = '';
		$id        = 0;

		if ( taxonomy_exists( $object_type ) ) {
			$tax_obj   = get_taxonomy( $object_type );
			$rest_base = $tax_obj ?
			( property_exists( $tax_obj, 'rest_base' ) && $tax_obj->rest_base ? $tax_obj->rest_base : $object_type )
			: $object_type;
			$terms     = get_terms(
				array(
					'taxonomy'   => $object_type,
					'number'     => 1,
					'hide_empty' => false,
					'fields'     => 'ids',
				)
			);
			if ( is_wp_error( $terms ) || empty( $terms ) ) {
				return array();
			}
			$id = (int) $terms[0];
		} else {
			$pt_obj = get_post_type_object( $object_type );
			if ( ! $pt_obj ) {
				return array();
			}
			$rest_base = property_exists( $pt_obj, 'rest_base' ) && $pt_obj->rest_base ? $pt_obj->rest_base : $object_type;
			$posts     = get_posts(
				array(
					'post_type'      => $object_type,
					'posts_per_page' => 1,
					'fields'         => 'ids',
					'post_status'    => array( 'publish', 'draft', 'private' ),
				)
			);
			if ( empty( $posts ) ) {
				return array();
			}
			$id = (int) $posts[0];
		}

		$request = new WP_REST_Request( 'GET', "/wp/v2/{$rest_base}/{$id}" );
		$request->set_param( '_embed', '1' );
		$response = rest_do_request( $request );

		if ( is_wp_error( $response ) ) {
			return array();
		}

		if ( 200 !== $response->get_status() ) {
			return array();
		}

		$data = rest_get_server()->response_to_data( $response, true );
		return $data;
	}

	private static function settings_route_properties(): array {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/settings' );
		$response = rest_do_request( $request );

		if ( ! is_wp_error( $response ) && 200 === $response->get_status() ) {
			$data = rest_get_server()->response_to_data( $response, false );
			if ( ! empty( $data ) ) {
				return self::build_props_from_data( $data );
			}
		}

		// Fallback: derive from schema.
		$controller = new WP_REST_Settings_Controller();
		$schema     = $controller->get_item_schema();

		if ( empty( $schema['properties'] ) ) {
			return array();
		}

		$properties = array();
		foreach ( $schema['properties'] as $property_key => $property ) {
			$properties[ $property_key ] = array_merge(
				$property,
				array(
					'settings' => array(
						'disable' => false,
						'filters' => array(),
					),
				)
			);
		}

		return $properties;
	}

	private static function build_props_from_data( array $data, array $filters = array(), int $depth = 0 ): array {
		$props = array();

		foreach ( $data as $key => $value ) {
			$str_key          = (string) $key;
			$type             = self::infer_json_type( $value );
			$property_filters = 0 === $depth ? self::get_filters_per_property( $str_key, $filters ) : array();

			$prop = array(
				'type'     => $type,
				'settings' => array(
					'disable' => false,
					'filters' => $property_filters,
				),
			);

			if ( 'object' === $type && $depth < 2 ) {
				$sub = self::build_props_from_data( (array) $value, array(), $depth + 1 );
				if ( ! empty( $sub ) ) {
					$prop['properties'] = $sub;
				}
			}

			$props[ $str_key ] = $prop;
		}

		return $props;
	}

	private static function infer_json_type( $value ): string {
		if ( is_null( $value ) ) {
			return 'null';
		}
		if ( is_bool( $value ) ) {
			return 'boolean';
		}
		if ( is_int( $value ) ) {
			return 'integer';
		}
		if ( is_float( $value ) ) {
			return 'number';
		}
		if ( is_string( $value ) ) {
			return 'string';
		}
		if ( is_array( $value ) ) {
			foreach ( array_keys( $value ) as $k ) {
				if ( ! is_int( $k ) ) {
					return 'object';
				}
			}
			return 'array';
		}
		return 'object';
	}

	private static function build_acf_subprops( array $fields ): array {
		$props        = array();
		$sub_settings = array(
			'disable' => false,
			'filters' => array(),
		);

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

			if ( ! empty( $field['sub_fields'] ) && is_array( $field['sub_fields'] ) ) {
				$field_data['properties'] = self::build_acf_subprops( $field['sub_fields'] );
			}

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
						'properties'  => self::build_acf_subprops( $layout['sub_fields'] ?? array() ),
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

		$taxonomy_values = array_map(
			function ( $taxonomy ) {
				return 'category' === $taxonomy ? 'categories' : ( 'post_tag' === $taxonomy ? 'tags' : $taxonomy );
			},
			$taxonomy_values
		);

		return array(
			array(
				'key'        => 'embed',
				'tooltip'    => 'Resolve Object',
				'label'      => 'Resolve',
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
				'tooltip'    => 'Flatten Rendered',
				'label'      => 'Flatten',
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
				'properties' => array_merge(
					array(
						'featured_media',
						'link',
						'guid',
						'source_url',
						'media_details',
						'_embedded',
						'_links',
					),
					$taxonomy_values
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
			array(
				'key'        => 'search_replace',
				'type'       => 'search_replace',
				'tooltip'    => 'Search & Replace',
				'label'      => 'S&R',
				'properties' => array(
					'title',
					'content',
					'excerpt',
					'guid',
					'link',
					'source_url',
					'description',
					'name',
				),
			),
		);
	}
}

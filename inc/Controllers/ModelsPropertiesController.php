<?php namespace cmk\RestApiFirewall\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Utils;

use WP_REST_Settings_Controller;
use WP_REST_Terms_Controller;
use WP_Post_Type;
use WP_REST_Attachments_Controller;
use WP_REST_Request;

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

		$filters = self::properties_filters();
		$data    = self::get_sample_rest_response_data( $post_type );

		if ( ! empty( $data ) ) {
			$props = self::build_props_from_data( $data, $filters );

			// If the sample item had no embeddable resources, _embedded won't be in the response.
			// Derive it from _links relations that declare embeddable: true.
			if ( ! isset( $props['_embedded'] ) && ! empty( $data['_links'] ) && is_array( $data['_links'] ) ) {
				$embed_sub = array();
				foreach ( $data['_links'] as $rel => $link_set ) {
					if ( ! is_array( $link_set ) ) {
						continue;
					}
					foreach ( $link_set as $link ) {
						if ( ! empty( $link['embeddable'] ) ) {
							$embed_sub[ $rel ] = array(
								'type'     => 'array',
								'settings' => array( 'disable' => false, 'filters' => array() ),
							);
							break;
						}
					}
				}
				if ( ! empty( $embed_sub ) ) {
					$props['_embedded'] = array(
						'type'       => 'object',
						'settings'   => array(
							'disable' => false,
							'filters' => self::get_filters_per_property( '_embedded', $filters ),
						),
						'properties' => $embed_sub,
					);
				}
			}

			if ( function_exists( 'acf_get_field_groups' ) && ! isset( $props['acf'] ) ) {
				error_log( 'RAF - ACF is active but "acf" key not found in REST response for "' . $post_type . '". Ensure ACF REST API fields are enabled for this post type.' );
			}

			return $props;
		}

		// Fallback: schema approach when no real items exist for this type.
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

		return $properties;
	}

	/**
	 * Fetch a real REST response for the given object type and return its serialized data.
	 * Returns an empty array if no items exist or the request fails.
	 */
	private static function get_sample_rest_response_data( string $object_type ): array {

		$rest_base = '';
		$id        = 0;

		if ( taxonomy_exists( $object_type ) ) {
			$tax_obj   = get_taxonomy( $object_type );
			$rest_base = $tax_obj ? ( $tax_obj->rest_base ?: $object_type ) : $object_type;
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
			$rest_base = $pt_obj->rest_base ?: $object_type;
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
			error_log( 'RAF - REST request error for "' . $object_type . '" (/wp/v2/' . $rest_base . '/' . $id . '): ' . $response->get_error_message() );
			return array();
		}

		if ( 200 !== $response->get_status() ) {
			error_log( 'RAF - REST request non-200 for "' . $object_type . '" (/wp/v2/' . $rest_base . '/' . $id . '): status=' . $response->get_status() );
			return array();
		}

		// response_to_data( $response, true ) serializes data, appends _links, and embeds linked resources as _embed.
		$data = rest_get_server()->response_to_data( $response, true );
		error_log( 'RAF - REST data keys for "' . $object_type . '": ' . implode( ', ', array_keys( $data ) ) );
		return $data;
	}

	/**
	 * Recursively build a property tree from actual REST response data.
	 * Type is inferred from the real value; sub-properties are discovered from nested objects.
	 */
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

			// Recurse into JSON objects (associative arrays), up to 2 levels deep.
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

	/**
	 * Infer a JSON type string from a PHP value.
	 */
	private static function infer_json_type( $value ): string {
		if ( is_null( $value ) )   return 'null';
		if ( is_bool( $value ) )   return 'boolean';
		if ( is_int( $value ) )    return 'integer';
		if ( is_float( $value ) )  return 'number';
		if ( is_string( $value ) ) return 'string';
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
					'_embedded',
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

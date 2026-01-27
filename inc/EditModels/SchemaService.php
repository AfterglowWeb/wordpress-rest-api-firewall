<?php namespace cmk\RestApiFirewall\EditModels;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\Permissions;
use cmk\RestApiFirewall\Core\Utils;

class SchemaService {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_rest_firewall_read_schemas', array( $this, 'ajax_read_schemas' ) );
	}

	public function ajax_read_schemas(): void {

		if ( ! Permissions::validate_ajax_crud_rest_api_firewall_options() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$post_types_schemas = self::read_post_types_schemas();
		$taxonomies_schemas = self::read_taxonomies_schemas();

		if ( empty( $post_types_schemas ) ) {
			wp_send_json_error( array( 'message' => 'Invalid REST type' ), 422 );
		}

		wp_send_json_success(
			array(
				'post_types_schemas' => $post_types_schemas,
				'taxonomies_schemas' => $taxonomies_schemas,
			),
			200
		);
	}

	public static function read_post_types_schemas(): array {

		$post_types = Utils::list_post_types();
		$schemas    = array();

		foreach ( $post_types as $post_type ) {

			$type  = sanitize_key( $post_type['value'] );
			$label = $post_type['label'] ?? $type;

			$fields = self::read_schema( $type );

			if ( empty( $fields ) ) {
				continue;
			}

			$schemas[ $type ] = array(
				'kind'   => 'post_type',
				'label'  => $label,
				'fields' => $fields,
			);
		}

		return $schemas;
	}

	public static function read_taxonomies_schemas(): array {

		$taxonomies = Utils::list_taxonomies();
		$schemas    = array();

		foreach ( $taxonomies as $taxonomy ) {

			$type  = sanitize_key( $taxonomy['value'] );
			$label = $taxonomy['label'] ?? $type;

			$fields = self::read_schema( 'term', $type );

			if ( empty( $fields ) ) {
				continue;
			}

			$schemas[ $type ] = array(
				'kind'   => 'taxonomy',
				'label'  => $label,
				'fields' => $fields,
			);
		}

		return $schemas;
	}

	public static function read_schema( string $object_type, string $subtype = '' ): array {

		$controller = self::get_rest_controller( $object_type, $subtype );

		if ( ! $controller || ! method_exists( $controller, 'get_item_schema' ) ) {
			return array();
		}

		$schema = $controller->get_item_schema();

		if ( empty( $schema['properties'] ) || ! is_array( $schema['properties'] ) ) {
			return array();
		}

		$fields = array();

		foreach ( $schema['properties'] as $key => $property ) {

			// 1. Skip protected / readonly fields.
			if ( ! empty( $property['readonly'] ) ) {
				continue;
			}

			// 2. Must have context.
			if ( empty( $property['context'] ) || ! is_array( $property['context'] ) ) {
				continue;
			}

			// 3. Keep only view / embed contexts.
			$contexts = array_values(
				array_intersect( $property['context'], array( 'view', 'embed' ) )
			);

			if ( empty( $contexts ) ) {
				continue;
			}

			// 4. Normalize type.
			$type = $property['type'] ?? 'mixed';

			if ( is_array( $type ) ) {
				$type = array_values(
					array_diff( $type, array( 'null' ) )
				)[0] ?? 'mixed';
			}

			$fields[ $key ] = array(
				'original_key' => $key,
				'key'          => $key,
				'type'         => $type,
				'description'  => isset( $property['description'] ) ? $property['description'] : '',
				'context'      => $contexts,
				'active'       => false,
			);
		}

		return $fields;
	}


	private static function get_rest_controller( string $object_type, string $subtype = '' ): ?object {

		$object_type = sanitize_key( $object_type );

		if ( 'site' === $object_type ) {
			return new \WP_REST_Settings_Controller();
		}

		if ( 'term' === $object_type ) {
			$taxonomy = $subtype ?: 'category';

			if ( taxonomy_exists( $taxonomy ) ) {
				return new \WP_REST_Terms_Controller( $taxonomy );
			}

			return null;
		}

		$post_type = get_post_type_object( $object_type );

		if ( ! ( $post_type instanceof \WP_Post_Type ) || ! $post_type->show_in_rest ) {
			return null;
		}

		$controller_class = $post_type->rest_controller_class;

		if ( ! class_exists( $controller_class ) ) {
			return null;
		}

		if ( 'attachment' === $object_type ) {
			return new \WP_REST_Attachments_Controller( 'attachment' );
		}

		return new $controller_class( $object_type );
	}
}

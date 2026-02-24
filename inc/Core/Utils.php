<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use JsonException;

/**
 * Utils provides general utility methods for WordPress data.
 *
 * For file operations, use FileUtils instead.
 */
class Utils {

	/**
	 * List administrator users.
	 */
	public static function list_users(): array {
		$users = get_users( array( 'role__in' => array( 'administrator' ) ) );

		if ( empty( $users ) ) {
			return array();
		}

		return array_map(
			static function ( \WP_User $user ): array {
				$user_id = (int) $user->ID;
				return array(
					'value'        => $user_id,
					'label'        => sanitize_text_field( $user->display_name ?? '' ),
					'admin_url'    => sanitize_url( get_edit_user_link( $user_id ) ),
					'current_user' => get_current_user_id() === $user_id ? 1 : 0,
				);
			},
			array_filter(
				(array) $users,
				static fn ( $user ) => $user instanceof \WP_User
			)
		);
	}

	/**
	 * List public post types that are exposed in REST.
	 */
	public static function list_post_types(): array {
		$post_types = get_post_types(
			array(
				'show_in_rest' => true,
			),
			'objects'
		);

		error_log( 'Utils::list_post_types - Retrieved post types: ' . print_r( $post_types, true ) );

		if ( empty( $post_types ) ) {
			return array();
		}

		$list = array_map(
			static fn ( object $post_type ) => array(
				'value' => sanitize_key( $post_type->name ),
				'label' => property_exists( $post_type->labels, 'singular_name' )
					? sanitize_text_field( $post_type->labels->singular_name )
					: sanitize_key( $post_type->name ),
				'public' => $post_type->public,
				'_builtin' => $post_type->_builtin,
			),
			$post_types
		);

		return array_values( $list );
	}

	public static function list_taxonomies(): array {
		$taxonomies = get_taxonomies(
			array(
				'show_in_rest' => true,
			),
			'objects'
		);

		if ( empty( $taxonomies ) ) {
			return array();
		}

		$list = array_map(
			static fn ( object $taxonomy ) => array(
				'value' => sanitize_key( $taxonomy->name ),
				'label' => property_exists( $taxonomy->labels, 'singular_name' )
					? sanitize_text_field( $taxonomy->labels->singular_name )
					: sanitize_key( $taxonomy->name ),
				'public' => $taxonomy->public,
				'_builtin' => $taxonomy->_builtin,
			),
			$taxonomies
		);

		return array_values( $list );
	}

	public static function list_posts( string $post_type ): array {
		$posts = get_posts(
			array(
				'post_type' => $post_type,
			)
		);

		if ( empty( $posts ) ) {
			return array();
		}

		$list = array_map(
			static fn ( object $post ) => array(
				'value' => absint( $post->ID ),
				'label' => $post->post_title ? sanitize_text_field( $post->post_title ) : sanitize_key( $post->slug ),
			),
			$posts
		);

		return array_values( $list );
	}

	public static function is_current_screen( string $screen_name ): bool {
		if ( ! is_admin() ) {
			return false;
		}

		$admin_screen = get_current_screen();

		if ( ! is_a( $admin_screen, 'WP_Screen' ) ) {
			return false;
		}

		return in_array(
			$screen_name,
			array(
				$admin_screen->base,
				$admin_screen->parent_base,
				$admin_screen->id,
			),
			true
		);
	}

	public static function json_decode( string $json, $associative = true ): array {
		$data = json_decode( $json, $associative );

		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return array();
		}

		return $data ?? array();
	}
}

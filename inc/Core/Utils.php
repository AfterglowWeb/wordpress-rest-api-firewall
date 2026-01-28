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
			return [];
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
				'public'       => true,
				'show_in_rest' => true,
			),
			'objects'
		);

		if ( empty( $post_types ) ) {
			return [];
		}

		$list = array_map(
			static fn ( object $post_type ) => array(
				'value' => sanitize_key( $post_type->name ),
				'label' => property_exists( $post_type->labels, 'singular_name' )
					? sanitize_text_field( $post_type->labels->singular_name )
					: sanitize_key( $post_type->name ),
			),
			$post_types
		);

		return array_values( $list );
	}

	/**
	 * List public taxonomies that are exposed in REST.
	 */
	public static function list_taxonomies(): array {
		$taxonomies = get_taxonomies(
			array(
				'public'       => true,
				'show_in_rest' => true,
			),
			'objects'
		);

		if ( empty( $taxonomies ) ) {
			return [];
		}

		$list = array_map(
			static fn ( object $taxonomy ) => array(
				'value' => sanitize_key( $taxonomy->name ),
				'label' => property_exists( $taxonomy->labels, 'singular_name' )
					? sanitize_text_field( $taxonomy->labels->singular_name )
					: sanitize_key( $taxonomy->name ),
			),
			$taxonomies
		);

		return array_values( $list );
	}

	/**
	 * Check if the current admin screen matches a given screen name.
	 */
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

	/**
	 * Decode JSON with error handling.
	 *
	 * @throws JsonException If JSON is invalid.
	 */
	public static function json_decode( string $json ): array {
		$data = json_decode( $json, true );

		if ( JSON_ERROR_NONE !== json_last_error() ) {
			throw new JsonException( json_last_error_msg() );
		}

		return $data ?? [];
	}
}

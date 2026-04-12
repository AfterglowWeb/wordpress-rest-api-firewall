<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use JsonException;
use cmk\RestApiFirewall\Core\ObjectTypeSourceTracker;

/**
 * Utils provides general utility methods for WordPress data.
 *
 * For file operations, use FileUtils instead.
 */
class Utils {

	/**
	 * List all WordPress users for entry linking.
	 */
	public static function list_users(): array {
		$users = get_users(
			array(
				'role__in' => array( 'administrator' ),
				'number'   => 500,
				'orderby'  => 'display_name',
				'order'    => 'ASC',
			)
		);

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

	public static function list_rest_api_object_types(): array {
		return array_merge(
			self::list_post_types(),
			self::list_taxonomies(),
			self::format_user_type()
		);
	}

	public static function list_post_types(): array {

		$post_types = get_post_types(
			array(
				'show_in_rest' => true,
			),
			'objects'
		);

		if ( empty( $post_types ) ) {
			return array();
		}

		$list = array_map(
			static function ( object $post_type ): array {
				if ( function_exists( 'icl_object_id' ) ) {
					// WPML is active: count only posts in the current admin language.
					$q     = new \WP_Query(
						array(
							'post_type'      => $post_type->name,
							'post_status'    => array( 'publish', 'inherit' ),
							'posts_per_page' => 1,
							'no_found_rows'  => false,
							'fields'         => 'ids',
						)
					);
					$count = (int) $q->found_posts;
				} else {
					$counts = wp_count_posts( $post_type->name );
					$count  = (int) ( ( $counts->publish ?? 0 ) + ( $counts->inherit ?? 0 ) );
				}
				return array(
					'value'     => sanitize_key( $post_type->name ),
					'label'     => property_exists( $post_type->labels, 'singular_name' )
						? sanitize_text_field( $post_type->labels->singular_name )
						: sanitize_key( $post_type->name ),
					'public'    => $post_type->public || $post_type->publicly_queryable,
					'_builtin'  => $post_type->_builtin,
					'type'      => 'post_type',
					'rest_base' => sanitize_key( property_exists( $post_type, 'rest_base' ) ? $post_type->rest_base : $post_type->name ),
					'source'    => ObjectTypeSourceTracker::get_source_label( $post_type->name, 'post_type', $post_type->_builtin ),
					'count'     => $count,
				);
			},
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
			static function ( object $taxonomy ): array {
				if ( function_exists( 'icl_object_id' ) ) {
					// WPML is active: count terms in the current admin language only.
					$current_lang = apply_filters( 'wpml_current_language', null );
					$count_args   = array(
						'taxonomy'   => $taxonomy->name,
						'hide_empty' => false,
					);
					if ( $current_lang ) {
						$count_args['lang'] = $current_lang;
					}
					$count = wp_count_terms( $count_args );
				} else {
					$count = wp_count_terms(
						array(
							'taxonomy'   => $taxonomy->name,
							'hide_empty' => false,
						)
					);
				}
				return array(
					'value'    => sanitize_key( $taxonomy->name ),
					'label'    => property_exists( $taxonomy->labels, 'singular_name' )
						? sanitize_text_field( $taxonomy->labels->singular_name )
						: sanitize_key( $taxonomy->name ),
					'public'   => $taxonomy->public,
					'_builtin' => $taxonomy->_builtin,
					'type'     => 'taxonomy',
					'source'   => ObjectTypeSourceTracker::get_source_label( $taxonomy->name, 'taxonomy', $taxonomy->_builtin ),
					'count'    => is_wp_error( $count ) ? 0 : (int) $count,
				);
			},
			$taxonomies
		);

		return array_values( $list );
	}

	public static function format_user_type(): array {
		$user_counts = count_users();
		return array(
			array(
				'value'    => 'author',
				'label'    => __( 'Author', 'rest-api-firewall' ),
				'public'   => true,
				'_builtin' => false,
				'type'     => 'author',
				'source'   => 'WordPress',
				'count'    => (int) ( $user_counts['total_users'] ?? 0 ),
			),
		);
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

<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use Exception;
use JsonException;
use WP_Filesystem_Base;
use WP_Error;

class Utils {

	public static function list_users(): array {

		$users = get_users( array( 'role__in' => array( 'administrator' ) ) );

		if ( empty( $users ) ) {
			return [];
		}

		$users_array = array_map(
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

		return $users_array;
	}

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

		$post_types_list = array_map(
			static fn ( object $post_type ) => array(
				'value' => sanitize_key( $post_type->name ),
				'label' => property_exists( $post_type->labels, 'singular_name' ) ?
				sanitize_text_field( $post_type->labels->singular_name ) :
				sanitize_key( $post_type->name ),
			),
			$post_types
		);

		return array_values( $post_types_list );
	}

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

		$taxonomies = array_map(
			static fn ( object $taxonomy ) => array(
				'value' => sanitize_key( $taxonomy->name ),
				'label' => property_exists( $taxonomy->labels, 'singular_name' ) ?
					sanitize_text_field( $taxonomy->labels->singular_name ) :
					sanitize_key( $taxonomy->name ),
			),
			$taxonomies
		);

		return array_values( $taxonomies );
	}

	public static function is_current_screen( string $screen_name ): bool {
		if ( ! is_admin() ) {
			return false;
		}

		$admin_screen = get_current_screen();
		if ( ! is_a( $admin_screen, 'WP_Screen' ) ) {
			return false;
		}
		if ( in_array($screen_name, array(
			$admin_screen->base,  
			$admin_screen->parent_base,
			$admin_screen->id
		), true) ) {
			return true;
		}
		
		return false;
	}

	public static function wp_filesystem() {
		global $wp_filesystem;
		
		if ( ! $wp_filesystem ) {
			try {
				require_once realpath( ABSPATH . 'wp-admin/includes/file.php' );
				WP_Filesystem();
			} catch (Exception $e) {
				new WP_Error( 503, 'WordPress filesystem could not be loaded:' . json_encode( $e ) );
				return null;
			}
		}

		return $wp_filesystem;
	}

	public static function is_readable( string $file_path ): bool {
		
		$wp_filesystem = self::wp_filesystem();

		if( ! $wp_filesystem) {
			return false;
		}

		return $wp_filesystem->is_readable( $file_path );
	}

	public static function is_dir( string $file_dir ): bool {
		
		$wp_filesystem = self::wp_filesystem();

		if( ! $wp_filesystem) {
			return false;
		}

		return $wp_filesystem->is_dir( $file_dir );
	}

	public static function read_file( string $file_path ) {
		
		$wp_filesystem = self::wp_filesystem();

		if( ! $wp_filesystem) {
			return null;
		}

		if ( ! $wp_filesystem->is_readable( $file_path ) ) {
			new WP_Error( 'File is not readable: ' . $file_path );
			return null;
		}

		return $wp_filesystem->get_contents( $file_path );
	}

	public static function write_file( string $file_path, string $file_content ): bool {
		$wp_filesystem = self::wp_filesystem();

		if ( ! $wp_filesystem ) {
			return false;
		}

		$file_dir = dirname( $file_path );

		if ( ! $wp_filesystem->is_dir( $file_dir ) ) {
			if ( ! wp_mkdir_p( $file_dir ) ) {
				return false;
			}
		}

		if ( ! $wp_filesystem->is_writable( $file_dir ) ) {
			return false;
		}

		return $wp_filesystem->put_contents( $file_path, $file_content, FS_CHMOD_FILE );
	}

	public static function mkdir_p( string $dir_path ): bool {
		$wp_filesystem = self::wp_filesystem();

		if ( ! $wp_filesystem ) {
			return false;
		}

		if ( ! $wp_filesystem->is_dir( $dir_path ) ) {
			return wp_mkdir_p( $dir_path );
		}

		return true;
	}

	public static function json_decode( $json ): array {
		$data = json_decode( $json, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			throw new JsonException( json_last_error_msg() );
			return [];
		}
		return $data;
	}
	
}

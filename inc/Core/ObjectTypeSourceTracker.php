<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;


class ObjectTypeSourceTracker {

	private static $post_type_sources = array();

	private static $taxonomy_sources = array();

	private static $plugin_name_cache = null;

	public static function init(): void {
		add_action( 'registered_post_type', array( self::class, 'on_post_type_registered' ), PHP_INT_MAX, 2 );
		add_action( 'registered_taxonomy', array( self::class, 'on_taxonomy_registered' ), PHP_INT_MAX, 3 );
	}

	public static function on_post_type_registered( string $post_type, \WP_Post_Type $post_type_object ): void {
		if ( $post_type_object->_builtin ) {
			self::$post_type_sources[ $post_type ] = array( 'type' => 'wordpress' );
			return;
		}
		self::$post_type_sources[ $post_type ] = self::detect_source();
	}

	public static function on_taxonomy_registered( string $taxonomy, $object_type, array $args ): void {
		if ( ! empty( $args['_builtin'] ) ) {
			self::$taxonomy_sources[ $taxonomy ] = array( 'type' => 'wordpress' );
			return;
		}
		self::$taxonomy_sources[ $taxonomy ] = self::detect_source();
	}

	public static function get_source_label( string $key, string $object_kind, bool $is_builtin = false ): string {
		if ( $is_builtin ) {
			return 'WordPress';
		}
		$source = ( 'taxonomy' === $object_kind )
			? ( self::$taxonomy_sources[ $key ] ?? array( 'type' => 'unknown' ) )
			: ( self::$post_type_sources[ $key ] ?? array( 'type' => 'unknown' ) );

		switch ( $source['type'] ) {
			case 'WordPress':
				return 'WordPress';
			case 'theme':
				$slug = get_stylesheet();
				return $slug ? ucwords( str_replace( array( '-', '_' ), ' ', $slug ) ) : __( 'Theme', 'rest-api-firewall' );
			case 'plugin':
				return self::get_plugin_display_name( $source['folder'] ?? '' );
			default:
				return '';
		}
	}

	private static function detect_source(): array {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace
		$trace       = debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 15 );
		$wp_includes = wp_normalize_path( ABSPATH . 'wp-includes' ) . '/';
		$wp_admin    = wp_normalize_path( ABSPATH . 'wp-admin' ) . '/';
		$plugin_base = wp_normalize_path( WP_PLUGIN_DIR ) . '/';
		$theme_dir   = wp_normalize_path( get_template_directory() ) . '/';
		$child_dir   = wp_normalize_path( get_stylesheet_directory() ) . '/';

		foreach ( $trace as $frame ) {
			if ( empty( $frame['file'] ) ) {
				continue;
			}
			$file = wp_normalize_path( $frame['file'] );

			if ( 0 === strpos( $file, $wp_includes ) || 0 === strpos( $file, $wp_admin ) ) {
				continue;
			}

			if ( 0 === strpos( $file, $plugin_base ) ) {
				$relative = substr( $file, strlen( $plugin_base ) );
				$parts    = explode( '/', $relative, 2 );
				return array(
					'type'   => 'plugin',
					'folder' => $parts[0],
				);
			}

			if ( 0 === strpos( $file, $child_dir ) || 0 === strpos( $file, $theme_dir ) ) {
				return array( 'type' => 'theme' );
			}
		}

		return array( 'type' => 'unknown' );
	}


	private static function get_plugin_display_name( string $folder ): string {
		if ( null === self::$plugin_name_cache ) {
			if ( ! function_exists( 'get_plugins' ) ) {
				// phpcs:ignore WordPress.PHP.RequireOnce.MissingRequireOnce
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			$plugins                 = get_plugins();
			self::$plugin_name_cache = array();
			foreach ( $plugins as $plugin_file => $plugin_data ) {
				$plugin_folder = dirname( $plugin_file );
				if ( '.' === $plugin_folder ) {
					$plugin_folder = basename( $plugin_file, '.php' );
				}
				self::$plugin_name_cache[ $plugin_folder ] = sanitize_text_field( $plugin_data['Name'] );
			}
		}

		if ( isset( self::$plugin_name_cache[ $folder ] ) ) {
			return self::$plugin_name_cache[ $folder ];
		}

		return ucwords( str_replace( array( '-', '_' ), ' ', $folder ) );
	}
}

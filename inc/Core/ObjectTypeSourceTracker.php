<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Tracks which plugin or theme registered each post type / taxonomy.
 *
 * Hooks are registered early (plugins_loaded, inside is_admin()) so that
 * every post type and taxonomy registered on `init` is captured via a
 * lightweight debug_backtrace call at registration time.
 *
 * Built-in WordPress types are detected directly from the _builtin property
 * and never need backtrace inspection.
 */
class ObjectTypeSourceTracker {

	/** @var array<string, array{type: string, folder?: string}> */
	private static $post_type_sources = array();

	/** @var array<string, array{type: string, folder?: string}> */
	private static $taxonomy_sources = array();

	/** @var array<string, string>|null Plugin-folder-name → display-name cache. */
	private static $plugin_name_cache = null;

	/**
	 * Register the early action hooks.
	 * Call this once from Bootstrap inside the is_admin() block.
	 */
	public static function init(): void {
		add_action( 'registered_post_type', array( self::class, 'on_post_type_registered' ), PHP_INT_MAX, 2 );
		add_action( 'registered_taxonomy', array( self::class, 'on_taxonomy_registered' ), PHP_INT_MAX, 3 );
	}

	/**
	 * Capture source when a post type is registered.
	 *
	 * @param string       $post_type         Post type key.
	 * @param \WP_Post_Type $post_type_object  Post type object.
	 */
	public static function on_post_type_registered( string $post_type, \WP_Post_Type $post_type_object ): void {
		if ( $post_type_object->_builtin ) {
			self::$post_type_sources[ $post_type ] = array( 'type' => 'wordpress' );
			return;
		}
		self::$post_type_sources[ $post_type ] = self::detect_source();
	}

	/**
	 * Capture source when a taxonomy is registered.
	 *
	 * @param string          $taxonomy     Taxonomy key.
	 * @param string|string[] $object_type  Linked post type(s).
	 * @param array           $args         WP_Taxonomy cast to array; contains _builtin.
	 */
	public static function on_taxonomy_registered( string $taxonomy, $object_type, array $args ): void {
		if ( ! empty( $args['_builtin'] ) ) {
			self::$taxonomy_sources[ $taxonomy ] = array( 'type' => 'wordpress' );
			return;
		}
		self::$taxonomy_sources[ $taxonomy ] = self::detect_source();
	}

	/**
	 * Return a human-readable source label for a post type or taxonomy.
	 *
	 * Falls back to 'WordPress' for types registered before our hooks fired
	 * (built-ins registered by wp-settings.php) based on the _builtin flag
	 * passed by the caller.
	 *
	 * @param string $key         Post type or taxonomy key.
	 * @param string $object_kind 'post_type' or 'taxonomy'.
	 * @param bool   $is_builtin  Value of the _builtin property.
	 */
	public static function get_source_label( string $key, string $object_kind, bool $is_builtin = false ): string {
		if ( $is_builtin ) {
			return 'WordPress';
		}
		$source = ( 'taxonomy' === $object_kind )
			? ( self::$taxonomy_sources[ $key ] ?? array( 'type' => 'unknown' ) )
			: ( self::$post_type_sources[ $key ] ?? array( 'type' => 'unknown' ) );

		switch ( $source['type'] ) {
			case 'wordpress':
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

	/**
	 * Walk the backtrace to find the first frame outside wp-includes / wp-admin,
	 * then map it to a plugin folder or the active theme directory.
	 *
	 * @return array{type: string, folder?: string}
	 */
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
				return array( 'type' => 'plugin', 'folder' => $parts[0] );
			}

			if ( 0 === strpos( $file, $child_dir ) || 0 === strpos( $file, $theme_dir ) ) {
				return array( 'type' => 'theme' );
			}
		}

		return array( 'type' => 'unknown' );
	}

	/**
	 * Resolve a plugin folder name to a human-readable plugin display name.
	 * Uses get_plugins() with an in-memory cache to avoid repeated disk reads.
	 *
	 * @param string $folder Plugin folder name (e.g. "woocommerce").
	 */
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
					// Single-file plugin (e.g. hello.php).
					$plugin_folder = basename( $plugin_file, '.php' );
				}
				self::$plugin_name_cache[ $plugin_folder ] = sanitize_text_field( $plugin_data['Name'] );
			}
		}

		if ( isset( self::$plugin_name_cache[ $folder ] ) ) {
			return self::$plugin_name_cache[ $folder ];
		}

		// Fallback: title-case the folder slug.
		return ucwords( str_replace( array( '-', '_' ), ' ', $folder ) );
	}
}

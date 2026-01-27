<?php namespace cmk\RestApiFirewall\Theme;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Utils;

class CustomPosts {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'init', array( self::class, 'register_custom_posts' ) );
		add_action( 'init', array( self::class, 'register_custom_taxonomies' ) );
		add_action( 'init', array( self::class, 'hook_admin_column' ) );
	}

	private static function default_post_type_config(): array {
		return array(
			'slug'              => array( 'value' => '', 'sanitize_callback' => 'sanitize_key' ),
			'name'              => array( 'value' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'singular_name'     => array( 'value' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'public'            => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'publicly_queryable' => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_ui'           => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_in_menu'      => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_in_rest'      => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'query_var'         => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'rewrite'           => array( 'value' => '', 'sanitize_callback' => 'sanitize_key' ),
			'capability_type'   => array( 'value' => 'post', 'sanitize_callback' => 'sanitize_key' ),
			'has_archive'       => array( 'value' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'hierarchical'      => array( 'value' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'menu_position'     => array( 'value' => null, 'sanitize_callback' => 'absint' ),
			'menu_icon'         => array( 'value' => 'dashicons-admin-post', 'sanitize_callback' => 'sanitize_text_field' ),
			'supports'          => array( 'value' => array( 'title', 'editor' ), 'sanitize_callback' => array( self::class, 'sanitize_array_keys' ) ),
			'taxonomies'        => array( 'value' => array(), 'sanitize_callback' => array( self::class, 'sanitize_array_keys' ) ),
		);
	}

	private static function default_taxonomy_config(): array {
		return array(
			'slug'              => array( 'value' => '', 'sanitize_callback' => 'sanitize_key' ),
			'name'              => array( 'value' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'singular_name'     => array( 'value' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'post_types'        => array( 'value' => array(), 'sanitize_callback' => array( self::class, 'sanitize_array_keys' ) ),
			'hierarchical'      => array( 'value' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'public'            => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_ui'           => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_admin_column' => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_in_nav_menus' => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_tagcloud'     => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'show_in_rest'      => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'query_var'         => array( 'value' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
			'rewrite'           => array( 'value' => '', 'sanitize_callback' => 'sanitize_key' ),
		);
	}

	private static function sanitize_config( array $input, array $defaults ): ?array {
		$sanitized = array();

		foreach ( $defaults as $key => $field ) {
			$value = $input[ $key ] ?? $field['value'];

			if ( null === $value && null === $field['value'] ) {
				$sanitized[ $key ] = null;
				continue;
			}

			if ( is_callable( $field['sanitize_callback'] ) ) {
				$sanitized[ $key ] = call_user_func( $field['sanitize_callback'], $value );
			} else {
				$sanitized[ $key ] = $value;
			}
		}

		if ( empty( $sanitized['slug'] ) || empty( $sanitized['name'] ) ) {
			return null;
		}

		return $sanitized;
	}


	public static function sanitize_array_keys( $value ): array {
		if ( ! is_array( $value ) ) {
			return array();
		}
		return array_map( 'sanitize_key', $value );
	}

	public static function register_custom_posts(): void {

		$json_content = Utils::read_file( realpath( REST_API_FIREWALL_DIR . '/config/posts.json' ) );
		if ( ! $json_content ) {
			return;
		}

		$config = Utils::json_decode( $json_content );
		if ( empty( $config['posts'] ) || ! is_array( $config['posts'] ) ) {
			return;
		}

		$defaults = self::default_post_type_config();

		foreach ( $config['posts'] as $post_type_config ) {

			$post_type = self::sanitize_config( $post_type_config, $defaults );
			if ( null === $post_type ) {
				continue;
			}

			$lower_singular_name = strtolower( $post_type['singular_name'] ?: $post_type['name'] );

			$labels = array(
				'name'               => $post_type['name'],
				'singular_name'      => $post_type['singular_name'] ?: $post_type['name'],
				'menu_name'          => $post_type['name'],
				/* translators: %s is a singular name */
				'add_new'            => sprintf( esc_html__( 'Add %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'add_new_item'       => sprintf( esc_html__( 'Add New %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'edit_item'          => sprintf( esc_html__( 'Edit %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'new_item'           => sprintf( esc_html__( 'New %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'view_item'          => sprintf( esc_html__( 'View %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a plural name */
				'search_items'       => sprintf( esc_html__( 'Search %s', 'rest-api-firewall' ), strtolower( $post_type['name'] ) ),
				/* translators: %s is a singular name */
				'not_found'          => sprintf( esc_html__( 'No %s found', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'not_found_in_trash' => sprintf( esc_html__( 'No %s found in trash', 'rest-api-firewall' ), $lower_singular_name ),
			);

			$rewrite_slug = $post_type['rewrite'] ?: $post_type['slug'];

			$args = array(
				'labels'             => $labels,
				'public'             => $post_type['public'],
				'publicly_queryable' => $post_type['publicly_queryable'],
				'show_ui'            => $post_type['show_ui'],
				'show_in_menu'       => $post_type['show_in_menu'],
				'show_in_rest'       => $post_type['show_in_rest'],
				'query_var'          => $post_type['query_var'],
				'rewrite'            => array(
					'slug'       => $rewrite_slug,
					'with_front' => false,
				),
				'capability_type'    => $post_type['capability_type'],
				'has_archive'        => $post_type['has_archive'],
				'hierarchical'       => $post_type['hierarchical'],
				'menu_position'      => $post_type['menu_position'],
				'menu_icon'          => $post_type['menu_icon'],
				'supports'           => $post_type['supports'],
				'taxonomies'         => $post_type['taxonomies'],
			);

			register_post_type( $post_type['slug'], $args );
		}
	}

	public static function register_custom_taxonomies(): void {

		$json_content = Utils::read_file( realpath( REST_API_FIREWALL_DIR . '/config/taxonomies.json' ) );
		if ( ! $json_content ) {
			return;
		}

		$config = Utils::json_decode( $json_content );
		if ( empty( $config['taxonomies'] ) || ! is_array( $config['taxonomies'] ) ) {
			return;
		}

		$defaults = self::default_taxonomy_config();

		foreach ( $config['taxonomies'] as $taxonomy_config ) {

			$taxonomy = self::sanitize_config( $taxonomy_config, $defaults );
			if ( null === $taxonomy ) {
				continue;
			}

			$lower_singular_name = strtolower( $taxonomy['singular_name'] ?: $taxonomy['name'] );

			$labels = array(
				'name'              => $taxonomy['name'],
				'singular_name'     => $taxonomy['singular_name'] ?: $taxonomy['name'],
				'menu_name'         => $taxonomy['name'],
				/* translators: %s is a singular name */
				'parent_item'       => sprintf( esc_html__( 'Parent %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'parent_item_colon' => sprintf( esc_html__( 'Parent %s:', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'update_item'       => sprintf( esc_html__( 'Update %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'add_new'           => sprintf( esc_html__( 'Add New %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'add_new_item'      => sprintf( esc_html__( 'Add New %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'new_item'          => sprintf( esc_html__( 'New %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'edit_item'         => sprintf( esc_html__( 'Edit %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a singular name */
				'view_item'         => sprintf( esc_html__( 'View %s', 'rest-api-firewall' ), $lower_singular_name ),
				/* translators: %s is a plural name */
				'all_items'         => sprintf( esc_html__( '%s list', 'rest-api-firewall' ), $taxonomy['name'] ),
				/* translators: %s is a plural name */
				'search_items'      => sprintf( esc_html__( 'Search %s', 'rest-api-firewall' ), strtolower( $taxonomy['name'] ) ),
			);

			$rewrite = $taxonomy['rewrite'] ? array( 'slug' => $taxonomy['rewrite'] ) : array( 'slug' => $taxonomy['slug'] );

			$args = array(
				'labels'            => $labels,
				'hierarchical'      => $taxonomy['hierarchical'],
				'public'            => $taxonomy['public'],
				'show_ui'           => $taxonomy['show_ui'],
				'show_admin_column' => $taxonomy['show_admin_column'],
				'show_in_nav_menus' => $taxonomy['show_in_nav_menus'],
				'show_tagcloud'     => $taxonomy['show_tagcloud'],
				'show_in_rest'      => $taxonomy['show_in_rest'],
				'query_var'         => $taxonomy['query_var'],
				'rewrite'           => $rewrite,
			);

			register_taxonomy(
				$taxonomy['slug'],
				$taxonomy['post_types'],
				$args
			);
		}
	}

	public static function hook_admin_column(): void {
		$post_type_names = get_post_types(
			array(
				'public'       => true
			)
		);

		if ( empty( $post_type_names ) ) {
			return;
		}

		foreach ( $post_type_names as $post_type_name ) {
			self::add_admin_column(
				'Image',
				$post_type_name,
				function ( $post_id ) {
					$thumbnail_id = get_post_thumbnail_id( $post_id );
					if ( $thumbnail_id ) {
						$thumbnail = wp_get_attachment_image(
							$thumbnail_id,
							array( 50, 50 ),
							false,
							array( 'style' => 'box-shadow: 0 0px 3px rgba(0,0,0,0.1); border-radius: 0;' )
						);
						echo wp_kses_post( $thumbnail );
					} else {
						echo '<span style="color: #999;">Aucune image</span>';
					}
				}
			);
		}
	}

	private static function add_admin_column(
		$column_title,
		$post_types,
		$callback,
		$order_by = false,
		$order_by_field_is_meta = false,
		$meta_type = 'meta_value'
	): void {

		if ( ! is_array( $post_types ) ) {
			$post_types = array( $post_types );
		}

		foreach ( $post_types as $post_type ) {

			add_filter(
				'manage_' . $post_type . '_posts_columns',
				function ( $columns ) use ( $column_title ) {
					$columns[ sanitize_title( $column_title ) ] = $column_title;
					return $columns;
				}
			);

			add_action(
				'manage_' . $post_type . '_posts_custom_column',
				function ( $column, $post_id ) use ( $column_title, $callback ) {
					if ( sanitize_title( $column_title ) === $column ) {
						$callback( $post_id );
					}
				},
				10,
				2
			);

			if ( true === empty( $order_by ) ) {
				continue;
			}

			add_filter(
				'manage_edit-' . $post_type . '_sortable_columns',
				function ( $columns ) use ( $column_title, $order_by ) {
					$columns[ sanitize_title( $column_title ) ] = $order_by;
					return $columns;
				}
			);

			add_action(
				'pre_get_posts',
				function ( $query ) use ( $order_by, $order_by_field_is_meta, $meta_type ) {
					if ( false === is_admin() || false === $query->is_main_query() ) {
						return;
					}

					if ( sanitize_key( $order_by ) === $query->get( 'orderby' ) ) {
						if ( $order_by_field_is_meta ) {
							$query->set( 'orderby', $meta_type );
							$query->set( 'meta_key', sanitize_key( $order_by_field_is_meta ) );
						} else {
							$query->set( 'orderby', sanitize_key( $order_by ) );
						}
					}
				}
			);

		}
	}
}

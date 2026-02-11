<?php namespace cmk\RestApiFirewall\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;

use WP_REST_Request;

class SortCollectionsController {

	protected static $instance = null;
	protected static $post_types_names = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		if( true === CoreOptions::read_option('rest_collections_sortable_enabled') ) {
			add_action( 'admin_init', array( $this, 'hook_order_column' ) );
			add_action( 'admin_footer', array( $this, 'print_sortable_styles' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_sortable_scripts' ) );
			add_action( 'wp_ajax_sortable_posts_update_order', array( $this, 'ajax_update_order' ) );
			
			add_action( 'pre_get_posts', array( $this, 'apply_wp_query_order' ) );
			add_action( 'rest_api_init', function (): void {
				foreach ( self::get_sortable_post_types() as $post_type ) {
					add_filter( 'rest_' . $post_type . '_collection_params', array( $this, 'add_menu_order_param' ) );
					add_filter( 'rest_' . $post_type . '_query', array( $this, 'apply_rest_order' ), 10, 2 );

					register_rest_field(
						$post_type,
						'menu_order',
						array(
							'get_callback' => function ( $post ) {
								return (int) get_post_field( 'menu_order', $post['id'] );
							},
							'schema'       => array(
								'description' => 'Menu order for sorting',
								'type'        => 'integer',
								'context'     => array( 'view', 'edit' ),
							),
						)
					);
				}
			} );
		}
	}

	public function enqueue_sortable_scripts( string $hook ): void {
		if ( 'edit.php' !== $hook ) {
			return;
		}
		$screen = get_current_screen();
		if ( ! $screen || ! in_array( $screen->post_type, self::get_sortable_post_types(), true ) ) {
			return;
		}

		wp_enqueue_script(
			'rest-api-firewall-sortable-posts',
			REST_API_FIREWALL_URL . '/assets/js/sortable-posts.js',
			array( 'jquery-core', 'jquery-ui-sortable' ),
			REST_API_FIREWALL_VERSION,
			array( 'in_footer' => true )
		);

		$paged    = get_query_var( 'paged' ) ? absint( get_query_var( 'paged' ) ) : 1;
		$per_page = get_query_var( 'posts_per_page' ) ? absint( get_query_var( 'posts_per_page' ) ) : absint( get_option( 'posts_per_page', 20 ) );

		wp_localize_script(
			'rest-api-firewall-sortable-posts',
			'sortablePostsData',
			array(
				'nonce'   => wp_create_nonce( 'sortable_posts_nonce' ),
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'paged'   => $paged,
				'perPage' => $per_page,
			)
		);
	}

	public function ajax_update_order(): void {
		if ( ! check_ajax_referer( 'sortable_posts_nonce', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => 'Invalid nonce' ), 403 );
		}

		if ( ! current_user_can( 'edit_others_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$order    = isset( $_POST['order'] ) ? array_map( 'absint', (array) $_POST['order'] ) : array();
		$paged    = isset( $_POST['paged'] ) ? absint( $_POST['paged'] ) : 1;
		$per_page = isset( $_POST['perPage'] ) ? absint( $_POST['perPage'] ) : 20;

		if ( empty( $order ) ) {
			wp_send_json_error( array( 'message' => 'No order data' ), 400 );
		}

		global $wpdb;
		$offset = ( $paged - 1 ) * $per_page;

		foreach ( $order as $index => $post_id ) {
			$menu_order = $offset + $index + 1;
			$wpdb->update(
				$wpdb->posts,
				array( 'menu_order' => $menu_order ),
				array( 'ID' => $post_id ),
				array( '%d' ),
				array( '%d' )
			);
			clean_post_cache( $post_id );
		}

		wp_send_json_success( array( 'message' => 'Order updated' ) );
	}

	public function add_menu_order_param( array $query_params ): array {
		$query_params['orderby']['enum'][]  = 'menu_order';
		$query_params['orderby']['default'] = 'menu_order';
		return $query_params;
	}

	public function apply_rest_order( array $args, WP_REST_Request $request ): array {
		$orderby = $request->get_param( 'orderby' );

		if( true === CoreOptions::read_option('rest_collections_sortable_rest_enforce') ) {
			$orderby = 'menu_order';
		}

		if ( 'menu_order' === $orderby ) {
			$args['orderby'] = 'menu_order';
			$args['order']   = 'ASC';
		}
		return $args;
	}

	public function apply_wp_query_order( $query ): void {
		if ( ! $query->is_main_query() ) {
			return;
		}

		$post_type = $query->get( 'post_type' );
		if ( ! in_array( $post_type, self::get_sortable_post_types(), true ) ) {
			return;
		}

		$orderby = $query->get( 'orderby' );

		if( true === CoreOptions::read_option('rest_collections_sortable_wp_query_enforce') ) {
			$orderby = 'menu_order';
		}
		
		if ( 'menu_order' === $orderby ) {
			$query->set(
				'orderby',
				array(
					'menu_order' => 'ASC',
					'date'       => 'DESC',
				)
			);
		}
	}

	public function hook_order_column(): void {
		$post_types = self::get_sortable_post_types();
		foreach ( $post_types as $post_type ) {
			add_filter(
				'manage_' . $post_type . '_posts_columns',
				function ( $columns ) {
					$new_columns = array();
					foreach ( $columns as $key => $value ) {
						$new_columns[ $key ] = $value;
						if ( 'cb' === $key ) {
							$new_columns['menu_order'] = '<span class="dashicons dashicons-menu" title="'
								. esc_attr__( 'Drag to reorder', 'rest-api-firewall' )
								. '"></span>';
						}
					}
					return $new_columns;
				}
			);

			add_action(
				'manage_' . $post_type . '_posts_custom_column',
				function ( $column, $post_id ) {
					if ( 'menu_order' === $column ) {
						echo '<span class="sortable-posts-order">'
							. absint( get_post_field( 'menu_order', $post_id ) )
							. '</span>';
					}
				},
				10,
				2
			);

			/*add_filter(
				'manage_edit-' . $post_type . '_sortable_columns',
				function ( $columns ) {
					$columns['menu_order'] = 'menu_order';
					return $columns;
				}
			);*/
		}
	}

	public function print_sortable_styles(): void {
		$screen = get_current_screen();
		if ( ! $screen || 'edit' !== $screen->base ) {
			return;
		}
		if ( ! in_array( $screen->post_type, self::get_sortable_post_types(), true ) ) {
			return;
		}

		?>
		<style>
			.sortable-posts-enabled .column-menu_order {
				width: 50px;
				text-align: center;
				cursor: grab;
			}
			.sortable-posts-enabled tbody tr {
				cursor: grab;
			}
			.sortable-posts-dragging {
				background: #f0f6fc !important;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
				cursor: grabbing !important;
			}
			.sortable-posts-dragging td,
			.sortable-posts-dragging th {
				cursor: grabbing !important;
			}
			.sortable-posts-placeholder {
				background: #e8f0fe;
				border: 2px dashed #2271b1;
				visibility: visible !important;
			}
			.sortable-posts-order {
				color: #999;
				font-size: 12px;
			}
		</style>
		<?php
	}

	private static function get_sortable_post_types(): array {
		
		if( null !== self::$post_types_names) {
			return self::$post_types_names;
		}

		$post_types = get_post_types(
			array(
				'public'       => true,
				'show_in_rest' => true,
			),
			'names',
		);

		if ( empty( $post_types ) ) {
			return [];
		}

		self::$post_types_names = array_values( array_filter( $post_types, fn( $post_type ) =>  'attachment' !== $post_type ) );
		return self::$post_types_names;

	}

}

<?php namespace cmk\RestApiFirewall\Collections;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\Permissions;

class CollectionOrderController {

	protected static $instance = null;

	public static function get_instance(): self {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_get_collection_orders', array( $this, 'ajax_get_orders' ) );
		add_action( 'wp_ajax_get_collection_items', array( $this, 'ajax_get_items' ) );
		add_action( 'wp_ajax_get_collection_posts', array( $this, 'ajax_get_posts' ) );
		add_action( 'wp_ajax_save_collection_order', array( $this, 'ajax_save_order' ) );
		add_action( 'wp_ajax_reset_collection_order', array( $this, 'ajax_reset_order' ) );
		add_action( 'wp_ajax_get_all_collection_ids', array( $this, 'ajax_get_all_collection_ids' ) );
		add_action( 'wp_ajax_get_collection_items_by_ids', array( $this, 'ajax_get_collection_items_by_ids' ) );
	}

	protected function get_stored_orders(): array {
		$orders = CoreOptions::read_option( 'rest_collection_orders' );
		return is_array( $orders ) ? $orders : array();
	}

	protected function save_stored_orders( array $orders ): void {
		CoreOptions::update_option( 'rest_collection_orders', $orders );
	}

	public function ajax_get_orders(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		wp_send_json_success( array( 'orders' => $this->get_stored_orders() ) );
	}

	public function ajax_get_posts(): void {
		$this->ajax_get_items();
	}

	public function ajax_get_items(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$object = $this->get_requested_object();
		if ( isset( $object['message'] ) ) {
			wp_send_json_error( array( 'message' => $object['message'] ), 400 );
		}

		$page        = $this->get_requested_page();
		$per_page    = $this->get_requested_per_page();
		$app_id      = $this->get_requested_application_id();
		$saved_order = $this->get_saved_order( $object['key'], $app_id );

		if ( 'taxonomy' === $object['kind'] ) {
			$data = $this->get_taxonomy_items_payload( $object['key'], $page, $per_page, $saved_order );
		} else {
			$data = $this->get_post_items_payload( $object['key'], $page, $per_page, $saved_order );
		}

		wp_send_json_success(
			array(
				'items'         => $data['items'],
				'total'         => $data['total'],
				'ordered_count' => count( $saved_order ),
				'ordered_items' => $data['ordered_items'],
				'object_kind'   => $object['kind'],
				'object_key'    => $object['key'],
			)
		);
	}

	public function ajax_save_order(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$page     = $this->get_requested_page();
		$per_page = $this->get_requested_per_page();
		$raw      = isset( $_POST['order'] ) ? sanitize_text_field( wp_unslash( $_POST['order'] ) ) : '[]';
		// phpcs:enable

		$object = $this->get_requested_object();
		if ( isset( $object['message'] ) ) {
			wp_send_json_error( array( 'message' => $object['message'] ), 400 );
		}

		$new_ids = self::sanitize_order_ids( (array) json_decode( $raw, true ) );
		$merged  = $this->merge_page_order( $object['key'], $page, $per_page, $new_ids );

		$orders                   = $this->get_stored_orders();
		$orders[ $object['key'] ] = $merged;
		$this->save_stored_orders( $orders );

		wp_send_json_success( array( 'order' => $merged ) );
	}

	public function ajax_reset_order(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$object = $this->get_requested_object();
		if ( isset( $object['message'] ) ) {
			wp_send_json_error( array( 'message' => $object['message'] ), 400 );
		}

		$orders = $this->get_stored_orders();
		unset( $orders[ $object['key'] ] );
		$this->save_stored_orders( $orders );

		wp_send_json_success( array( 'order' => array() ) );
	}

	public static function merge_order( array $saved_order, int $page, int $per_page, array $new_ids ): array {
		$offset      = $page * $per_page;
		$kept_before = array_slice( $saved_order, 0, $offset );
		$kept_after  = array_slice( $saved_order, $offset + $per_page );
		$others      = array_merge( $kept_before, $kept_after );
		$deduped     = array_values( array_filter( $new_ids, static fn( $id ) => ! in_array( $id, $others, true ) ) );
		return array_values( array_merge( $kept_before, $deduped, $kept_after ) );
	}

	public static function sanitize_order_ids( array $ids ): array {
		$sanitized = array_map( 'absint', $ids );
		$sanitized = array_filter( $sanitized, static fn( $id ) => $id > 0 );
		return array_values( array_unique( $sanitized ) );
	}

	/**
	 * Sanitizes a single per-type per-page config entry.
	 * Called via array_map in CoreOptions::sanitize_option, so receives one entry at a time.
	 */
	public static function sanitize_collection_per_page_settings( $config ) {
		if ( ! is_array( $config ) ) {
			return array(
				'enabled'        => false,
				'items_per_page' => 25,
				'enforce_order'  => false,
			);
		}

		return array(
			'enabled'        => (bool) ( $config['enabled'] ?? false ),
			'items_per_page' => max( 1, min( 100, absint( $config['items_per_page'] ?? 25 ) ) ),
			'enforce_order'  => (bool) ( $config['enforce_order'] ?? false ),
		);
	}

	/**
	 * Sanitizes a single per-type order array (list of post/term IDs).
	 * Called via array_map in CoreOptions::sanitize_option, so receives one entry at a time.
	 */
	public static function sanitize_collection_order_entry( $ids ) {
		if ( ! is_array( $ids ) ) {
			return array();
		}

		return array_map( 'absint', array_filter( $ids, 'is_numeric' ) );
	}

	public function ajax_get_all_collection_ids(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$object = $this->get_requested_object();
		if ( isset( $object['message'] ) ) {
			wp_send_json_error( array( 'message' => $object['message'] ), 400 );
		}

		$app_id      = $this->get_requested_application_id();
		$saved_order = $this->get_saved_order( $object['key'], $app_id );

		if ( 'taxonomy' === $object['kind'] ) {
			$all_ids = $this->get_all_term_ids( $object['key'] );
		} else {
			$all_ids = $this->get_all_post_ids( $object['key'] );
		}

		$unordered = array_values( array_filter( $all_ids, static fn( $id ) => ! in_array( $id, $saved_order, true ) ) );
		$merged    = array_merge( $saved_order, $unordered );

		wp_send_json_success(
			array(
				'ids'   => $merged,
				'total' => count( $merged ),
			)
		);
	}

	public function ajax_get_collection_items_by_ids(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$object = $this->get_requested_object();
		if ( isset( $object['message'] ) ) {
			wp_send_json_error( array( 'message' => $object['message'] ), 400 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified above
		$raw = isset( $_POST['ids'] ) ? sanitize_text_field( wp_unslash( $_POST['ids'] ) ) : '[]';
		$ids = self::sanitize_order_ids( (array) json_decode( $raw, true ) );

		if ( empty( $ids ) ) {
			wp_send_json_success( array( 'items' => array() ) );
		}

		if ( 'taxonomy' === $object['kind'] ) {
			$items = $this->get_items_by_term_ids( $object['key'], $ids );
		} else {
			$items = $this->get_items_by_post_ids( $object['key'], $ids );
		}

		wp_send_json_success( array( 'items' => $items ) );
	}

	private function get_all_post_ids( string $post_type ): array {
		$query = new \WP_Query(
			array(
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future', 'inherit' ),
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'no_found_rows'  => true,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);
		return array_map( 'intval', $query->posts );
	}

	private function get_all_term_ids( string $taxonomy ): array {
		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'fields'     => 'ids',
			)
		);
		return is_wp_error( $terms ) ? array() : array_map( 'intval', $terms );
	}

	private function get_items_by_post_ids( string $post_type, array $ids ): array {
		$query = new \WP_Query(
			array(
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future', 'inherit' ),
				'posts_per_page' => count( $ids ),
				'post__in'       => $ids,
				'orderby'        => 'post__in',
				'no_found_rows'  => true,
			)
		);
		return array_map(
			function ( $post ) {
				$author     = get_userdata( (int) $post->post_author );
				$taxonomies = array();
				foreach ( get_object_taxonomies( $post->post_type, 'objects' ) as $tax_slug => $tax_obj ) {
					if ( empty( $tax_obj->public ) ) {
						continue;
					}
					$terms = wp_get_object_terms( $post->ID, $tax_slug, array( 'fields' => 'names' ) );
					if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
						$taxonomies[ $tax_slug ] = $terms;
					}
				}
				return array(
					'id'            => $post->ID,
					'kind'          => 'post_type',
					'label'         => get_the_title( $post ) ?: '#' . $post->ID,
					'status'        => $post->post_status,
					'author_name'   => $author ? $author->display_name : '',
					'date_created'  => get_the_date( '', $post ),
					'date_modified' => get_the_modified_date( '', $post ),
					'position'      => null,
					'taxonomies'    => $taxonomies,
				);
			},
			$query->posts
		);
	}

	private function get_items_by_term_ids( string $taxonomy, array $ids ): array {
		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'include'    => $ids,
				'orderby'    => 'include',
			)
		);
		if ( is_wp_error( $terms ) ) {
			return array();
		}
		return array_map(
			static function ( $term ) {
				return array(
					'id'       => $term->term_id,
					'kind'     => 'taxonomy',
					'label'    => $term->name ?: '#' . $term->term_id,
					'slug'     => $term->slug,
					'count'    => (int) $term->count,
					'position' => null,
				);
			},
			$terms
		);
	}

	private function merge_page_order( string $object_key, int $page, int $per_page, array $new_ids ): array {
		$orders      = $this->get_stored_orders();
		$saved_order = $orders[ $object_key ] ?? array();
		return self::merge_order( $saved_order, $page, $per_page, $new_ids );
	}

	private function get_requested_object(): array {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- verified via Permissions
		$object_kind = isset( $_POST['object_kind'] ) ? sanitize_key( wp_unslash( $_POST['object_kind'] ) ) : '';
		$object_key  = isset( $_POST['object_key'] ) ? sanitize_key( wp_unslash( $_POST['object_key'] ) ) : '';
		$post_type   = isset( $_POST['post_type'] ) ? sanitize_key( wp_unslash( $_POST['post_type'] ) ) : '';
		$taxonomy    = isset( $_POST['taxonomy'] ) ? sanitize_key( wp_unslash( $_POST['taxonomy'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( ! $object_key ) {
			$object_key = $post_type ? $post_type : $taxonomy;
		}

		if ( ! $object_kind ) {
			$object_kind = $taxonomy ? 'taxonomy' : 'post_type';
		}

		if ( ! $object_key ) {
			return array( 'message' => 'object_key is required' );
		}

		if ( 'taxonomy' === $object_kind ) {
			if ( ! taxonomy_exists( $object_key ) ) {
				return array( 'message' => 'Invalid taxonomy' );
			}
			return array(
				'kind' => 'taxonomy',
				'key'  => $object_key,
			);
		}

		if ( ! post_type_exists( $object_key ) ) {
			return array( 'message' => 'Invalid post type' );
		}

		return array(
			'kind' => 'post_type',
			'key'  => $object_key,
		);
	}

	private function get_requested_page(): int {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified via Permissions
		return isset( $_POST['page'] ) ? max( 0, absint( wp_unslash( $_POST['page'] ) ) ) : 0;
	}

	private function get_requested_per_page(): int {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified via Permissions
		return isset( $_POST['per_page'] ) ? min( 100, max( 1, absint( wp_unslash( $_POST['per_page'] ) ) ) ) : 25;
	}

	private function get_requested_application_id(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified via Permissions
		return isset( $_POST['application_id'] ) ? sanitize_text_field( wp_unslash( $_POST['application_id'] ) ) : '';
	}

	private function get_saved_order( string $object_key, string $app_id ): array {
		$stored     = $this->get_stored_orders();
		$base_order = $stored[ $object_key ] ?? array();
		$resolved   = (array) apply_filters( 'rest_api_firewall_collection_order', $base_order, $object_key, $app_id );
		return self::sanitize_order_ids( $resolved );
	}

	public function get_post_items_payload( string $post_type, int $page, int $per_page, array $saved_order = array() ): array {
		if ( empty( $saved_order ) ) {
			$saved_order = $this->get_saved_order( $post_type, '' );
		}
		$count_query   = new \WP_Query(
			array(
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future', 'inherit' ),
				'posts_per_page' => 1,
				'no_found_rows'  => false,
				'fields'         => 'ids',
			)
		);
		$total         = (int) $count_query->found_posts;
		$page_posts    = $this->get_paginated_posts( $post_type, $page, $per_page, $saved_order );
		$ordered_items = $this->get_ordered_post_items( $post_type, $saved_order );

		return array(
			'items'         => array_map(
				function ( $post ) use ( $saved_order, $post_type ) {
					$author = get_userdata( (int) $post->post_author );
					$pos    = array_search( $post->ID, $saved_order, true );

					$taxonomies = array();
					foreach ( get_object_taxonomies( $post_type, 'objects' ) as $tax_slug => $tax_obj ) {
						if ( empty( $tax_obj->public ) ) {
							continue;
						}
						$terms = wp_get_object_terms( $post->ID, $tax_slug, array( 'fields' => 'names' ) );
						if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
							$taxonomies[ $tax_slug ] = $terms;
						}
					}

					return array(
						'id'            => $post->ID,
						'kind'          => 'post_type',
						'label'         => get_the_title( $post ) ?: '#' . $post->ID,
						'status'        => $post->post_status,
						'author_name'   => $author ? $author->display_name : '',
						'date_created'  => get_the_date( '', $post ),
						'date_modified' => get_the_modified_date( '', $post ),
						'position'      => false !== $pos ? (int) $pos + 1 : null,
						'taxonomies'    => $taxonomies,
					);
				},
				$page_posts
			),
			'total'         => $total,
			'ordered_items' => $ordered_items,
		);
	}

	public function get_taxonomy_items_payload( string $taxonomy, int $page, int $per_page, array $saved_order = array() ): array {
		if ( empty( $saved_order ) ) {
			$saved_order = $this->get_saved_order( $taxonomy, '' );
		}
		$total = wp_count_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
			)
		);

		$page_terms    = $this->get_paginated_terms( $taxonomy, $page, $per_page, $saved_order );
		$ordered_items = $this->get_ordered_term_items( $taxonomy, $saved_order );

		return array(
			'items'         => array_map(
				static function ( $term ) use ( $saved_order ) {
					$pos = array_search( $term->term_id, $saved_order, true );
					return array(
						'id'       => $term->term_id,
						'kind'     => 'taxonomy',
						'label'    => $term->name ?: '#' . $term->term_id,
						'slug'     => $term->slug,
						'count'    => (int) $term->count,
						'position' => false !== $pos ? (int) $pos + 1 : null,
					);
				},
				$page_terms
			),
			'total'         => is_wp_error( $total ) ? 0 : (int) $total,
			'ordered_items' => $ordered_items,
		);
	}

	private function get_paginated_posts( string $post_type, int $page, int $per_page, array $saved_order ): array {
		$offset        = $page * $per_page;
		$saved_count   = count( $saved_order );
		$ordered_slice = array_slice( $saved_order, $offset, $per_page );
		$page_posts    = array();

		if ( ! empty( $ordered_slice ) ) {
			$query       = new \WP_Query(
				array(
					'post_type'      => $post_type,
					'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future', 'inherit' ),
					'posts_per_page' => count( $ordered_slice ),
					'post__in'       => $ordered_slice,
					'orderby'        => 'post__in',
					'no_found_rows'  => true,
				)
			);
			$ordered_map = array();
			foreach ( $query->posts as $post ) {
				$ordered_map[ $post->ID ] = $post;
			}
			foreach ( $ordered_slice as $id ) {
				if ( isset( $ordered_map[ $id ] ) ) {
					$page_posts[] = $ordered_map[ $id ];
				}
			}
		}

		$unordered_needed = $per_page - count( $page_posts );
		if ( $unordered_needed > 0 ) {
			$unordered_offset = max( 0, $offset - $saved_count );
			$query            = new \WP_Query(
				array(
					'post_type'      => $post_type,
					'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future', 'inherit' ),
					'posts_per_page' => $unordered_needed,
					'offset'         => $unordered_offset,
					'post__not_in'   => $saved_order,
					'orderby'        => 'date',
					'order'          => 'DESC',
					'no_found_rows'  => true,
				)
			);
			$page_posts       = array_merge( $page_posts, $query->posts );
		}

		return $page_posts;
	}

	private function get_paginated_terms( string $taxonomy, int $page, int $per_page, array $saved_order ): array {
		$offset        = $page * $per_page;
		$saved_count   = count( $saved_order );
		$ordered_slice = array_slice( $saved_order, $offset, $per_page );
		$page_terms    = array();

		if ( ! empty( $ordered_slice ) ) {
			$ordered_terms = get_terms(
				array(
					'taxonomy'   => $taxonomy,
					'hide_empty' => false,
					'include'    => $ordered_slice,
					'orderby'    => 'include',
				)
			);
			if ( ! is_wp_error( $ordered_terms ) ) {
				$page_terms = $ordered_terms;
			}
		}

		$unordered_needed = $per_page - count( $page_terms );
		if ( $unordered_needed > 0 ) {
			$unordered_terms = get_terms(
				array(
					'taxonomy'   => $taxonomy,
					'hide_empty' => false,
					'exclude'    => $saved_order,
					'number'     => $unordered_needed,
					'offset'     => max( 0, $offset - $saved_count ),
					'orderby'    => 'name',
					'order'      => 'ASC',
				)
			);
			if ( ! is_wp_error( $unordered_terms ) ) {
				$page_terms = array_merge( $page_terms, $unordered_terms );
			}
		}

		return $page_terms;
	}

	private function get_ordered_post_items( string $post_type, array $saved_order ): array {
		if ( empty( $saved_order ) ) {
			return array();
		}

		$query = new \WP_Query(
			array(
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future', 'inherit' ),
				'posts_per_page' => count( $saved_order ),
				'post__in'       => $saved_order,
				'orderby'        => 'post__in',
				'no_found_rows'  => true,
			)
		);

		return array_map(
			static function ( $post ) {
				return array(
					'id'    => $post->ID,
					'label' => get_the_title( $post ) ?: '#' . $post->ID,
				);
			},
			$query->posts
		);
	}

	private function get_ordered_term_items( string $taxonomy, array $saved_order ): array {
		if ( empty( $saved_order ) ) {
			return array();
		}

		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'include'    => $saved_order,
				'orderby'    => 'include',
			)
		);

		if ( is_wp_error( $terms ) ) {
			return array();
		}

		return array_map(
			static function ( $term ) {
				return array(
					'id'    => $term->term_id,
					'label' => $term->name ?: '#' . $term->term_id,
				);
			},
			$terms
		);
	}
}

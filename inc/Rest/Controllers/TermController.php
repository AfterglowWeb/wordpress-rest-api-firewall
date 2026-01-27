<?php namespace cmk\RestApiFirewall\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Models\Factory;
use WP_Post;
use WP_Term;
use WP_REST_Request;
use WP_REST_Response;

class TermController {

	public function __construct() {

		add_filter(
			'rest_firewall_embed_terms',
			function ( WP_Post $post ): array {
				return array_map(
					static function ( string $taxonomy ) use ( $post ): array {
						return self::map_terms( $post, $taxonomy );
					},
					get_object_taxonomies(
						$post->post_type,
						'names'
					)
				);
			},
			1,
			10
		);
	}

	public static function terms_per_post_type( WP_REST_Request $request ): WP_REST_Response {

		$post_type = $request->get_param( 'post_type' );

		$args = array(
			'post_type'      => $post_type,
			'posts_per_page' => -1,
			'post_status'    => 'publish',
		);

		$query      = new \WP_Query( $args );
		$taxonomies = get_object_taxonomies( $post_type, 'objects' );
		$result     = array();

		foreach ( $query->posts as $post ) {

			foreach ( $taxonomies as $taxonomy ) {

				$terms = self::map_terms( $post, $taxonomy->name );

				if ( empty( $terms ) ) {
					continue;
				}

				if ( ! isset( $result[ $taxonomy->name ] ) ) {
					$result[ $taxonomy->name ] = array(
						'taxonomy' => $taxonomy->name,
						'label'    => $taxonomy->label,
						'singular' => $taxonomy->labels->singular_name ?? $taxonomy->label,
						'plural'   => $taxonomy->labels->name ?? $taxonomy->label,
						'terms'    => array(),
					);
				}

				$result[ $taxonomy->name ]['terms'] += $terms;
			}
		}

		foreach ( $result as &$taxonomy ) {
			$taxonomy['terms'] = array_values( $taxonomy['terms'] );
		}

		return rest_ensure_response( $result );
	}


	private static function map_terms( WP_Post $post, string $taxonomy_name ): array {

		$terms = get_the_terms( $post, $taxonomy_name );

		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return array();
		}

		$terms_map = array();

		foreach ( $terms as $term ) {
			$terms_map[ $term->term_id ] = self::term_model( $term );
		}

		return $terms_map;
	}


	private static function factory(): Factory {
		static $factory = null;

		if ( null === $factory ) {
			$factory = new Factory();
		}

		return $factory;
	}

	private static function term_model( WP_Term $term ): array {
		$factory = self::factory();

		$context = $factory->context();

		if ( $context->use_core_rest ) {
			$controller = new \WP_REST_Terms_Controller( $term, $term->taxonomy );
			return $controller
				->prepare_item_for_response( $term, new WP_REST_Request() )
				->get_data();
		}
		return $factory->term( $term );
	}
}

<?php namespace cmk\RestApiFirewall\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Models\Factory;
use WP_Post;
use WP_Term;
use WP_User;
use WP_REST_Request;
use WP_REST_Response;

class PostController {

	public function __construct() {

		add_filter(
			'rest_firewall_relative_url_enabled',
			function ( string $url ): string {

				$base_url = wp_unslash( sanitize_url( site_url( '/' ) ) );
				$parts    = explode( $base_url, $url, 2 );
				if ( ! empty( $parts ) && isset( $parts[1] ) ) {
					return $parts[1];
				}

				return $url;
			},
			1,
			10
		);

		add_filter(
			'rest_firewall_embed_authors',
			function ( WP_Post $post ): array {

				return self::author_model( $post );
			},
			1,
			10
		);
	}

	public static function posts_per_post_type( WP_REST_Request $request ): WP_REST_Response {
		$post_type = $request->get_param( 'post_type' );

		$args  = array(
			'post_type'      => $post_type,
			'posts_per_page' => -1,
			'post_status'    => 'publish',
		);
		$query = new \WP_Query( $args );
		$posts = array();

		foreach ( $query->posts as $post ) {
			$posts[] = self::post_model( $post ); // Models::post_model( $post )
		}

		return rest_ensure_response( $posts );
	}

	private static function factory(): Factory {
		static $factory = null;

		if ( null === $factory ) {
			$factory = new Factory();
		}

		return $factory;
	}

	private static function post_model( WP_Post $post ): array {

		$factory = self::factory();
		$context = $factory->context();

		if ( $context->use_core_rest ) {
			$controller = new \WP_REST_Posts_Controller( $post->post_type );
			return $controller
				->prepare_item_for_response( $post, new WP_REST_Request() )
				->get_data();
		}

		return $factory->post( $post );
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

	private static function author_model( WP_Post $parent_post ): ?array {

		$user = get_user( $parent_post->post_author );
		if ( false === $user instanceof WP_User ) {
			return null;
		}

		$factory = self::factory();

		$context = $factory->context();

		if ( $context->use_core_rest ) {
			return array();
		}

		return $factory->author( $user, $parent_post, $context );

		return $user;
	}
}

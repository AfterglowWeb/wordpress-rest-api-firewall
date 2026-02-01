<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\ModelContext;
use cmk\RestApiFirewall\Schemas\SchemaFilters;
use WP_User;

class PostModel {

	public function __invoke( array $post, ModelContext $context ): array {

		$post = $this->remove_disabled_properties( $post, $context );
		$post = $this->apply_filters( $post, $context );

		return apply_filters(
			'rest_firewall_model_post',
			$post,
			$context
		);
	}

	/**
	 * Remove disabled properties from the post data.
	 */
	protected function remove_disabled_properties( array $post, ModelContext $context ): array {

		foreach ( array_keys( $post ) as $property_key ) {
			if ( $context->is_disabled( $property_key ) ) {
				unset( $post[ $property_key ] );
			}
		}

		return $post;
	}

	/**
	 * Apply configured filters to the post data.
	 */
	protected function apply_filters( array $post, ModelContext $context ): array {

		// Relative URL filters
		if ( isset( $post['link'] ) && $context->should_relative_url( 'link' ) ) {
			$post['link'] = SchemaFilters::relative_url( $post['link'] );
		}

		if ( isset( $post['guid'] ) && $context->should_relative_url( 'guid' ) ) {
			$post['guid'] = is_array( $post['guid'] )
				? SchemaFilters::relative_url( $post['guid']['rendered'] ?? '' )
				: SchemaFilters::relative_url( $post['guid'] );
		}

		// Rendered filters
		foreach ( [ 'title', 'excerpt', 'content', 'guid' ] as $rendered_prop ) {
			if ( isset( $post[ $rendered_prop ] ) && $context->should_render( $rendered_prop ) ) {
				if ( is_array( $post[ $rendered_prop ] ) && isset( $post[ $rendered_prop ]['rendered'] ) ) {
					$post[ $rendered_prop ] = $post[ $rendered_prop ]['rendered'];
				}
			}
		}

		// Embed filters
		if ( isset( $post['featured_media'] ) && $context->should_embed( 'featured_media' ) ) {
			$attachment_model       = new AttachmentModel();
			$post['featured_media'] = $attachment_model( (int) $post['featured_media'], $context );
		}

		if ( isset( $post['author'] ) && $context->should_embed( 'author' ) ) {
			$user = get_userdata( $post['author'] );
			if ( $user instanceof WP_User ) {
				$author_model   = new AuthorModel();
				$post['author'] = $author_model( $user, $context );
			}
		}

		if ( $context->should_embed( 'terms' ) ) {
			$post['terms'] = $this->embed_terms( $post, $context );
		}

		// ACF fields
		if ( $context->with_acf && isset( $post['id'] ) ) {
			$post['acf'] = SchemaFilters::embed_acf_fields( $post['id'] );
		}

		// Remove _links if configured
		if ( $context->remove_links_prop && isset( $post['_links'] ) ) {
			unset( $post['_links'] );
		}

		// Remove empty props if configured
		if ( $context->remove_empty_props ) {
			$post = array_filter( $post, fn( $value ) => ! empty( $value ) || $value === 0 || $value === false );
		}

		return $post;
	}

	/**
	 * Embed terms for the post.
	 */
	protected function embed_terms( array $post, ModelContext $context ): array {

		if ( empty( $post['id'] ) ) {
			return [];
		}

		$post_id    = (int) $post['id'];
		$taxonomies = get_object_taxonomies( get_post_type( $post_id ), 'names' );
		$terms_data = [];
		$term_model = new TermModel();

		foreach ( $taxonomies as $taxonomy ) {
			$terms = wp_get_post_terms( $post_id, $taxonomy );

			if ( is_wp_error( $terms ) || empty( $terms ) ) {
				continue;
			}

			$terms_data[ $taxonomy ] = array_map(
				fn( $term ) => $term_model( (array) $term, $context ),
				$terms
			);
		}

		return $terms_data;
	}
}

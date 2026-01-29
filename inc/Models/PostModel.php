<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Models\ModelContext;
use cmk\RestApiFirewall\Models\Controllers\AttachmentController;
use WP_Post;

class PostModel {

	public function build( WP_Post $post, ModelContext $context ): array {

		$context = apply_filters(
			'rest_firewall_model_post_context',
			$context,
			$post
		);

		$data = $this->base_fields( $post, $context );

		$data = apply_filters(
			'rest_firewall_model_post_build',
			$data,
			$post,
			$context
		);

		$data = apply_filters(
			'rest_firewall_model_post_fields',
			$data,
			$post,
			$context
		);

		return apply_filters(
			'rest_firewall_model_post',
			$data,
			$post,
			$context
		);
	}

	protected function base_fields( WP_Post $post, ModelContext $context ): array {

		$post = sanitize_post( $post );

		$data = array(
			'id'             => (int) $post->ID,
			'type'           => $post->post_type,
			'slug'           => $post->post_name,
			'title'          => $post->post_title,
			'link'           => get_the_permalink( $post ),
			'date'           => get_the_date( 'c', $post ),
			'modified'       => get_the_modified_date( 'c', $post ),
			'featured_media' => (int) get_post_thumbnail_id( $post ),
			'content'        => (string) apply_filters( 'the_content', $post->post_content ),
			'excerpt'        => (string) apply_filters( 'the_excerpt', $post->post_excerpt ),
			'terms'          => array(),
			'attachments'    => array(),
			'images'         => AttachmentController::attachments_per_post_flat( $post ), // Legacy.
		);

		if ( $context->with_acf ) {
			$data['acf'] = apply_filters( 'rest_firewall_model_post_acf', $data['id'] );
		}

		if ( $context->relative_urls ) {
			$data['link'] = apply_filters( 'rest_firewall_relative_url_enabled', $data['link'] );
		}

		if ( $context->embed_attachments ) {
			$data['featured_media'] = apply_filters( 'rest_firewall_embed_featured_attachment', $data['featured_media'], $post );
			$data['attachements']   = apply_filters( 'rest_firewall_embed_post_attachments', $post );
		}

		if ( $context->embed_author ) {
			$data['author'] = apply_filters( 'rest_firewall_embed_author', $post );
		}

		if ( $context->embed_terms ) {
			$data['terms'] = apply_filters( 'rest_firewall_embed_terms', $post );
		}

		return $data;
	}
}

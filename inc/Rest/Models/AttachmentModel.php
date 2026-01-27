<?php namespace cmk\RestApiFirewall\Rest\Models;

use cmk\RestApiFirewall\Rest\Models\ModelContext;

class AttachmentModel {

	public function build( int $attachment_id, ModelContext $context, ?int $parent_id = null, string $field_key = '' ): array {

		$context = apply_filters(
			'rest_firewall_model_attachment_context',
			$context,
			$attachment_id
		);

		$data = $this->base_fields( $attachment_id, $context, $parent_id, $field_key );

		$data = apply_filters(
			'rest_firewall_model_attachment_build',
			$data,
			$attachment_id,
			$context
		);

		$data = apply_filters(
			'rest_firewall_model_attachment_fields',
			$data,
			$attachment_id,
			$context
		);

		return apply_filters(
			'rest_firewall_model_attachment',
			$data,
			$attachment_id,
			$context
		);
	}

	protected function base_fields( int $attachment_id, ModelContext $context, ?int $parent_id, string $field_key ): array {

		$meta = wp_get_attachment_metadata( $attachment_id );
		$url  = wp_get_attachment_url( $attachment_id );

		if ( ! $meta || ! $url ) {
			return array();
		}

		$data = array(
			'id'        => $attachment_id,
			'title'     => get_the_title( $attachment_id ),
			'alt'       => get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
			'mime_type' => get_post_mime_type( $attachment_id ),
			'width'     => $meta['width'] ?? null,
			'height'    => $meta['height'] ?? null,
			'filesize'  => $meta['filesize'] ?? null,
			'parent_id' => $parent_id,
			'field_key' => $field_key,
		);

		$data['src'] = $context->relative_attachment_urls
			? apply_filters( 'rest_firewall_model_relative_attachment_url', $meta['file'], $url )
			: $url;

		if ( $context->with_acf ) {
			$data['acf'] = apply_filters( 'rest_firewall_model_attachment_acf', $attachment_id );
		}

		return $data;
	}
}

<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\ModelContext;
use cmk\RestApiFirewall\Schemas\SchemaFilters;

class AttachmentModel {

	public function __invoke( int $attachment_id, ModelContext $context ): array {

		$data = $this->build_attachment_data( $attachment_id, $context );

		if ( empty( $data ) ) {
			return [];
		}

		$data = $this->remove_disabled_properties( $data, $context );

		return apply_filters(
			'rest_firewall_model_attachment',
			$data,
			$attachment_id,
			$context
		);
	}

	/**
	 * Build the attachment data array.
	 */
	protected function build_attachment_data( int $attachment_id, ModelContext $context ): array {

		$meta = wp_get_attachment_metadata( $attachment_id );
		$url  = wp_get_attachment_url( $attachment_id );

		if ( ! $meta || ! $url ) {
			return [];
		}

		$data = [
			'id'        => $attachment_id,
			'title'     => get_the_title( $attachment_id ),
			'alt'       => get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
			'mime_type' => get_post_mime_type( $attachment_id ),
			'width'     => $meta['width'] ?? null,
			'height'    => $meta['height'] ?? null,
			'filesize'  => $meta['filesize'] ?? null,
		];

		// Handle src with relative URL option
		$data['src'] = $context->relative_attachment_urls
			? SchemaFilters::relative_attachment_url( $meta['file'] )
			: $url;

		// ACF fields
		if ( $context->with_acf ) {
			$data['acf'] = SchemaFilters::embed_acf_fields( $attachment_id );
		}

		return $data;
	}

	/**
	 * Remove disabled properties from the attachment data.
	 */
	protected function remove_disabled_properties( array $data, ModelContext $context ): array {

		foreach ( array_keys( $data ) as $property_key ) {
			if ( $context->is_disabled( $property_key ) ) {
				unset( $data[ $property_key ] );
			}
		}

		return $data;
	}
}

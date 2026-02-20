<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\ModelContext;
use cmk\RestApiFirewallPro\Controllers\ModelsPropertiesControllerPro;

class AttachmentModel {

	public function __invoke( int $attachment_id, ModelContext $context ): array {

		$data = $this->build_attachment_data( $attachment_id, $context );

		if ( empty( $data ) ) {
			return array();
		}

		$data = $this->remove_disabled_properties( $data, $context );

		return apply_filters(
			'rest_firewall_model_attachment',
			$data,
			$attachment_id,
			$context
		);
	}

	protected function build_attachment_data( int $attachment_id, ModelContext $context ): array {

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
		);

		if ( class_exists( '\cmk\RestApiFirewallPro\Controllers\ModelsPropertiesControllerPro' ) ) {

			$data['src'] = $context->relative_attachment_urls
				? ModelsPropertiesControllerPro::relative_attachment_url( $meta['file'] )
				: $url;

			if ( $context->with_acf ) {
				$acf = ModelsPropertiesControllerPro::embed_acf_fields( $attachment_id );
				if ( $acf ) {
					$data['acf'] = $acf;
				} elseif ( isset( $data['acf'] ) ) {
					unset( $data['acf'] );
				}
			}
		}

		return $data;
	}

	protected function remove_disabled_properties( array $data, ModelContext $context ): array {

		foreach ( array_keys( $data ) as $property_key ) {
			if ( $context->is_disabled( $property_key ) ) {
				unset( $data[ $property_key ] );
			}
		}

		return $data;
	}
}

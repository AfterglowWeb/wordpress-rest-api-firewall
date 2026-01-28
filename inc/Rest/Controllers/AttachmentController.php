<?php namespace cmk\RestApiFirewall\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Rest\Models\Factory;
use WP_Post;
use WP_REST_Request;
use WP_REST_Response;

class AttachmentController {

	public function __construct() {

		/**
		 * Copy of private WordPress core function _wp_get_attachment_relative_path in wp-includes/media.php
		 *
		 * @access public
		 *
		 * @param string $file Attachment file name.
		 * @param string $url  Absolute attachment url.
		 * @return string Attachment path relative to the upload directory.
		 */
		add_filter(
			'rest_firewall_model_relative_attachment_url',
			function ( string $file ): string {

				if ( ! $file ) {
					return '';
				}

				$dirname = dirname( $file );

				if ( '.' === $dirname ) {
					return '';
				}

				if ( str_contains( $dirname, 'wp-content/uploads' ) ) {
					// Get the directory name relative to the upload directory (back compat for pre-2.7 uploads).
					$dirname = substr( $dirname, strpos( $dirname, 'wp-content/uploads' ) + 18 );
					$dirname = ltrim( $dirname, '/' );
				}

				return $dirname;
			},
			1,
			10
		);

		add_filter(
			'rest_firewall_embed_post_attachments',
			function ( $post ): array {

				return self::attachments_per_post_flat( $post );
			},
			1,
			10
		);

		add_filter(
			'rest_firewall_embed_featured_attachment',
			function ( WP_Post $post ): array {

				$thumbnail_id = get_post_thumbnail_id( $post->ID );

				return $thumbnail_id
				? self::attachment_model( $thumbnail_id, $post->ID, 'featured_attachment' )
				: array();
			},
			1,
			10
		);
	}

	public static function attachments_per_post_type( WP_REST_Request $request ): WP_REST_Response {

		$post_type = $request->get_param( 'post_type' );

		$args   = array(
			'post_type'      => $post_type,
			'posts_per_page' => -1,
			'post_status'    => 'publish',
		);
		$query  = new \WP_Query( $args );
		$images = array();

		foreach ( $query->posts as $post ) {
			$images = array_merge( $images, self::attachments_per_post_flat( $post ) );
		}

		$images = array_filter( $images );
		$images = array_values(
			array_reduce(
				$images,
				function ( $carry, $img ) {
					$carry[ $img['id'] ] = $img;
					return $carry;
				},
				array()
			)
		);

		$attachments_per_page = array_slice( $images, 0, CoreOptions::read_option( 'rest_api_attachments_per_page' ) );

		return rest_ensure_response( $attachments_per_page );
	}

	public static function attachments_per_post_flat( WP_Post $post ): array {

		$attachments    = array();
		$attachment_ids = array();

		$thumbnail_id = get_post_thumbnail_id( $post->ID );
		if ( $thumbnail_id ) {
			$attachment_ids[] = $thumbnail_id;
		}

		$attachment_ids = array_merge( $attachment_ids, self::get_acf_attachment_ids( $post->ID ) );

		foreach ( $attachment_ids as $index => $attachment_id ) {
			$field_key     = 1 === $index ? 'featured_attachment' : 'gallery';
			$attachments[] = self::attachment_model( $attachment_id, $post->ID, $field_key );
		}

		return (array) apply_filters( 'rest_firewall_model_attachments_per_post', array_filter( $attachments ) );
	}

	private static function factory(): Factory {
		static $factory = null;

		if ( null === $factory ) {
			$factory = new Factory();
		}

		return $factory;
	}

	private static function attachment_model( int $attachment_id, int $parent_id, string $field_key ): array {
		$factory = self::factory();

		$context = $factory->context();

		if ( $context->use_core_rest ) {

			$attachment = get_post( $attachment_id );
			if ( false === $attachment instanceof WP_Post ) {
				return array();
			}

			$controller = new \WP_REST_Attachments_Controller( 'attachment' );

			return $controller
				->prepare_item_for_response( $attachment, new \WP_REST_Request() )
				->get_data();
		}

		return $factory->attachment( $attachment_id, $parent_id, $field_key );
	}



	private static function get_acf_attachment_ids( int $post_id ): array {

		if ( ! function_exists( 'get_fields' ) || false === CoreOptions::read_option( 'rest_firewall_with_acf_enabled' ) ) {
			return array();
		}

		$image_ids = array();
		$fields    = get_fields( $post_id );

		foreach ( $fields as $value ) {

			if ( is_numeric( $value ) && get_post_mime_type( $value ) ) {

				$image_ids[] = absint( $value );

			} elseif ( is_array( $value ) && ! empty( $value ) ) {

				foreach ( $value as $sub_value ) {
					if ( is_numeric( $sub_value ) && get_post_mime_type( $sub_value ) ) {

						$image_ids[] = absint( $sub_value );

					} elseif ( is_array( $sub_value ) && isset( $sub_value['ID'] ) && get_post_mime_type( $sub_value['ID'] ) ) {

						$image_ids[] = absint( $sub_value['ID'] );

					}
				}
			}
		}

		return array_filter( $image_ids );
	}
}

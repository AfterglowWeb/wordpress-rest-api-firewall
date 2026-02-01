<?php namespace cmk\RestApiFirewall\Schemas;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\RoutesController;
use cmk\RestApiFirewall\Controllers\AttachmentController;

use WP_Post;

class SchemaFilters {


	public static function embed_acf_fields( int $object_id ): array {
		return function_exists( 'get_fields' ) ? (array) get_fields( $object_id ) : array();
	}

	public static function resolve_rendered_props(array $post): array {

		foreach ($post as $key => $value) {
			if (
				is_array($value)
				&& isset($value['rendered'])
				&& ( ! isset($value['protected']) || ! $value['protected'] )
			) {
				$post[$key] = $value['rendered'];
			}
		}

		return $post;
	}

	public static function relative_url( string $url ): string {

		$base_url = wp_unslash( sanitize_url( site_url( '/' ) ) );
		$parts    = explode( $base_url, $url, 2 );
		if ( ! empty( $parts ) && isset( $parts[1] ) ) {
			return $parts[1];
		}

		return $url;
	}

	/**
	 * Copy of private WordPress core function _wp_get_attachment_relative_path in wp-includes/media.php
	 *
	 * @access public
	 *
	 * @param string $file Attachment file name.
	 * @param string $url  Absolute attachment url.
	 * @return string Attachment path relative to the upload directory.
	 */
	public static function relative_attachment_url( string $file ): string {

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
	}

}


<?php namespace cmk\RestApiFirewall\Theme;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;

class ImageFiles {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_filter( 'mime_types', array( $this, 'mime_support' ), 10, 1 );
		add_filter( 'wp_handle_upload_prefilter', array( $this, 'core_max_upload_weight' ), 10, 1 );
	}

	public function mime_support( $mimes ): array {

		$svg_webp_support_enabled = CoreOptions::read_option( 'core_svg_webp_support_enabled' );

		if ( empty( $svg_webp_support_enabled ) ) {
			return $mimes;
		}

		$mimes['svg']  = 'image/svg+xml';
		$mimes['webp'] = 'image/webp';
		return $mimes;
	}

	public function core_max_upload_weight( $file ) {

		if ( ! isset( $file['type'] ) || ! isset( $file['size'] ) ) {
			return $file;
		}

		if (false === strpos( $file['type'], 'image' ) ) {
            return $file;
		}

		$max_upload_size_enabled = CoreOptions::read_option( 'core_max_upload_weight_enabled' );

		if( empty ( $max_upload_size_enabled ) ) {
			return $file;
		}

		$file_size        = absint( $file['size'] );
		$max_upload_size  = absint(CoreOptions::read_option( 'core_max_upload_weight' ) );


		if ( $file_size && $max_upload_size && $file_size > $max_upload_size ) {
			$file['error'] = sprintf(
				/* translators: %d is the image weight in ko */
				esc_html__( 'The maximum allowed images weight is %d Ko. Try converting to .webp format to reduce it.', 'rest-api-firewall' ),
				(int) round( $max_upload_size / 1024 )
			);
		}

		return $file;
	}

}

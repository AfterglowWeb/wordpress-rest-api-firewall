<?php namespace cmk\RestApiFirewall\Theme;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;

class PostContent {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'use_block_editor_for_post_type', array( $this, 'disable_gutenberg' ), 10, 2 );
		add_filter( 'the_content', array( $this, 'remove_empty_p_tags' ), 10, 1 );
	}

	public function disable_gutenberg( bool $current_status, string $post_type ): bool {

		$disable_gutenberg_enabled = CoreOptions::read_option( 'theme_disable_gutenberg' );

		if ( empty( $disable_gutenberg_enabled ) ) {
			return $current_status;
		}

		return false;
	}

	public function remove_empty_p_tags( $content ): string {

		$remove_empty_p_tags_enabled = CoreOptions::read_option( 'theme_remove_empty_p_tags_enabled' );

		if ( empty( $remove_empty_p_tags_enabled ) ) {
			return $content;
		}

		$to_fix = array(
			'<p></p>' => '',
			'<p>['    => '[',
			']</p>'   => ']',
			']<br />' => ']',
		);
		return strtr( $content, $to_fix );
	}

}

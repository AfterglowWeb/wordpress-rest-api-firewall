<?php namespace cmk\RestApiFirewall\EditModels;

defined( 'ABSPATH' ) || exit;

class RestFormatter {

	public static function post( \WP_Post $post ): array {
		$controller = new \WP_REST_Posts_Controller( $post->post_type );
		$response   = $controller->prepare_item_for_response( $post, new \WP_REST_Request() );

		return $response->get_data();
	}

	public static function term( \WP_Term $term ): array {
		$controller = new \WP_REST_Terms_Controller( $term->taxonomy );
		$response   = $controller->prepare_item_for_response( $term, new \WP_REST_Request() );

		return $response->get_data();
	}

	public static function attachment( \WP_Post $attachment ): array {
		$controller = new \WP_REST_Attachments_Controller( 'attachment' );
		$response   = $controller->prepare_item_for_response( $attachment, new \WP_REST_Request() );

		return $response->get_data();
	}

	public static function menu(): array {
		$controller = new \WP_REST_Menus_Controller( 'nav_menu' );
		$response   = $controller->prepare_item_for_response( 'nav_menu', new \WP_REST_Request() );

		return $response->get_data();
	}

	public static function menu_item(): array {
		$controller = new \WP_REST_Menu_Items_Controller( 'nav_menu_item' );
		$response   = $controller->prepare_item_for_response( 'nav_menu_item', new \WP_REST_Request() );

		return $response->get_data();
	}

	public static function site(): array {
		$controller = new \WP_REST_Settings_Controller();
		$response   = $controller->prepare_item_for_response( 'nav_menu_item', new \WP_REST_Request() );

		return $response->get_data();
	}
}

<?php namespace cmk\RestApiFirewall\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Models\PostModel;
use cmk\RestApiFirewall\Models\AttachmentModel;
use cmk\RestApiFirewall\Models\AuthorModel;
use cmk\RestApiFirewall\Models\MenuItemModel;
use cmk\RestApiFirewall\Models\SettingsModel;
use cmk\RestApiFirewall\Models\TermModel;
use WP_REST_Request;
use WP_REST_Response;
use WP_User;
use WP_Post;

class ModelsController {

	private ?ModelContext $context = null;
	private string $application_id = '';

	public function resolve_rest_controller( $result, $server, WP_REST_Request $request ) {

		if ( false === $result instanceof WP_REST_Response || false === CoreOptions::read_option( 'rest_models_enabled' ) ) {
			return $result;
		}

		$data = $result->get_data();

		if ( empty( $data ) ) {
			return $result;
		}

		$route     = $request->get_route();
		$post_type = $this->extract_post_type_from_route( $route );
		$taxonomy  = $this->extract_taxonomy_from_route( $route );

		if ( $post_type ) {
			$object_type = 'attachment' === $post_type ? 'attachment' : ( 'nav_menu_item' === $post_type ? 'menu_item' : 'post_type' );
		} elseif ( $taxonomy ) {
			$object_type = 'taxonomy';
		} elseif ( $this->is_settings_route( $route ) ) {
			$object_type = 'settings';
		} else {
			$object_type = 'post_type';
		}

		$this->context = ModelContext::from_options( $object_type, $this->application_id );

		switch ( $object_type ) {

			case 'attachment':
				if ( $this->is_collection( $data ) ) {
					$data = array_map( fn( $attachment ) => $this->attachment_model( $attachment['id'] ?? 0 ), $data );
				} else {
					$data = $this->attachment_model( $data['id'] ?? 0 );
				}
				break;
			case 'taxonomy':
				if ( $this->is_collection( $data ) ) {
					$data = array_map( fn( $term ) => $this->term_model( $term ), $data );
				} else {
					$data = $this->term_model( $data );
				}
				break;
			case 'settings':
				$data = $this->settings_model( $data );
				break;
			case 'post_type':
			default:
				if ( $this->is_collection( $data ) ) {
					$data = array_map( fn( $post ) => $this->post_model( $post ), $data );
				} else {
					$data = $this->post_model( $data );
				}
				break;
		}

		$result->set_data( $data );

		return $result;
	}

	public function post_model( array $post ): array {
		$post_model = new PostModel();
		return $post_model( $post, $this->context );
	}

	public function term_model( array $term ): array {
		$term_model = new TermModel();
		return $term_model( $term, $this->context );
	}

	public function author_model( int $user_id ) {
		$user = get_userdata( $user_id );

		if ( ! $user instanceof WP_User ) {
			return $user_id;
		}

		$author_model = new AuthorModel();
		return $author_model( $user, $this->context );
	}

	public function attachment_model( int $attachment_id ) {
		$attachment = get_post( $attachment_id );

		if ( ! $attachment instanceof WP_Post ) {
			return $attachment_id;
		}

		$attachment_model = new AttachmentModel();
		return $attachment_model( $attachment_id, $this->context );
	}

	public function menu_item_model( array $menu_item ): array {
		$menu_item_model = new MenuItemModel();
		return $menu_item_model( $menu_item, $this->context );
	}

	public function settings_model( array $settings ): array {
		$settings_model = new SettingsModel();
		return $settings_model( $settings, $this->context );
	}

	private function is_collection( $data ): bool {
		return is_array( $data ) && isset( $data[0] ) && is_array( $data[0] );
	}

	private function extract_post_type_from_route( string $route ): string {
		if ( preg_match( '#^/wp/v2/([a-z0-9_-]+)#i', $route, $matches ) ) {
			$potential_type = $matches[1];

			if ( post_type_exists( $potential_type ) ) {
				return $potential_type;
			}

			$singular = rtrim( $potential_type, 's' );
			if ( post_type_exists( $singular ) ) {
				return $singular;
			}
		}

		return '';
	}

	private function extract_taxonomy_from_route( string $route ): string {
		if ( preg_match( '#^/wp/v2/([a-z0-9_-]+)#i', $route, $matches ) ) {
			$potential_taxonomy = $matches[1];

			if ( taxonomy_exists( $potential_taxonomy ) ) {
				return $potential_taxonomy;
			}

			$singular = rtrim( $potential_taxonomy, 's' );
			if ( taxonomy_exists( $singular ) ) {
				return $singular;
			}

			if ( 'categories' === $potential_taxonomy ) {
				return 'category';
			}

			if ( 'tags' === $potential_taxonomy ) {
				return 'post_tag';
			}
		}

		return '';
	}

	private function is_settings_route( string $route ): bool {
		return (bool) preg_match( '#^/wp/v2/settings#i', $route );
	}
}

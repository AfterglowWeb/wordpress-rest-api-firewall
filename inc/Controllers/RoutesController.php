<?php namespace cmk\RestApiFirewall\Controllers;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Models\PostModel;
use cmk\RestApiFirewall\Models\AttachmentModel;
use cmk\RestApiFirewall\Models\AuthorModel;
use cmk\RestApiFirewall\Models\MenuItemModel;
use cmk\RestApiFirewall\Models\TermModel;
use WP_REST_Request;
use WP_User;
use WP_Post;

class RoutesController {

	private ?ModelContext $context = null;
	private string $post_type = '';
	private string $taxonomy = '';
	private string $application_id = '';

	public function resolve_rest_controller( $result, $server, WP_REST_Request $request ) {

		$route = $request->get_route();

		$post_type = $this->extract_post_type_from_route( $route );

		if ( $post_type ) {
			$this->init( $post_type, $this->application_id, 'post_type' );
		} else {
			$taxonomy = $this->extract_taxonomy_from_route( $route );

			if ( $taxonomy ) {
				$this->init( $taxonomy, $this->application_id, 'taxonomy' );
			}
		}

		if ( $this->should_use_core_rest() ) {
			return $result;
		}

		return $result;
	}

	private function init( string $object_type, string $application_id = '', string $object_kind = 'post_type' ): self {
		$this->application_id = $application_id;

		if ( 'taxonomy' === $object_kind ) {
			$this->taxonomy  = $object_type;
			$this->post_type = '';
		} else {
			$this->post_type = $object_type;
			$this->taxonomy  = '';
		}

		$this->context = ModelContext::from_options( $object_type, $application_id );

		return $this;
	}

	private function get_context(): ModelContext {
		if ( null === $this->context ) {
			$object_type = $this->post_type ?: $this->taxonomy;
			$this->context = ModelContext::from_options( $object_type, $this->application_id );
		}

		return $this->context;
	}

	private function should_use_core_rest(): bool {
		return $this->get_context()->use_core_rest;
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

	protected function extract_taxonomy_from_route( string $route ): string {
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

	public function post_model( array $post ): array {
		$post_model = new PostModel();
		return $post_model( $post, $this->get_context() );
	}

	public function term_model( array $term ): array {
		$term_model = new TermModel();
		return $term_model( $term, $this->get_context() );
	}

	/**
	 * @return array|int
	 */
	public function author_model( int $user_id ) {
		$user = get_userdata( $user_id );

		if ( ! $user instanceof WP_User ) {
			return $user_id;
		}

		$author_model = new AuthorModel();
		return $author_model( $user, $this->get_context() );
	}

	/**
	 * @return array|int
	 */
	public function attachment_model( int $attachment_id ) {
		$attachment = get_post( $attachment_id );

		if ( ! $attachment instanceof WP_Post ) {
			return $attachment_id;
		}

		$attachment_model = new AttachmentModel();
		return $attachment_model( $attachment_id, $this->get_context() );
	}

	public function menu_item_model( array $menu_item ): array {
		$menu_item_model = new MenuItemModel();
		return $menu_item_model( $menu_item, $this->get_context() );
	}
}

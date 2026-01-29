<?php namespace cmk\RestApiFirewall\Models;

use cmk\RestApiFirewall\Models\ModelContext;
use cmk\RestApiFirewall\Models\PostModel;
use cmk\RestApiFirewall\Models\TermModel;
use cmk\RestApiFirewall\Models\AttachmentModel;
use cmk\RestApiFirewall\Models\AuthorModel;
use cmk\RestApiFirewall\Models\MenuItemModel;
use WP_Post;
use WP_Term;
use WP_User;

class Factory {

	protected ModelContext $context;
	protected PostModel $post_model;
	protected TermModel $term_model;
	protected AttachmentModel $attachment_model;
	protected AuthorModel $author_model;
	protected MenuItemModel $menu_item_model;

	public function __construct( ModelContext $context = null ) {

		$this->context = $context ? $context : ModelContext::from_options();

		$this->post_model       = new PostModel();
		$this->term_model       = new TermModel();
		$this->attachment_model = new AttachmentModel();
		$this->author_model     = new AuthorModel();
		$this->menu_item_model  = new MenuItemModel();
	}

	public function post( WP_Post $post ): array {
		return $this->post_model->build( $post, $this->context );
	}

	public function term( WP_Term $term ): array {
		return $this->term_model->build( $term, $this->context );
	}

	public function attachment( int $attachment_id, ?int $parent_id = null, string $field_key = '' ): array {
		return $this->attachment_model->build(
			$attachment_id,
			$this->context,
			$parent_id,
			$field_key
		);
	}

	public function author( WP_User $user, WP_Post $post ): array {
		return $this->author_model->build( $user, $post, $this->context );
	}

	public function menu_item( WP_Post $post ): array {
		return $this->menu_item_model->build( $post, $this->context );
	}

	public function context(): ModelContext {
		return $this->context;
	}
}

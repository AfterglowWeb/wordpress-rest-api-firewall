<?php namespace cmk\RestApiFirewall\Controllers;

use cmk\RestApiFirewall\Core\CoreOptions;

class ModelContext {

	public bool $use_core_rest;
	public bool $with_acf;
	public bool $embed_terms;
	public bool $embed_author;
	public bool $embed_featured_attachment;
	public bool $embed_attachments;
	public bool $relative_urls;
	public bool $relative_attachment_urls;
	public bool $resolve_rendered_props;
	public bool $remove_links_prop;
	public bool $remove_empty_props;
	public array $disabled_properties = array();
	public array $property_filters    = array();

	public function has_filter( string $property_key, string $filter_key ): bool {
		return ! empty( $this->property_filters[ $property_key ][ $filter_key ] );
	}

	public function is_disabled( string $property_key ): bool {
		return in_array( $property_key, $this->disabled_properties, true );
	}

	public function should_embed( string $property_key ): bool {
		if ( isset( $this->property_filters[ $property_key ]['embed'] ) ) {
			return $this->property_filters[ $property_key ]['embed'];
		}

		switch ( $property_key ) {
			case 'featured_media':
				return $this->embed_featured_attachment;
			case 'author':
				return $this->embed_author;
			case 'terms':
				return $this->embed_terms;
			default:
				return false;
		}
	}

	public function should_relative_url( string $property_key ): bool {
		if ( isset( $this->property_filters[ $property_key ]['relative_url'] ) ) {
			return $this->property_filters[ $property_key ]['relative_url'];
		}

		return $this->relative_urls;
	}

	public function should_render( string $property_key ): bool {
		if ( isset( $this->property_filters[ $property_key ]['rendered'] ) ) {
			return $this->property_filters[ $property_key ]['rendered'];
		}

		return $this->resolve_rendered_props;
	}

	public static function from_options( string $post_type = '', string $application_id = '' ): self {
		$context                            = new self();
		$context->use_core_rest             = (bool) CoreOptions::read_option( 'rest_models_enabled' );
		$context->with_acf                  = (bool) CoreOptions::read_option( 'rest_models_with_acf_enabled' );
		$context->embed_terms               = (bool) CoreOptions::read_option( 'rest_models_embed_terms_enabled' );
		$context->embed_author              = (bool) CoreOptions::read_option( 'rest_models_embed_author_enabled' );
		$context->embed_featured_attachment = (bool) CoreOptions::read_option( 'rest_models_embed_featured_attachment_enabled' );
		$context->embed_attachments         = (bool) CoreOptions::read_option( 'rest_models_embed_post_attachments_enabled' );
		$context->relative_urls             = (bool) CoreOptions::read_option( 'rest_models_relative_url_enabled' );
		$context->relative_attachment_urls  = (bool) CoreOptions::read_option( 'rest_models_relative_attachment_url_enabled' );
		$context->resolve_rendered_props    = (bool) CoreOptions::read_option( 'rest_models_resolve_rendered_props' );
		$context->remove_links_prop         = (bool) CoreOptions::read_option( 'rest_models_remove_links_prop' );
		$context->remove_empty_props        = (bool) CoreOptions::read_option( 'rest_models_remove_empty_props' );
		$context->disabled_properties       = array();

		/**
		 * Filter the model context.
		 * Allows Pro version to override with fine-grained per-post_type configuration.
		 *
		 * @param ModelContext $context        The context with global options.
		 * @param string       $post_type      The post type being processed.
		 * @param string       $application_id The application ID (Pro only).
		 */
		return apply_filters( 'rest_firewall_model_context', $context, $post_type, $application_id );
	}
}

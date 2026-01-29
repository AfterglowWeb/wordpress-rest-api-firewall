<?php namespace cmk\RestApiFirewall\Models;

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

	public static function from_options(): self {
		$context                            = new self();
		$context->use_core_rest             = (bool) CoreOptions::read_option( 'rest_firewall_use_rest_models_enabled' );
		$context->with_acf                  = (bool) CoreOptions::read_option( 'rest_firewall_with_acf_enabled' );
		$context->embed_terms               = (bool) CoreOptions::read_option( 'rest_firewall_embed_terms_enabled' );
		$context->embed_author              = (bool) CoreOptions::read_option( 'rest_firewall_embed_author_enabled' );
		$context->embed_featured_attachment = (bool) CoreOptions::read_option( 'rest_firewall_embed_featured_attachment_enabled' );
		$context->embed_attachments         = (bool) CoreOptions::read_option( 'rest_firewall_embed_post_attachments_enabled' );
		$context->relative_urls             = (bool) CoreOptions::read_option( 'rest_firewall_relative_url_enabled' );
		$context->relative_attachment_urls  = (bool) CoreOptions::read_option( 'rest_firewall_relative_attachment_url_enabled' );

		return $context;
	}
}

<?php namespace cmk\RestApiFirewall\Rest\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Rest\Models\ModelContext;
use WP_Term;

class TermModel {

	public function build( WP_Term $term, ModelContext $context ): array {

		$context = apply_filters(
			'rest_firewall_model_term_context',
			$context,
			$term
		);

		$data = $this->base_fields( $term, $context );

		$data = apply_filters(
			'rest_firewall_model_term_build',
			$data,
			$term,
			$context
		);

		$data = apply_filters(
			'rest_firewall_model_term_fields',
			$data,
			$term,
			$context
		);

		return apply_filters(
			'rest_firewall_model_term',
			$data,
			$term,
			$context
		);
	}

	protected function base_fields( WP_Term $term, ModelContext $context ): array {

		$term = sanitize_term( $term, $term->taxonomy );

		$data = array(
			'id'          => (int) $term->term_id,
			'taxonomy'    => $term->taxonomy,
			'slug'        => $term->slug,
			'name'        => $term->name,
			'description' => $term->description,
			'count'       => (int) $term->count,
			'link'        => get_term_link( $term ),
		);

		if ( $context->relative_urls ) {
			$data['link'] = apply_filters(
				'rest_firewall_relative_url_enabled',
				get_term_link( $term )
			);
		}

		if ( $context->with_acf ) {
			$data['acf'] = apply_filters( 'rest_firewall_model_term_acf', $term );
		}

		return $data;
	}
}

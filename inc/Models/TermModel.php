<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\ModelContext;
use cmk\RestApiFirewallPro\Controllers\ModelsPropertiesController;

class TermModel {

	public function __invoke( array $term, ModelContext $context ): array {

		$term = $this->remove_disabled_properties( $term, $context );
		$term = $this->apply_filters( $term, $context );

		return apply_filters(
			'rest_firewall_model_term',
			$term,
			$context
		);
	}

	protected function remove_disabled_properties( array $term, ModelContext $context ): array {

		foreach ( array_keys( $term ) as $property_key ) {
			if ( $context->is_disabled( $property_key ) ) {
				unset( $term[ $property_key ] );
			}
		}

		return $term;
	}

	protected function apply_filters( array $term, ModelContext $context ): array {

		if ( class_exists( '\cmk\RestApiFirewallPro\Controllers\ModelsPropertiesController' ) && isset( $term['link'] ) && $context->should_relative_url( 'link' ) ) {
			$term['link'] = ModelsPropertiesController::relative_url( $term['link'] );
		}

		foreach ( array( 'name', 'description' ) as $rendered_prop ) {
			if ( isset( $term[ $rendered_prop ] ) && $context->should_render( $rendered_prop ) ) {
				if ( is_array( $term[ $rendered_prop ] ) && isset( $term[ $rendered_prop ]['rendered'] ) ) {
					$term[ $rendered_prop ] = $term[ $rendered_prop ]['rendered'];
				}
			}
		}

		if ( class_exists( '\cmk\RestApiFirewallPro\Controllers\ModelsPropertiesController' ) && $context->with_acf && isset( $term['id'] ) ) {
			$term['acf'] = ModelsPropertiesController::embed_acf_fields( 'term_' . $term['id'] );
		} elseif ( isset( $term['acf'] ) ) {
			unset( $term['acf'] );
		}

		if ( $context->remove_links_prop && isset( $term['_links'] ) ) {
			unset( $term['_links'] );
		}

		return $term;
	}
}

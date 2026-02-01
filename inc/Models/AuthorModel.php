<?php namespace cmk\RestApiFirewall\Models;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Controllers\ModelContext;
use cmk\RestApiFirewall\Schemas\SchemaFilters;
use WP_User;

class AuthorModel {

	public function __invoke( WP_User $author, ModelContext $context ): array {

		$data = $this->build_author_data( $author, $context );
		$data = $this->remove_disabled_properties( $data, $context );

		return apply_filters(
			'rest_firewall_model_author',
			$data,
			$author,
			$context
		);
	}

	/**
	 * Build the author data array.
	 */
	protected function build_author_data( WP_User $user, ModelContext $context ): array {

		$data = [
			'id'           => $user->ID,
			'nickname'     => $user->get( 'nickname' ),
			'first_name'   => $user->get( 'first_name' ),
			'last_name'    => $user->get( 'last_name' ),
			'display_name' => $user->get( 'display_name' ),
			'description'  => $user->get( 'description' ),
		];

		// ACF fields
		if ( $context->with_acf ) {
			$data['acf'] = SchemaFilters::embed_acf_fields( 'user_' . $user->ID );
		}

		return $data;
	}

	/**
	 * Remove disabled properties from the author data.
	 */
	protected function remove_disabled_properties( array $data, ModelContext $context ): array {

		foreach ( array_keys( $data ) as $property_key ) {
			if ( $context->is_disabled( $property_key ) ) {
				unset( $data[ $property_key ] );
			}
		}

		return $data;
	}
}

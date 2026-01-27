<?php namespace cmk\RestApiFirewall\EditModels;

defined( 'ABSPATH' ) || exit;

class ModelApply {

	public static function post( \WP_Post $post ): array {
		$rest_data = RestFormatter::post( $post );
		$model     = ModelRepository::read_model( 'post' );

		return self::map( $rest_data, $model );
	}

	public static function term( \WP_Term $term ): array {
		$rest_data = RestFormatter::term( $term );
		$model     = ModelRepository::read_model( 'term' );

		return self::map( $rest_data, $model );
	}

	public static function attachment( \WP_Post $attachment ): array {
		$rest_data = RestFormatter::attachment( $attachment );
		$model     = ModelRepository::read_model( 'attachment' );

		return self::map( $rest_data, $model );
	}

	public static function menu(): array {
		$rest_data = RestFormatter::menu();
		$model     = ModelRepository::read_model( 'menu' );

		return self::map( $rest_data, $model );
	}

	public static function menu_item(): array {
		$rest_data = RestFormatter::menu_item();
		$model     = ModelRepository::read_model( 'menu_item' );

		return self::map( $rest_data, $model );
	}

	public static function map( array $data, array $config ): array {
		$output = array();

		foreach ( $config as $entry ) {
			$original_key = $entry['original_key'];
			$new_key      = $entry['key'];

			if ( ! array_key_exists( $original_key, $data ) ) {
				continue;
			}

			$value = $data[ $original_key ];

			if ( ! empty( $entry['sanitize_callback'] ) && is_callable( $entry['sanitize_callback'] ) ) {
				$value = call_user_func( $entry['sanitize_callback'], $value );
			}

			if ( ! empty( $entry['parse_callback'] ) && is_callable( $entry['parse_callback'] ) ) {
				$value = call_user_func( $entry['parse_callback'], $value, $data );
			}

			$output[ $new_key ] = $value;
		}

		return $output;
	}
}

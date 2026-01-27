<?php namespace cmk\RestApiFirewall\EditModels;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\Permissions;

class ModelRepository {

	protected static $instance = null;
	private static $config_dir = '';

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action(
			'admin_init',
			function () {
				$dir = get_stylesheet_directory() . '/config';

				if ( ! is_dir( $dir ) ) {
					wp_mkdir_p( $dir );
				}

				self::$config_dir = realpath( $dir );
			}
		);
		add_action( 'wp_ajax_rest_firewall_crud_model', array( $this, 'ajax_crud_model' ) );
	}

	public function ajax_crud_model() {
		if ( false === Permissions::validate_ajax_crud_rest_api_firewall_options() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		if ( ! isset( $_POST['data'] ) || ! isset( $_POST['method'] ) ) {
			wp_send_json_error( array( 'message' => 'Missing Parameter' ), 422 );
		}

		$json_content = sanitize_text_field( wp_unslash( $_POST['data'] ) );
		$method       = sanitize_key( wp_unslash( $_POST['method'] ) );

		try {
			$data = json_decode( $json_content, true, 512, JSON_THROW_ON_ERROR );
		} catch ( \JsonException $exception ) {
			wp_send_json_error( array( 'message' => $exception->getMessage() ), 500 );
		}

		$model_entry = array();

		switch ( $method ) {
			case 'create':
				$model_entry = self::create_model( $data );
				break;

			case 'read':
				$uuid = self::object_uuid( $data );
				if ( empty( $uuid ) ) {
					return;
				}
				$model_entry = self::read_model( $uuid );
				break;

			case 'update':
				$uuid = self::object_uuid( $data );
				if ( empty( $uuid ) ) {
					return;
				}
				$model_entry = self::update_model( $uuid, $data );

				break;

			case 'delete':
				$uuid = self::object_uuid( $data );
				if ( empty( $uuid ) ) {
					return;
				}

				if ( false === self::delete_model( $uuid ) ) {
					wp_send_json_error( array( 'error' => 'An error occured deleting the model.' ), 500 );
				}
				wp_send_json_success( array( 'message' => 'Model deleted successfully.' ), 200 );
				break;
		}

		if ( empty( $model_entry ) ) {
			wp_send_json_error( array( 'message' => 'Data is corrupt.' ), 500 );
		}

		return wp_send_json_success( $model_entry, 200 );
	}

	public static function create_model( array $data ): array {

		$model             = self::sanitize_model_instance( $data );
		$model['uuid']     = wp_generate_uuid4();
		$model['created']  = current_time( 'c' );
		$model['modified'] = $model['created'];

		self::write( $model['uuid'], $model );

		return $model;
	}

	public static function update_model( string $uuid, array $data ): array {

		$existing = self::read_model( $uuid );

		if ( empty( $existing ) ) {
			return array();
		}

		$model             = self::sanitize_model_instance( $data, $existing );
		$model['uuid']     = $uuid;
		$model['created']  = $existing['created'];
		$model['modified'] = current_time( 'c' );

		self::write( $uuid, $model );

		return $model;
	}

	public static function read_model( string $uuid ): array {

		$file = self::$config_dir . '/' . sanitize_file_name( $uuid ) . '.json';

		if ( ! is_readable( $file ) ) {
			return array();
		}

		$data = json_decode( file_get_contents( $file ), true );

		return is_array( $data ) ? $data : array();
	}

	public static function delete_model( string $uuid ): bool {

		$file = self::$config_dir . '/' . sanitize_file_name( $uuid ) . '.json';

		if ( ! is_readable( $file ) ) {
			return false;
		}

		return wp_delete_file( $file );
	}

	private static function sanitize_model_instance( array $input, array $existing = array() ): array {

		$rest_post_type = sanitize_key( $input['rest_post_type'] ?? $existing['rest_post_type'] ?? '' );

		return array(
			'title'                 => sanitize_text_field( $input['title'] ?? $existing['title'] ?? '' ),

			'rest_post_type'        => $rest_post_type,

			'rest_controller_class' =>
				self::rest_post_type_controller_class( $rest_post_type ),

			'author'                => absint(
				$input['author'] ?? get_current_user_id()
			),

			'fields'                => self::sanitize_fields(
				$input['fields'] ?? array(),
				$rest_post_type
			),
		);
	}

	private static function sanitize_fields( array $fields, string $rest_post_type ): array {

		$schema = SchemaService::read_schema( $rest_post_type );

		if ( empty( $schema ) ) {
			return array();
		}

		$user_fields = array();
		foreach ( $fields as $field ) {
			if ( isset( $field['original_key'] ) ) {
				$user_fields[ $field['original_key'] ] = $field;
			}
		}

		$sanitized = array();

		foreach ( $schema as $schema_field ) {

			$key = $schema_field['original_key'];

			$user = $user_fields[ $key ] ?? array();

			$sanitized[] = array(
				'original_key'      => $key,

				'key'               => isset( $user['key'] )
					? sanitize_key( $user['key'] )
					: $key,

				'sanitize_callback' => isset( $user['sanitize_callback'] )
					? sanitize_text_field( $user['sanitize_callback'] )
					: '',

				'parse_callback'    => isset( $user['parse_callback'] )
					? sanitize_text_field( $user['parse_callback'] )
					: '',

				'active'            => isset( $user_fields[ $key ] )
					? (bool) ( $user['active'] ?? false )
					: false,
			);
		}

		return $sanitized;
	}

	private static function write( string $uuid, array $model ): void {

		$file = self::$config_dir . '/' . sanitize_file_name( $uuid ) . '.json';

		file_put_contents(
			$file,
			wp_json_encode( $model, JSON_THROW_ON_ERROR )
		);
	}

	private static function object_uuid( $data ) {
		$uuid = sanitize_key( $data['uuid'] );
		return wp_is_uuid( $uuid ) ? $uuid : '';
	}

	private static function rest_post_type_controller_class( string $post_type ): string {

		$obj = get_post_type_object( $post_type );

		return $obj instanceof \WP_Post_Type
			? $obj->rest_controller_class
			: '';
	}
}

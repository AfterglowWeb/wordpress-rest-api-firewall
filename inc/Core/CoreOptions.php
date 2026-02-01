<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\MultiSite;

class CoreOptions {
	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_init', array( $this, 'hook_filters' ) );
	}

	public static function options_config(): array {
		
		$options = array(

			// Models.

			'rest_models_enabled'        => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_models_embed_featured_attachment_enabled' => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_models_embed_post_attachments_enabled' => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', ' pro']
			),
			
			'rest_models_resolve_rendered_props'         => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_firewall_remove_links_prop'         => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_models_embed_terms_enabled'            => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_models_embed_author_enabled'           => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_models_with_acf_enabled'               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_models_remove_empty_props'         => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			// Collections.

			'rest_api_posts_per_page'                      => array(
				'default_value'     => 100,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'rest_api_attachments_per_page'                => array(
				'default_value'     => 100,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			// Application.

			'application_host'                             => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'application_webhook_endpoint'                 => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'application_webhook_auto_trigger_events'      => array(
				'default_value'     => array(),
				'type'              => 'array',
				'sanitize_callback' => 'sanitize_key',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			// Theme.

			'theme_redirect_templates_enabled'              => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_redirect_templates_preset_url'           => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_disable_gutenberg'               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_disable_comments'                => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_remove_empty_p_tags_enabled'             => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_svg_webp_support_enabled'                => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_max_upload_weight'                       => array(
				'default_value'     => 1024, // KB.
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_max_upload_weight_enabled'               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

			'theme_json_acf_fields_enabled'        => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => ['free', 'pro']
			),

		);

		return self::is_pro_active() ? apply_filters( 'rest_api_firewall_core_options', $options ) : $options;
	}

	public static function is_pro_active(): bool {
		if ( ! class_exists('\cmk\RestApiFirewallPro\Core\License')) {
			return false;
		}
		
		return \cmk\RestApiFirewallPro\Core\License::is_pro_licensed();
	}

	public function register_settings(): void {
		register_setting(
			'rest_api_firewall_options_group',
			'rest_api_firewall_options',
			array(
				'sanitize_callback' => array( self::class, 'sanitize_options' ),
				'default'           => self::default_options(),
				'show_in_rest'      => self::show_in_rest() ? self::rest_options_schema() : false,
			)
		);
	}

	public static function hook_filters(): array {
		$filtered = array();

		foreach ( self::read_options() as $option_key => $value ) {
			$filtered[ $option_key ] = self::sanitize_option( $option_key, apply_filters( 'rest_api_firewall_' . $option_key, $value ) );
		}

		return $filtered;
	}

	public static function read_options(): array {
		return self::sanitize_options( MultiSite::multisite_get_option( 'rest_api_firewall_options', array() ) );
	}

	public static function read_option( string $option_key ) {
		$option_key = sanitize_key( $option_key );
		$options    = self::sanitize_options( MultiSite::multisite_get_option( 'rest_api_firewall_options', array() ) );
		return isset( $options[ $option_key ] ) ? $options[ $option_key ] : false;
	}

	/**
	 * Update options with partial support.
	 * Only provided options are updated, others keep their current values.
	 *
	 * @param array $new_options Options to update.
	 */
	public static function update_options( array $new_options ): array {

		$old_options       = self::read_options();
		$sanitized_options = self::sanitize_options( $new_options, false );

		MultiSite::multisite_update_option( 'rest_api_firewall_options', $sanitized_options );

		do_action( 'rest_firewall_admin_options_updated', $sanitized_options, $old_options );

		return $sanitized_options;
	}

	public static function update_option( string $option_key, $new_option ) {

		$old_option = self::read_option( $option_key );
		if ( false === $old_option ) {
			return false;
		}

		$sanitized_option       = self::sanitize_option( $option_key, $new_option );
		$options                = self::read_options();
		$options[ $option_key ] = $sanitized_option;

		MultiSite::multisite_update_option( 'rest_api_firewall_options', $options );

		do_action( 'rest_firewall_admin_option_updated', $option_key, $sanitized_option, $old_option );

		return $sanitized_option;
	}

	private static function show_in_rest(): bool {
		return (bool) apply_filters(
			'rest_api_firewall_show_admin_options_in_rest',
			false
		);
	}

	private static function rest_options_schema(): array {
		$schema = array(
			'type'       => 'object',
			'properties' => array(),
		);

		foreach ( self::options_config() as $key => $config ) {
			if ( empty( $config['rest_expose'] ) ) {
				continue;
			}


			$schema['properties'][ $key ] = array(
				'type' => $$config['type'],
			);
		}

		return array( 'schema' => $schema );
	}

	private static function default_options(): array {
		$defaults = array();

		foreach ( self::options_config() as $key => $config ) {
			$defaults[ $key ] = $config['default_value'];
		}

		return $defaults;
	}

	/**
	 * Sanitize options array.
	 *
	 * @param array $options        Options to sanitize.
	 * @param bool  $use_defaults   If true, merge with defaults. If false, merge with current saved options.
	 */
	public static function sanitize_options( array $options, bool $use_defaults = true ): array {
		$options_config = self::options_config();
		$base_values    = $use_defaults ? self::default_options() : MultiSite::multisite_get_option( 'rest_api_firewall_options', self::default_options() );

		$options   = wp_parse_args( $options, $base_values );
		$sanitized = array();

		foreach ( $options_config as $option_key => $config ) {
			$sanitized_key = sanitize_key( $option_key );
			$value         = $options[ $option_key ];

			$sanitized[ $sanitized_key ] = self::sanitize_option( $option_key, $value );
		}

		return $sanitized;
	}

	private static function sanitize_option( string $option_key, $option_value ) {
		$options_config = self::options_config();

		if ( ! isset( $options_config[ $option_key ] ) ) {
			return null;
		}

		$config   = $options_config[ $option_key ];
		$callback = $config['sanitize_callback'] ?? null;
		$type     = $config['type'] ?? 'string';

		if ( ! is_callable( $callback ) ) {
			return $config['default_value'] ? $config['default_value'] : null;
		}

		switch ( $type ) {
			case 'boolean':
				return (bool) call_user_func( $callback, $option_value );

			case 'integer':
				return (int) call_user_func( $callback, $option_value );

			case 'array':
				return is_array( $option_value )
					? array_map( $callback, $option_value )
					: array();

			case 'string':
			default:
				return (string) call_user_func( $callback, $option_value );
		}
	}

}

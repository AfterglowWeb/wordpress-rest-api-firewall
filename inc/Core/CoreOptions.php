<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\MultiSite;
use cmk\RestApiFirewall\Firewall\WordpressAuth;

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

		add_action(
			'rest_firewall_options_updated',
			function ( array $new_user, array $old_user ) {
				if ( ( $new_user['firewall_user_id'] ?? 0 ) !== ( $old_user['firewall_user_id'] ?? 0 ) ) {
					WordpressAuth::sync_rest_api_user( $new_user['firewall_user_id'], $old_user['firewall_user_id'] );
				}
			},
			10,
			2
		);
	}

	public static function options_config(): array {

		$options = array(

			// Firewall - Authentication & Rate Limiting.
			'firewall_auth_method'                        => array(
				'default_value'     => 'wp_auth',
				'type'              => 'string',
				'sanitize_callback' => static fn( $v ) => in_array( $v, array( 'wp_auth', 'jwt' ), true ) ? $v : 'wp_auth',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'firewall_jwt_algorithm'                      => array(
				'default_value'     => 'RS256',
				'type'              => 'string',
				'sanitize_callback' => static fn( $v ) => in_array( $v, array( 'HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256' ), true ) ? $v : 'RS256',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'firewall_jwt_public_key'                     => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'firewall_jwt_audience'                       => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'firewall_jwt_issuer'                         => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'firewall_user_id'                            => array(
				'default_value'     => 0,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'rate_limit'                                  => array(
				'default_value'     => 30,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'rate_limit_time'                             => array(
				'default_value'     => 60,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'rate_limit_release'                          => array(
				'default_value'     => 300,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'rate_limit_blacklist'                        => array(
				'default_value'     => 5,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			'rate_limit_blacklist_time'                   => array(
				'default_value'     => 3600,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_auth_rate',
			),

			// Firewall - Routes & Policies.
			'firewall_routes_policy_enabled'              => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			'enforce_auth'                                => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			'enforce_rate_limit'                          => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			'hide_user_routes'                            => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			'hide_oembed_routes'                          => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			'hide_batch_routes'                           => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			'firewall_policy'                             => array(
				'default_value'     => array(
					'nodes'  => array(),
					'routes' => array(),
				),
				'type'              => 'array',
				'sanitize_callback' => '',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'firewall_routes_policy',
			),

			// Collections.
			'rest_collections_per_page_enabled'           => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'collections',
			),

			'rest_collections_posts_per_page'             => array(
				'default_value'     => 100,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'collections',
			),

			'rest_collections_attachments_per_page'       => array(
				'default_value'     => 100,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'collections',
			),

			// Settings Route.
			'rest_models_embed_menus_enabled'             => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'settings_route',
			),

			'rest_models_acf_options_page_enabled'        => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'settings_route',
			),

			'rest_models_acf_options_page_endpoint'       => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'settings_route',
			),

			'rest_models_embed_menus_endpoint'            => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'settings_route',
			),

			'application_webhook_endpoint'                => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'webhook',
			),

			'application_webhook_custom_secret_enabled'   => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'webhook',
			),

			'application_webhook_auto_trigger_events'     => array(
				'default_value'     => array(),
				'type'              => 'array',
				'sanitize_callback' => 'sanitize_key',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'webhook',
			),

			// Global security.
			'theme_disable_xmlrpc'                        => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_disable_comments'                      => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_disable_pingbacks'                     => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_disable_rss'                           => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_disable_sitemap'                       => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_enforce_wpconfig_permissions'          => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_secure_uploads_dir'                    => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_secure_http_headers'                   => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_compression_http_headers'              => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_wp_http_headers'                       => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'global_security',
			),

			'theme_redirect_templates_enabled'            => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			// Theme.
			'theme_redirect_templates_preset_url'         => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_redirect_templates_free_url_enabled'   => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_redirect_templates_free_url'           => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_url',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_remove_empty_p_tags_enabled'           => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_remove_emoji_scripts'                  => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_svg_webp_support_enabled'              => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_max_upload_weight'                     => array(
				'default_value'     => 1024, // KB.
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_max_upload_weight_enabled'             => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_json_acf_fields_enabled'               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			'theme_disable_gutenberg'                     => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'theme',
			),

			// Module enable toggles — visible in free (as locked), functional with PRO licence.
			'user_rate_limit_enabled'                     => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'user_rate_limit',
			),

			'rest_models_enabled'                         => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			// Global output filters (Post Types & Taxonomies).
			'rest_models_relative_url_enabled'            => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_relative_attachment_url_enabled' => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_remove_links_prop'               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_remove_embed_prop'               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_remove_empty_props'              => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_remove_empty_props_recursively'  => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			// Global output filters (Post Types only).
			'rest_models_resolve_rendered_props'          => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_embed_featured_attachment_enabled' => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_embed_post_attachments_enabled'  => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_embed_terms_enabled'             => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_embed_author_enabled'            => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'free', 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_date_format_enabled'             => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_date_format'                     => array(
				'default_value'     => 'rest_api',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_models_date_format_custom'              => array(
				'default_value'     => '',
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'models_properties',
			),

			'rest_settings_route_enabled'                 => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'settings_route',
			),

			'rest_collections_enabled'                    => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'collections',
			),

			'automations_enabled'                         => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'automations',
			),

			'webhooks_enabled'                            => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'webhook',
			),

			'mails_enabled'                               => array(
				'default_value'     => false,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'rest_expose'       => false,
				'context'           => array( 'pro' ),
				'group'             => 'email',
			),

		);

		return self::is_pro_active() ? apply_filters( 'rest_api_firewall_core_options', $options ) : $options;
	}

	public static function options_config_for_js(): array {
		$config    = self::options_config();
		$js_config = array();

		foreach ( $config as $key => $c ) {
			$js_config[ $key ] = array(
				'default_value' => $c['default_value'],
				'type'          => $c['type'],
				'group'         => $c['group'] ?? 'firewall',
				'context'       => $c['context'] ?? array( 'free' ),
			);
		}

		return $js_config;
	}

	public static function is_pro_active(): bool {
		if ( ! class_exists( '\cmk\RestApiFirewallPro\Core\License' ) ) {
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

	public static function update_options( array $new_options ): array {

		$old_options       = self::read_options();
		$sanitized_options = self::sanitize_options( $new_options, false );

		MultiSite::multisite_update_option( 'rest_api_firewall_options', $sanitized_options );

		do_action( 'rest_firewall_admin_options_updated', $sanitized_options, $old_options );

		return $sanitized_options;
	}

	public static function update_option( string $option_key, $new_option ) {

		$options_config = self::options_config();
		if ( ! isset( $options_config[ $option_key ] ) ) {
			return false;
		}

		$old_option = self::read_option( $option_key );

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
				'type' => $config['type'],
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

	public static function sanitize_option( string $option_key, $option_value ) {
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

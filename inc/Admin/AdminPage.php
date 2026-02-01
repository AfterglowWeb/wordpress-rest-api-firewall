<?php
namespace cmk\RestApiFirewall\Admin;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\FileUtils;
use cmk\RestApiFirewall\Core\Utils;
use cmk\RestApiFirewall\Schemas\SchemaRepo;

class AdminPage {
	protected static $instance = null;

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
				$role_object = get_role( 'administrator' );
				$role_object->add_cap( 'rest_api_firewall_edit_options' );
			}
		);
		add_action( 'admin_menu', array( $this, 'register_admin_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_footer', array( $this, 'print_inline_styles' ), 20 );
	}

	public function register_admin_page() {
		add_menu_page(
			__( 'REST API Firewall Admin', 'rest-api-firewall' ),
			__( 'REST API Firewall', 'rest-api-firewall' ),
			'rest_api_firewall_edit_options',
			'rest-api-firewall-admin',
			array( $this, 'render_admin_page' ),
			'dashicons-hidden',
			99
		);
	}

	public function render_admin_page() {
		echo '<div id="rest-api-firewall-admin-page"></div>';
	}

	public function enqueue_scripts( $hook ) {
		if ( 'toplevel_page_rest-api-firewall-admin' !== $hook ) {
			return;
		}

		$mui_config       = $this->load_script_config( REST_API_FIREWALL_DIR . '/build/mui.asset.php' );
		$mui_dependencies = ! empty( $mui_config ) && isset( $mui_config['dependencies'] ) ? $mui_config['dependencies'] : array();
		wp_enqueue_script(
			'rest-api-firewall-mui',
			REST_API_FIREWALL_URL . '/build/mui.js',
			$mui_dependencies,
			$mui_config['version'],
			true
		);

		$script_config = $this->load_script_config( REST_API_FIREWALL_DIR . '/build/index.asset.php' );
		$dependencies  = ! empty( $script_config ) && isset( $script_config['dependencies'] ) ? $script_config['dependencies'] : array();
		wp_enqueue_script(
			'rest-api-firewall-admin',
			REST_API_FIREWALL_URL . '/build/index.js',
			array_merge(
				$dependencies,
				array( 'rest-api-firewall-mui' )
			),
			$script_config['version'],
			true
		);

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_data = get_plugin_data( REST_API_FIREWALL_FILE );
		$args        = array(
			'nonce'                   => wp_create_nonce( 'rest_api_firewall_update_options_nonce' ),
			'ajaxurl'                 => admin_url( 'admin-ajax.php' ),
			'users'                   => Utils::list_users(),
			'post_types'              => Utils::list_post_types(),
			'post_types_schemas'      => SchemaRepo::post_schemas(),
			'taxonomies_schemas'      => SchemaRepo::taxonomy_schemas(),
			'post_properties_filters' => SchemaRepo::properties_filters(),
			'admin_options'           => CoreOptions::read_options(),
			'plugin_name'             => sanitize_text_field( $plugin_data['Name'] ),
			'plugin_version'          => sanitize_text_field( REST_API_FIREWALL_VERSION ),
			'plugin_uri'              => sanitize_url( $plugin_data['PluginURI'] ),
			'home_url'                => get_home_url( '/' ),
		);

		if ( class_exists( '\cmk\RestApiFirewall\Theme\RedirectTemplates' ) ) {
			$args['redirect_preset_url_options'] = \cmk\RestApiFirewall\Theme\RedirectTemplates::redirect_preset_url_options();
		}

		wp_localize_script(
			'rest-api-firewall-admin',
			'restApiFirewallAdminData',
			$args
		);
	}

	public function print_inline_styles() {
		$hook = get_current_screen();
		if ( 'toplevel_page_rest-api-firewall-admin' !== $hook->id ) {
			return;
		}
		$custom_css = '
		body.toplevel_page_rest-api-firewall-admin #wpcontent {
			padding-left:0;
		}
		#rest-api-firewall-admin-page input[type=color], 
		#rest-api-firewall-admin-page input[type=date], 
		#rest-api-firewall-admin-page input[type=datetime-local], 
		#rest-api-firewall-admin-page input[type=datetime], 
		#rest-api-firewall-admin-page input[type=email], 
		#rest-api-firewall-admin-page input[type=month], 
		#rest-api-firewall-admin-page input[type=number], 
		#rest-api-firewall-admin-page input[type=password], 
		#rest-api-firewall-admin-page input[type=search], 
		#rest-api-firewall-admin-page input[type=tel], 
		#rest-api-firewall-admin-page input[type=text], 
		#rest-api-firewall-admin-page input[type=time], 
		#rest-api-firewall-admin-page input[type=url], 
		#rest-api-firewall-admin-page input[type=week] {
			box-shadow: unset;
			border-radius: 4px;
			border: 0;
			background-color: none;
			color: currentColor;
			padding: 16.5px 14px;
			line-height: normal;
			min-height: auto;
			height: 1.4375em;
		}
		#rest-api-firewall-admin-page input[type=checkbox]:disabled {
			opacity:0;
		}
		';
		echo '<style type="text/css">' . esc_html( $custom_css ) . '</style>';
	}

	private static function load_script_config( $file_path ): array {
		$config = array();
		if ( FileUtils::is_readable( $file_path ) ) {
			$raw_config             = include realpath( $file_path );
			$config['dependencies'] = isset( $raw_config['dependencies'] ) ? array_map( 'sanitize_key', $raw_config['dependencies'] ) : array();
			$config['version']      = isset( $raw_config['version'] ) ? sanitize_text_field( $raw_config['version'] ) : '1.0.0';
		}
		return $config;
	}
}

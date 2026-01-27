<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\AdminPage;
use cmk\RestApiFirewall\Rest\Routes\Routes;
use cmk\RestApiFirewall\Rest\Routes\RoutesRepository;
use cmk\RestApiFirewall\Rest\Firewall\FirewallOptions;
use cmk\RestApiFirewall\Rest\Firewall\TestPolicy;
use cmk\RestApiFirewall\Rest\Firewall\IpFilter;
use cmk\RestApiFirewall\Application\WebhookService;

final class Bootstrap {

	private static ?self $instance = null;

	public static function init(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {

		CoreOptions::get_instance();

		Acf::get_instance();
		if ( is_admin() ) {
			AdminPage::get_instance();
		}
		Routes::register();
		RoutesRepository::get_instance();
		FirewallOptions::get_instance();
		TestPolicy::get_instance();
		IpFilter::get_instance();

		add_filter( 'rest_pre_dispatch', array( $this, 'check_ip_filter' ), 5, 3 );

		WebhookService::get_instance();

		DeployTheme::get_instance();

		//PostContent::get_instance();
		//ImageFiles::get_instance();
		//RedirectTemplates::get_instance();
		//CustomPosts::get_instance();
		//DisableComments::get_instance()

	}

	/**
	 * Check IP filter before dispatching REST request.
	 *
	 * @param mixed            $result  Response to replace the requested version with.
	 * @param \WP_REST_Server  $server  Server instance.
	 * @param \WP_REST_Request $request Request used to generate the response.
	 * @return mixed|\WP_Error
	 */
	public function check_ip_filter( $result, $server, $request ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$ip_check = IpFilter::check_request();

		if ( is_wp_error( $ip_check ) ) {
			return $ip_check;
		}

		return $result;
	}


	public static function activate(): void {
		$role = get_role( 'administrator' );
		if ( ! $role ) {
			return;
		}

		$caps = [ 'rest_api_firewall_edit_options' ];

		foreach ( $caps as $cap ) {
			$role->add_cap( $cap );
		}

		if ( false === get_option( 'rest_api_firewall_options' ) ) {
			update_option( 'rest_api_firewall_options', array(
				'version' => REST_API_FIREWALL_VERSION,
			), false );
		}

		flush_rewrite_rules();
	}

	public static function deactivate(): void {
		$role = get_role( 'administrator' );
		if ( ! $role ) {
			return;
		}

		$caps = [ 'rest_api_firewall_edit_options' ];

		foreach ( $caps as $cap ) {
			$role->remove_cap( $cap );
		}

		delete_transient( 'rest_api_firewall_routes_list' );

		flush_rewrite_rules();
	}


	public static function uninstall(): void {
		if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
			return;
		}

		$caps  = [ 'rest_api_firewall_edit_options', 'rest_firewall_api_access' ];
		$roles = wp_roles()->roles;

		foreach ( array_keys( $roles ) as $role_name ) {
			$role = get_role( $role_name );
			if ( $role ) {
				foreach ( $caps as $cap ) {
					$role->remove_cap( $cap );
				}
			}
		}

		delete_option( 'rest_api_firewall_options' );
		delete_option( 'blank_firewall_options' );
		delete_option( 'blank_ip_filter' );

		delete_transient( 'rest_api_firewall_routes_list' );
		delete_transient( 'blank_rest_routes_list' );

		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE %s",
				'blank_test_app_pass_%'
			)
		);
	}

}

<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\AdminPage;
use cmk\RestApiFirewall\Admin\Documentation;
use cmk\RestApiFirewall\Routes\Routes;
use cmk\RestApiFirewall\Firewall\FirewallOptions;
use cmk\RestApiFirewall\Firewall\IpBlackList;
use cmk\RestApiFirewall\Policy\PolicyRepository;
use cmk\RestApiFirewall\Policy\TestPolicy;
use cmk\RestApiFirewall\Webhook\WebhookService;
use cmk\RestApiFirewall\Webhook\WebhookAutoTrigger;

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
		FirewallOptions::get_instance();
		IpBlackList::get_instance();
		Routes::register();
		PolicyRepository::get_instance();
		WebhookService::get_instance();
		WebhookAutoTrigger::get_instance();

		if ( is_admin() ) {
			CoreOptionsService::get_instance();
			AdminPage::get_instance();
			Documentation::get_instance();
			TestPolicy::get_instance();
			DeployTheme::get_instance();
		}
	}

	public static function activate(): void {
		$role = get_role( 'administrator' );
		if ( ! $role ) {
			return;
		}

		$caps = array( 'rest_api_firewall_edit_options' );

		foreach ( $caps as $cap ) {
			$role->add_cap( $cap );
		}

		if ( false === get_option( 'rest_api_firewall_options' ) ) {
			update_option(
				'rest_api_firewall_options',
				array(
					'version' => REST_API_FIREWALL_VERSION,
				),
				false
			);
		}

		flush_rewrite_rules();
	}

	public static function deactivate(): void {
		$role = get_role( 'administrator' );
		if ( ! $role ) {
			return;
		}

		$caps = array( 'rest_api_firewall_edit_options' );

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

		$caps  = array( 'rest_api_firewall_edit_options', 'rest_firewall_api_access' );
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
		delete_transient( 'rest_api_firewall_routes_list' );

		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE %s",
				'blank_test_app_pass_%'
			)
		);
	}
}

<?php
/**
 * REST API Firewall Uninstall
 *
 * Fired when the plugin is uninstalled.
 *
 * @package REST API Firewall
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
}

if ( class_exists( 'cmk\\RestApiFirewall\\Core\\Bootstrap' ) ) {
	cmk\RestApiFirewall\Core\Bootstrap::uninstall();
}

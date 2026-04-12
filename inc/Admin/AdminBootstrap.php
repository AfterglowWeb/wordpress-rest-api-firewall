<?php namespace cmk\RestApiFirewall\Admin;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptionsService;
use cmk\RestApiFirewall\Core\DeployTheme;
use cmk\RestApiFirewall\Core\ObjectTypeSourceTracker;
use cmk\RestApiFirewall\Policy\TestPolicy;

final class AdminBootstrap {

	private static ?self $instance = null;

	public static function init(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {
		ObjectTypeSourceTracker::init();
		CoreOptionsService::get_instance();
		AdminPage::get_instance();
		Documentation::get_instance();
		TestPolicy::get_instance();
		DeployTheme::get_instance();
		ProFallbackNotice::get_instance();
	}
}
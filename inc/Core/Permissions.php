<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use WP_User;

class Permissions {

	const PRO_NONCE_ACTION = 'rest_api_firewall_update_pro_options_nonce';

	public static function ajax_validate_has_firewall_admin_caps(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified below via wp_verify_nonce
		$nonce = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';

		$valid = wp_verify_nonce( $nonce, 'rest_api_firewall_update_options_nonce' );

		if ( ! $valid && self::is_pro_active() ) {
			$valid = wp_verify_nonce( $nonce, self::PRO_NONCE_ACTION );
		}

		return (bool) $valid
			&& is_user_logged_in()
			&& current_user_can( 'rest_api_firewall_edit_options' );
	}

	private static function is_pro_active(): bool {
		if ( ! class_exists( '\cmk\RestApiFirewallPro\Core\License' ) ) {
			return false;
		}
		return \cmk\RestApiFirewallPro\Core\License::is_pro_licensed();
	}

	public static function ajax_validate_has_webhook_caps(): bool {
		return check_ajax_referer( 'rest_api_firewall_webhook_nonce', 'nonce' )
			&& is_user_logged_in()
			&& self::has_webhook_capabilities();
	}

	public static function webhook_capabilities(): array {
		return array_map(
			'sanitize_key',
			apply_filters(
				'rest_firewall_webhook_capabilities',
				array( 'delete_others_posts' )
			)
		);
	}

	public static function has_webhook_capabilities(): bool {

		if ( ! is_user_logged_in() ) {
			return false;
		}

		$user = wp_get_current_user();

		if ( false === $user instanceof WP_User ) {
			return false;
		}

		$capabilities          = self::webhook_capabilities();
		$filtered_capabilities = array_filter(
			$capabilities,
			function ( $capability ) use ( $user ) {
				return $user->has_cap( $capability );
			}
		);

		return 0 < count( $filtered_capabilities );
	}
}

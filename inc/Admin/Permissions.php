<?php namespace cmk\RestApiFirewall\Admin;

defined( 'ABSPATH' ) || exit;

class Permissions {

	public static function ajax_has_firewall_update_caps(): bool {
		return check_ajax_referer( 'rest_api_firewall_update_options_nonce', 'nonce' )
			&& is_user_logged_in()
			&& current_user_can( 'rest_api_firewall_edit_options' );
	}

	public static function validate_ajax_crud_webhook(): bool {
		return check_ajax_referer( 'rest_api_firewall_webhook_nonce', 'nonce' )
			&& is_user_logged_in()
			&& self::has_webhook_capabilities();
	}

	public static function webhook_capabilities(): array {
		return array_map(
			'sanitize_key',
			apply_filters(
				'rest_firewall_webhook_capabilities',
				array( 'manage_options', 'rest_api_firewall_edit_options' )
			)
		);
	}

	public static function has_webhook_capabilities(): bool {

		if ( ! is_user_logged_in() ) {
			return false;
		}

		$user = wp_get_current_user();

		if ( false === $user instanceof \WP_User ) {
			return false;
		}

		$capabilities          = self::webhook_capabilities();
		$filtered_capabilities = array_filter(
			$capabilities,
			function ( $capability ) use ( $user ) {
				return $user->user_has_cap( $capability );
			}
		);

		return 0 < count( $filtered_capabilities );
	}
}

<?php namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Firewall\FirewallOptions;
use WP_Error;
use WP_User;

class WordpressAuth {

	public static function sync_rest_api_user( int $new_user_id, int $old_user_id = 0 ): void {
		if (
			! empty( $old_user_id )
			&& absint( $old_user_id ) !== absint( $new_user_id )
		) {
			self::remove_cap_from_user( absint( $old_user_id ) );
		}

		if ( empty( $new_user_id ) ) {
			return;
		}

		$user = get_user_by( 'id', absint( $new_user_id ) );
		if ( false === $user instanceof WP_User ) {
			return;
		}

		$user->add_cap( 'rest_firewall_api_access' );
	}

	private static function remove_cap_from_user( int $user_id ): void {
		$user = get_user_by( 'id', $user_id );
		if ( $user instanceof WP_User ) {
			$user->remove_cap( 'rest_firewall_api_access' );
		}
	}

	public static function validate_wp_application_password(): bool {
		$user = wp_get_current_user();

		if ( ! $user || ! $user->exists() ) {
			return false;
		}

		return $user->has_cap( 'rest_firewall_api_access' );
	}


}

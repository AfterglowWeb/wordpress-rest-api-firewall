<?php namespace cmk\RestApiFirewall\Security;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Permissions;

/**
 * Admin AJAX endpoints for listing and releasing login rate-limit blocks.
 *
 * AJAX actions (wp_ajax_*):
 *   - rest_api_firewall_get_login_blocks    → list active block transients
 *   - rest_api_firewall_release_login_block → delete a block transient by IP
 *
 * Inbound webhook support:
 *   Listens to the rest_api_firewall_inbound_webhook_received action (already
 *   HMAC-authenticated by InboundWebhookReceiver) to allow remote block release
 *   even when the admin's own IP is blocked.
 *   Expected payload: { "action": "release_login_block", "ip": "1.2.3.4" }
 */
class LoginBlockService {

	protected static ?self $instance = null;

	public static function get_instance(): self {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_rest_api_firewall_get_login_blocks', array( $this, 'ajax_get_login_blocks' ) );
		add_action( 'wp_ajax_rest_api_firewall_release_login_block', array( $this, 'ajax_release_login_block' ) );
		add_action( 'rest_api_firewall_inbound_webhook_received', array( $this, 'on_inbound_webhook' ) );
	}

	// -------------------------------------------------------------------------
	// AJAX handlers
	// -------------------------------------------------------------------------

	public function ajax_get_login_blocks(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		wp_send_json_success( array( 'blocks' => $this->get_active_blocks() ) );
	}

	public function ajax_release_login_block(): void {
		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		$ip = isset( $_POST['ip'] ) ? sanitize_text_field( wp_unslash( $_POST['ip'] ) ) : '';

		if ( '' === $ip || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			wp_send_json_error( array( 'message' => 'Invalid IP address' ), 422 );
		}

		delete_transient( LoginRateLimiter::BLOCK_PREFIX . LoginRateLimiter::ip_hash( $ip ) );

		wp_send_json_success(
			array(
				'message' => 'Block released',
				'ip'      => $ip,
			)
		);
	}

	// -------------------------------------------------------------------------
	// Inbound webhook
	// -------------------------------------------------------------------------

	/**
	 * Handle { "action": "release_login_block", "ip": "…" } payloads.
	 * The payload has already been HMAC-verified by InboundWebhookReceiver.
	 *
	 * @param array<string, mixed> $payload Decoded webhook JSON body.
	 */
	public function on_inbound_webhook( array $payload ): void {
		if ( ( $payload['action'] ?? '' ) !== 'release_login_block' ) {
			return;
		}

		$ip = $payload['ip'] ?? '';
		if ( '' === $ip || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return;
		}

		delete_transient( LoginRateLimiter::BLOCK_PREFIX . LoginRateLimiter::ip_hash( $ip ) );
	}

	// -------------------------------------------------------------------------
	// Private helpers
	// -------------------------------------------------------------------------

	/**
	 * Query all active login-block transients.
	 *
	 * LoginRateLimiter stores the raw IP as the transient value (not '1'), which
	 * allows this listing without a separate IP → hash index.
	 * Legacy entries written with value '1' are skipped silently.
	 *
	 * @return array<array{ip: string, remaining: int}>
	 */
	private function get_active_blocks(): array {
		global $wpdb;

		$transient_prefix = '_transient_' . LoginRateLimiter::BLOCK_PREFIX;
		$timeout_prefix   = '_transient_timeout_' . LoginRateLimiter::BLOCK_PREFIX;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
				$wpdb->esc_like( $transient_prefix ) . '%'
			),
			ARRAY_A
		);

		if ( ! is_array( $rows ) || empty( $rows ) ) {
			return array();
		}

		$blocks = array();

		foreach ( $rows as $row ) {
			$hash = substr( $row['option_name'], strlen( $transient_prefix ) );
			$ip   = $row['option_value'];

			// Skip legacy entries that stored '1' instead of the IP.
			if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
				continue;
			}

			$timeout   = (int) get_option( $timeout_prefix . $hash, 0 );
			$remaining = $timeout > 0 ? max( 0, $timeout - time() ) : 0;

			$blocks[] = array(
				'ip'        => $ip,
				'remaining' => $remaining,
			);
		}

		// Sort by most time remaining first.
		usort( $blocks, static fn( $a, $b ) => $b['remaining'] <=> $a['remaining'] );

		return $blocks;
	}
}

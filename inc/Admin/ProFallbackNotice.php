<?php
namespace cmk\RestApiFirewall\Admin;

defined( 'ABSPATH' ) || exit;

class ProFallbackNotice {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'admin_notices', array( $this, 'show_fallback_notice' ) );
		add_action( 'wp_ajax_rest_api_firewall_get_pro_applications', array( $this, 'ajax_get_applications' ) );
		add_action( 'wp_ajax_rest_api_firewall_export_pro_to_free', array( $this, 'ajax_export_to_free' ) );
		add_action( 'wp_ajax_rest_api_firewall_dismiss_pro_fallback', array( $this, 'ajax_dismiss_fallback' ) );
	}

	public function show_fallback_notice(): void {
		if ( ! $this->should_show_notice() ) {
			return;
		}

		?>
		<div id="rest-api-firewall-pro-fallback-notice" class="notice notice-warning is-dismissible" style="position: relative;">
			<p>
				<strong><?php esc_html_e( 'REST API Toolkit Pro Deactivated', 'rest-api-firewall' ); ?></strong>
			</p>
			<p>
				<?php
				esc_html_e(
					'Your Pro applications are no longer active. Would you like to export one application to free tier settings?',
					'rest-api-firewall'
				);
				?>
			</p>
			<p>
				<select id="raf-pro-app-select" style="max-width: 300px;">
					<option value=""><?php esc_html_e( 'Select an application...', 'rest-api-firewall' ); ?></option>
				</select>
				<button id="raf-export-to-free-btn" class="button button-primary" disabled style="margin-left: 10px;">
					<?php esc_html_e( 'Export to Free Tier', 'rest-api-firewall' ); ?>
				</button>
				<button id="raf-dismiss-fallback-btn" class="button button-secondary" style="margin-left: 10px;">
					<?php esc_html_e( 'Dismiss', 'rest-api-firewall' ); ?>
				</button>
			</p>
			<div id="raf-fallback-result" style="margin-top: 10px;"></div>
		</div>

		<script>
		(function($) {
			const $notice = $('#rest-api-firewall-pro-fallback-notice');
			const $select = $('#raf-pro-app-select');
			const $exportBtn = $('#raf-export-to-free-btn');
			const $dismissBtn = $('#raf-dismiss-fallback-btn');
			const $result = $('#raf-fallback-result');

			$.post(ajaxurl, {
				action: 'rest_api_firewall_get_pro_applications',
				nonce: '<?php echo esc_js( wp_create_nonce( 'rest_api_firewall_pro_fallback' ) ); ?>'
			}, function(response) {
				if (response.success && response.data.applications) {
					response.data.applications.forEach(app => {
						$select.append($('<option>', {
							value: app.id,
							text: app.title
						}));
					});
				}
			});

			$select.on('change', function() {
				$exportBtn.prop('disabled', !$(this).val());
			});

			$exportBtn.on('click', function() {
				const appId = $select.val();
				if (!appId) return;

				$exportBtn.prop('disabled', true).text('<?php esc_html_e( 'Exporting...', 'rest-api-firewall' ); ?>');

				$.post(ajaxurl, {
					action: 'rest_api_firewall_export_pro_to_free',
					nonce: '<?php echo esc_js( wp_create_nonce( 'rest_api_firewall_pro_fallback' ) ); ?>',
					application_id: appId
				}, function(response) {
					if (response.success) {
						$result.html('<div class="notice notice-success inline"><p>' + response.data.message + '</p></div>');
						setTimeout(() => {
							$notice.fadeOut(300, () => $notice.remove());
							location.reload();
						}, 2000);
					} else {
						$result.html('<div class="notice notice-error inline"><p>' + (response.data?.message || '<?php esc_html_e( 'Export failed.', 'rest-api-firewall' ); ?>') + '</p></div>');
						$exportBtn.prop('disabled', false).text('<?php esc_html_e( 'Export to Free Tier', 'rest-api-firewall' ); ?>');
					}
				}).fail(function() {
					$result.html('<div class="notice notice-error inline"><p><?php esc_html_e( 'An error occurred.', 'rest-api-firewall' ); ?></p></div>');
					$exportBtn.prop('disabled', false).text('<?php esc_html_e( 'Export to Free Tier', 'rest-api-firewall' ); ?>');
				});
			});

			$dismissBtn.on('click', function() {
				$.post(ajaxurl, {
					action: 'rest_api_firewall_dismiss_pro_fallback',
					nonce: '<?php echo esc_js( wp_create_nonce( 'rest_api_firewall_pro_fallback' ) ); ?>'
				}, function() {
					$notice.fadeOut(300, () => $notice.remove());
				});
			});

			$notice.on('click', '.notice-dismiss', function() {
				$.post(ajaxurl, {
					action: 'rest_api_firewall_dismiss_pro_fallback',
					nonce: '<?php echo esc_js( wp_create_nonce( 'rest_api_firewall_pro_fallback' ) ); ?>'
				});
			});
		})(jQuery);
		</script>
		<?php
	}

	private function should_show_notice(): bool {
		if ( ! current_user_can( 'rest_api_firewall_edit_options' ) ) {
			return false;
		}

		if ( ! is_admin() ) {
			return false;
		}

		$transient = get_transient( 'rest_api_firewall_pro_fallback_prompt' );
		if ( ! $transient ) {
			return false;
		}

		if ( class_exists( '\cmk\RestApiFirewallPro\Core\License' ) ) {
			return false;
		}

		return true;
	}


	public function ajax_get_applications(): void {
		check_ajax_referer( 'rest_api_firewall_pro_fallback', 'nonce' );

		if ( ! current_user_can( 'rest_api_firewall_edit_options' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		$applications = array();
		if ( class_exists( '\cmk\RestApiFirewallPro\Migration\ProToFreeFallbackService' ) ) {
			$applications = \cmk\RestApiFirewallPro\Migration\ProToFreeFallbackService::get_available_applications();
		}

		wp_send_json_success( array( 'applications' => $applications ) );
	}

	public function ajax_export_to_free(): void {
		check_ajax_referer( 'rest_api_firewall_pro_fallback', 'nonce' );

		if ( ! current_user_can( 'rest_api_firewall_edit_options' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		$application_id = isset( $_POST['application_id'] ) ? sanitize_text_field( wp_unslash( $_POST['application_id'] ) ) : '';

		if ( empty( $application_id ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Application ID is required.', 'rest-api-firewall' ) ), 400 );
		}

		if ( class_exists( '\cmk\RestApiFirewallPro\Migration\ProToFreeFallbackService' ) ) {
			$result = \cmk\RestApiFirewallPro\Migration\ProToFreeFallbackService::export_to_free_tier( $application_id );

			if ( $result['success'] ) {
				wp_send_json_success( $result );
			} else {
				wp_send_json_error( $result, 422 );
			}
		} else {
			wp_send_json_error( array( 'message' => esc_html__( 'Pro plugin not found.', 'rest-api-firewall' ) ), 404 );
		}
	}

	public function ajax_dismiss_fallback(): void {
		check_ajax_referer( 'rest_api_firewall_pro_fallback', 'nonce' );

		if ( ! current_user_can( 'rest_api_firewall_edit_options' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		if ( class_exists( '\cmk\RestApiFirewallPro\Migration\ProToFreeFallbackService' ) ) {
			\cmk\RestApiFirewallPro\Migration\ProToFreeFallbackService::dismiss_prompt();
		} else {
			delete_transient( 'rest_api_firewall_pro_fallback_prompt' );
		}

		wp_send_json_success( array( 'message' => esc_html__( 'Notice dismissed.', 'rest-api-firewall' ) ) );
	}
}

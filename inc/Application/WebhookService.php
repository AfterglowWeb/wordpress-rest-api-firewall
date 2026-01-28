<?php namespace cmk\RestApiFirewall\Application;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Admin\Permissions;
use cmk\RestApiFirewall\Core\CoreOptions;

class WebhookService {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_ajax_trigger_application_webhook', array( $this, 'ajax_trigger_application_webhook' ) );
		add_action( 'wp_ajax_has_application_webhook_secret', array( $this, 'ajax_has_application_webhook_secret' ) );
		add_action( 'wp_ajax_update_application_webhook_secret', array( $this, 'ajax_update_application_webhook_secret' ) );
		add_action( 'wp_ajax_delete_application_webhook_secret', array( $this, 'ajax_delete_application_webhook_secret' ) );
		add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_button' ), 100 );
	}

	public function ajax_trigger_application_webhook(): void {

		if ( false === Permissions::validate_ajax_crud_webhook() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$payload = (array) apply_filters(
			'rest_firewall_application_webhook_body_payload',
			array( 'action' => 'flush_cache' )
		);

		$sanitized_payload = array();
		foreach ( $payload as $key => $value ) {
			$sanitized_payload[ sanitize_key( $key ) ] = sanitize_text_field( $value );
		}

		$admin_options = CoreOptions::read_options();

		try {
			$response = WebhookClient::post(
				$admin_options['application_webhook_endpoint'],
				$sanitized_payload
			);
		} catch ( \WP_Error $error ) {
			wp_send_json_error( $error );
		}

		wp_send_json_success( $response );
	}

	public function ajax_has_application_webhook_secret(): void {

		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$has_secret = (bool) get_option( 'rest_api_firewall_application_webhook_secret' );

		wp_send_json_success(
			array(
				'has_secret' => $has_secret,
			),
			200
		);
	}

	public function ajax_update_application_webhook_secret(): void {

		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$secret = wp_generate_password( 64, true );
		update_option( 'rest_api_firewall_application_webhook_secret', $secret );

		wp_send_json_success(
			array(
				'secret'  => $secret,
				'message' => esc_html__(
					'Copy this secret now. You will not be able to view it again.',
					'rest-api-firewall'
				),
			),
			200
		);
	}

	public function ajax_delete_application_webhook_secret(): void {

		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$webhook = get_option( 'rest_api_firewall_application_webhook_secret' );

		if ( ! empty( $webhook ) ) {

				update_option( 'rest_api_firewall_application_webhook_secret', false );

				wp_send_json_success(
					array(
						'message' => esc_html__( 'Webhook secret deleted.', 'rest-api-firewall' ),
					),
					200
				);
		} else {
			wp_send_json_success(
				array(
					'message' => esc_html__( 'Webhook secret does not exists.', 'rest-api-firewall' ),
				),
				200
			);
		}

		wp_send_json_error(
			array(
				'error' => esc_html__( 'An error occured while deleting Webhook secret.', 'rest-api-firewall' ),
			),
			200
		);
	}

	public function enqueue_scripts(): void {

		if ( ! current_user_can( 'rest_api_firewall_edit_options' ) ) {
			return;
		}

		wp_enqueue_script(
			'rest-api-firewall-webhook',
			REST_API_FIREWALL_URL . '/assets/js/webhook.js',
			array( 'jquery-core' ),
			REST_API_FIREWALL_VERSION,
			array( 'in_footer' => true )
		);

		wp_localize_script(
			'rest-api-firewall-webhook',
			'restApiFirewallWebhookService',
			array(
				'nonce'          => wp_create_nonce( 'rest_api_firewall_webhook_nonce' ),
				'ajaxurl'        => admin_url( 'admin-ajax.php' ),
				'confirmMessage' => esc_html__( 'Trigger Webhook?', 'rest-api-firewall' ),
			)
		);
	}

	public function add_admin_bar_button( $admin_bar ): void {
		$admin_bar->add_node(
			array(
				'id'    => 'rest-api-firewall-trigger-webhook',
				'title' => esc_html__( 'Trigger Webhook', 'rest-api-firewall' ),
				'href'  => '#',
				'meta'  => array(
					'title'   => esc_html__( 'Trigger Webhook', 'rest-api-firewall' ),
					'onclick' => 'restApiFirewallTriggerWebhook(); return false;',
				),
			)
		);
	}
}

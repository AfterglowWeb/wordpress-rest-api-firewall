<?php namespace cmk\RestApiFirewall\Webhook;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\Permissions;
use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Webhook\WebhookClient;

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
		add_action( 'wp_ajax_test_webhook_event', array( $this, 'ajax_test_webhook_event' ) );
		add_action( 'wp_ajax_has_application_webhook_secret', array( $this, 'ajax_has_application_webhook_secret' ) );
		add_action( 'wp_ajax_update_application_webhook_secret', array( $this, 'ajax_update_application_webhook_secret' ) );
		add_action( 'wp_ajax_update_application_webhook_custom_secret', array( $this, 'ajax_update_application_webhook_custom_secret' ) );
		add_action( 'wp_ajax_delete_application_webhook_secret', array( $this, 'ajax_delete_application_webhook_secret' ) );
		add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_button' ), 100 );
	}

	private static function webhook_entry_config(): array {
		return array(
			'id'              => array(
				'type'    => 'string',
				'default' => null,
			),
			'label'           => array(
				'type'    => 'string',
				'default' => 'Primary Webhook',
			),
			'endpoint'        => array(
				'type'     => 'string',
				'required' => true,
				'default'  => '',
			),
			'method'          => array(
				'type'    => 'string',
				'default' => 'POST',
				'allowed' => array( 'POST', 'GET' ),
			),
			'headers'         => array(
				'type'    => 'array',
				'default' => array(),
			),
			'enabled'         => array(
				'type'    => 'boolean',
				'default' => true,
			),
			'timeout_seconds' => array(
				'type'    => 'integer',
				'default' => 10,
			),
			'retry_count'     => array(
				'type'    => 'integer',
				'default' => 0,
			),
			'body_payload'    => array(
				'type'    => 'string',
				'default' => '',
			),
			'type'            => array(
				'type'    => 'string',
				'default' => 'custom',
				'allowed' => array( 'custom', 'slack', 'discord', 'n8n', 'zapier', 'make', 'teams', 'general', 'notification', 'automation', 'data_sync', 'alert' ),
			),
			'created_at'      => array(
				'type'    => 'string',
				'default' => null,
			),
			'updated_at'      => array(
				'type'    => 'string',
				'default' => null,
			),
		);
	}

	private static function automation_entry_config(): array {
		return array(
			'id'          => array(
				'type'    => 'string',
				'default' => null,
			),
			'event'       => array(
				'type'     => 'string',
				'required' => true,
				'default'  => '',
			),
			'conditions'  => array(
				'type'    => 'array',
				'default' => array(),
			),
			'payload_map' => array(
				'type'    => 'array',
				'default' => array(),
			),
			'enabled'     => array(
				'type'    => 'boolean',
				'default' => true,
			),
			'webhook_ids' => array(
				'type'    => 'array',
				'default' => array(),
			),
			'created_at'  => array(
				'type'    => 'string',
				'default' => null,
			),
			'updated_at'  => array(
				'type'    => 'string',
				'default' => null,
			),
		);
	}

	private static function sanitize_field( $value, array $field_config ) {
		$type = $field_config['type'] ?? 'string';

		switch ( $type ) {
			case 'boolean':
				return (bool) $value;

			case 'integer':
				return absint( $value );

			case 'array':
				return is_array( $value ) ? $value : array();

			case 'string':
			default:
				if ( isset( $field_config['allowed'] ) && is_array( $field_config['allowed'] ) ) {
					return in_array( $value, $field_config['allowed'], true ) ? $value : $field_config['default'];
				}
				return sanitize_text_field( (string) $value );
		}
	}

	public static function sanitize_webhook_entry( array $entry ): array {
		$config    = self::webhook_entry_config();
		$sanitized = array();

		foreach ( $config as $key => $field_config ) {
			if ( isset( $entry[ $key ] ) ) {
				$sanitized[ $key ] = self::sanitize_field( $entry[ $key ], $field_config );
			} else {
				$sanitized[ $key ] = $field_config['default'] ?? null;
			}
		}

		if ( empty( $sanitized['id'] ) ) {
			$sanitized['id'] = wp_generate_uuid4();
		}

		$now = current_time( 'c' );
		if ( empty( $sanitized['created_at'] ) ) {
			$sanitized['created_at'] = $now;
		}
		$sanitized['updated_at'] = $now;

		return $sanitized;
	}

	public static function sanitize_automation_entry( array $entry ): array {
		$config    = self::automation_entry_config();
		$sanitized = array();

		foreach ( $config as $key => $field_config ) {
			if ( isset( $entry[ $key ] ) ) {
				$sanitized[ $key ] = self::sanitize_field( $entry[ $key ], $field_config );
			} else {
				$sanitized[ $key ] = $field_config['default'] ?? null;
			}
		}

		if ( empty( $sanitized['id'] ) ) {
			$sanitized['id'] = wp_generate_uuid4();
		}

		$now = current_time( 'c' );
		if ( empty( $sanitized['created_at'] ) ) {
			$sanitized['created_at'] = $now;
		}
		$sanitized['updated_at'] = $now;

		return $sanitized;
	}

	public static function migrate_legacy_webhook_data(): array {
		$new_structure = array(
			'webhooks'    => array(),
			'automations' => array(),
		);

		$endpoint       = CoreOptions::read_option( 'application_webhook_endpoint' );
		$enabled_events = CoreOptions::read_option( 'application_webhook_auto_trigger_events' );

		if ( empty( $endpoint ) && empty( $enabled_events ) ) {
			return $new_structure;
		}

		$webhook_id                  = wp_generate_uuid4();
		$new_structure['webhooks'][] = self::sanitize_webhook_entry(
			array(
				'id'       => $webhook_id,
				'label'    => __( 'Primary Webhook', 'rest-api-firewall' ),
				'endpoint' => ! empty( $endpoint ) ? $endpoint : '',
				'enabled'  => ! empty( $endpoint ),
			)
		);

		if ( is_array( $enabled_events ) ) {
			foreach ( $enabled_events as $event_key ) {
				$new_structure['automations'][] = self::sanitize_automation_entry(
					array(
						'event'       => sanitize_key( $event_key ),
						'enabled'     => true,
						'webhook_ids' => array( $webhook_id ),
					)
				);
			}
		}

		return $new_structure;
	}

	public static function get_webhooks(): array {
		$data = get_option( 'rest_api_firewall_webhooks', null );

		if ( null === $data ) {
			$data = self::migrate_legacy_webhook_data();
			update_option( 'rest_api_firewall_webhooks', $data );
		}

		if ( ! is_array( $data ) ) {
			$data = array(
				'webhooks'    => array(),
				'automations' => array(),
			);
		}

		return $data;
	}

	public static function get_primary_webhook(): ?array {
		$data = self::get_webhooks();
		return ! empty( $data['webhooks'] ) ? $data['webhooks'][0] : null;
	}

	public static function get_webhook_by_id( string $id ): ?array {
		$data = self::get_webhooks();

		foreach ( $data['webhooks'] as $webhook ) {
			if ( isset( $webhook['id'] ) && $webhook['id'] === $id ) {
				return $webhook;
			}
		}

		return null;
	}

	public static function update_webhook( string $id, array $updates ): ?array {
		$data  = self::get_webhooks();
		$found = false;

		foreach ( $data['webhooks'] as $index => $webhook ) {
			if ( isset( $webhook['id'] ) && $webhook['id'] === $id ) {
				$merged                     = array_merge( $webhook, $updates );
				$merged['id']               = $id;
				$merged['created_at']       = $webhook['created_at'];
				$data['webhooks'][ $index ] = self::sanitize_webhook_entry( $merged );
				$found                      = true;
				break;
			}
		}

		if ( ! $found ) {
			return null;
		}

		update_option( 'rest_api_firewall_webhooks', $data );

		return $data['webhooks'][ $index ];
	}

	public static function get_automations_for_event( string $event ): array {
		$data        = self::get_webhooks();
		$automations = array();

		foreach ( $data['automations'] as $automation ) {
			if ( isset( $automation['event'] ) && $automation['event'] === $event && ! empty( $automation['enabled'] ) ) {
				$automations[] = $automation;
			}
		}

		return $automations;
	}

	public static function get_enabled_automations(): array {
		$data        = self::get_webhooks();
		$automations = array();

		foreach ( $data['automations'] as $automation ) {
			if ( ! empty( $automation['enabled'] ) ) {
				$automations[] = $automation;
			}
		}

		return $automations;
	}

	public function ajax_trigger_application_webhook(): void {

		if ( false === Permissions::ajax_validate_has_webhook_caps() ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ),
				),
				403
			);
		}

		$payload = (array) apply_filters(
			'rest_api_firewall_webhook_payload',
			WebhookClient::build_event_payload( 'manual_trigger', array( 'group' => 'manual' ), array() )
		);

		$sanitized_payload = array();
		foreach ( $payload as $key => $value ) {
			$sanitized_payload[ sanitize_key( $key ) ] = sanitize_text_field( $value );
		}

		$webhook_endpoint = CoreOptions::read_option( 'application_webhook_endpoint' );

		if ( ! $webhook_endpoint ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'No webhook endpoint configured.', 'rest-api-firewall' ),
				),
				422
			);
		}

		try {
			$response = WebhookClient::post(
				$webhook_endpoint,
				$sanitized_payload
			);
		} catch ( \WP_Error $error ) {
			wp_send_json_error( $error );
		}

		wp_send_json_success( wp_remote_retrieve_body( $response ) );
	}

	public function ajax_test_webhook_event(): void {

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ),
				),
				403
			);
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_webhook_caps()
		$event_key = isset( $_POST['event_key'] ) ? sanitize_key( wp_unslash( $_POST['event_key'] ) ) : '';

		if ( empty( $event_key ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'No event selected.', 'rest-api-firewall' ),
				),
				422
			);
		}

		$available_events = WebhookAutoTrigger::get_available_events();

		if ( ! isset( $available_events[ $event_key ] ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Invalid event.', 'rest-api-firewall' ),
				),
				422
			);
		}

		$event_config = $available_events[ $event_key ];
		$payload      = WebhookClient::build_event_payload( $event_key, $event_config, array() );

		$payload = (array) apply_filters(
			'rest_api_firewall_webhook_payload',
			$payload
		);

		$webhook_endpoint = CoreOptions::read_option( 'application_webhook_endpoint' );

		if ( ! $webhook_endpoint ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'No webhook endpoint configured.', 'rest-api-firewall' ),
				),
				422
			);
		}

		$start_time = microtime( true );

		$response = WebhookClient::post(
			$webhook_endpoint,
			$payload,
			true,
		);

		$duration     = round( ( microtime( true ) - $start_time ) * 1000 );
		$headers_sent = $response['headers_sent'];

		if ( is_wp_error( $response['result'] ) ) {
			/**
			 * Typecast to avoid error
			 *
			 * @var \WP_Error $response
			 * */

			wp_send_json_success(
				array(
					'type'          => 'error',
					'payload'       => $payload,
					'response_code' => 403,
					'response_body' => $response['result']->get_error_message(),
					'duration'      => $duration,
					'headers_sent'  => $headers_sent,

				)
			);
			return;
		}

		/**
		 * Typecast to avoid error
		 *
		 * @var array $response
		 * */
		$response_code    = wp_remote_retrieve_response_code( $response['result'] );
		$response_body    = wp_remote_retrieve_body( $response['result'] );
		$response_headers = wp_remote_retrieve_headers( $response['result'] );
		$is_remote_error  = empty( $response_code ) || $response_code >= 400;
		$endpoint         = isset( $response['endpoint'] ) ? $response['endpoint'] : $webhook_endpoint;

		wp_send_json_success(
			array(
				'type'             => $is_remote_error ? 'error' : 'success',
				'payload'          => $payload,
				'response_code'    => $response_code,
				'response_body'    => $response_body,
				'response_headers' => $response_headers ? (array) $response_headers : array(),
				'headers_sent'     => $headers_sent,
				'duration'         => $duration,
				'endpoint'         => $endpoint,
			)
		);
	}

	public function ajax_has_application_webhook_secret(): void {

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
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

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		$secret = wp_generate_password( 64, true );
		update_option( 'rest_api_firewall_application_webhook_secret', $secret );

			CoreOptions::update_option( 'application_webhook_custom_secret_enabled', false );

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

	public function ajax_update_application_webhook_custom_secret(): void {

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		if ( ! isset( $_POST['custom_secret'] ) ) {
				wp_send_json_error(
					array(
						'message' => esc_html__( 'Missing data.', 'rest-api-firewall' ),
					),
					422
				);
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_validate_has_firewall_admin_caps()
		$secret = sanitize_text_field( wp_unslash( $_POST['custom_secret'] ) );
		if ( empty( $secret ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Missing value.', 'rest-api-firewall' ),
				),
				422
			);
		}

		update_option( 'rest_api_firewall_application_webhook_secret', $secret );

			CoreOptions::update_option( 'application_webhook_custom_secret_enabled', true );

			wp_send_json_success(
				array(
					'message' => esc_html__(
						'Your secret has been saved.',
						'rest-api-firewall'
					),
				),
				200
			);
	}

	public function ajax_delete_application_webhook_secret(): void {

		if ( false === Permissions::ajax_validate_has_firewall_admin_caps() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		$webhook = get_option( 'rest_api_firewall_application_webhook_secret' );

		if ( ! empty( $webhook ) ) {

				update_option( 'rest_api_firewall_application_webhook_secret', false );
				CoreOptions::update_option( 'application_webhook_custom_secret_enabled', false );

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

		if ( false === Permissions::has_webhook_capabilities() ) {
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

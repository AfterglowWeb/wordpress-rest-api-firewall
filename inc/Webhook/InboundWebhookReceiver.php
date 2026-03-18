<?php

namespace cmk\RestApiFirewall\Webhook;

defined( 'ABSPATH' ) || exit;

/**
 * Receives signed HTTP requests from external services and dispatches
 * the 'rest_api_firewall_inbound_webhook_received' action for Pro to handle.
 *
 * Endpoint: POST /wp-json/rest-api-firewall/v1/inbound/{token}
 */
class InboundWebhookReceiver {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_route' ) );
	}

	public function register_route(): void {
		register_rest_route(
			'rest-api-firewall/v1',
			'/inbound/(?P<token>[a-f0-9]{64})',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'receive' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'token' => array(
						'required'          => true,
						'validate_callback' => static function ( $value ) {
							return (bool) preg_match( '/^[a-f0-9]{64}$/', $value );
						},
					),
				),
			)
		);
	}

	public function receive( \WP_REST_Request $request ): \WP_REST_Response {
		$token = $request->get_param( 'token' );

		/**
		 * Allow Pro to resolve a webhook entry by token.
		 *
		 * @param array|null $webhook The webhook entry or null if not found.
		 * @param string     $token   The endpoint token.
		 */
		$webhook = apply_filters( 'rest_api_firewall_find_inbound_webhook', null, $token );

		if ( ! is_array( $webhook ) || empty( $webhook['id'] ) ) {
			return new \WP_REST_Response( array( 'error' => 'Not found' ), 404 );
		}

		$raw_body  = $request->get_body();
		$signature = $request->get_header( 'x_webhook_signature' );
		$timestamp = $request->get_header( 'x_webhook_timestamp' );
		$secret    = $webhook['secret'] ?? '';

		if ( empty( $signature ) || empty( $timestamp ) || empty( $secret ) ) {
			return new \WP_REST_Response( array( 'error' => 'Unauthorized' ), 401 );
		}

		$expected = hash_hmac( 'sha256', $raw_body . $timestamp, $secret );

		if ( ! hash_equals( $expected, $signature ) ) {
			return new \WP_REST_Response( array( 'error' => 'Unauthorized' ), 401 );
		}

		$payload = json_decode( $raw_body, true );
		if ( ! is_array( $payload ) ) {
			$payload = array( 'raw' => $raw_body );
		}

		/**
		 * Fires after a valid inbound webhook request is received.
		 * Pro automation service hooks here to trigger the linked automation.
		 *
		 * @param array $webhook The resolved webhook entry.
		 * @param array $payload The decoded JSON payload.
		 */
		do_action( 'rest_api_firewall_inbound_webhook_received', $webhook, $payload );

		return new \WP_REST_Response( array( 'received' => true ), 200 );
	}
}

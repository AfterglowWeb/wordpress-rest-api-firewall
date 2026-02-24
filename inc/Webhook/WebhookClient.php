<?php namespace cmk\RestApiFirewall\Webhook;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use WP_Error;

final class WebhookClient {

	/**
	 * Send a webhook request using a webhook entry object.
	 *
	 * @param array $webhook  The webhook entry.
	 * @param array $payload  The payload data.
	 * @param bool  $is_test  Whether this is a test request.
	 * @return array|WP_Error The response or error.
	 */
	public static function post_with_webhook( array $webhook, array $payload, bool $is_test = false ) {
		$options = CoreOptions::read_options();
		$host    = rtrim( $options['application_host'], '/' );
		$route   = ltrim( $webhook['endpoint'] ?? '', '/' );
		$secret  = get_option( 'rest_api_firewall_application_webhook_secret' );
		$timeout = isset( $webhook['timeout_seconds'] ) ? absint( $webhook['timeout_seconds'] ) : 10;
		$method  = isset( $webhook['method'] ) ? strtoupper( $webhook['method'] ) : 'POST';

		if ( ! $host || ! $secret ) {
			return new WP_Error(
				'config',
				__( 'Webhook not configured', 'rest-api-firewall' ),
			);
		}

		if ( empty( $route ) ) {
			return new WP_Error(
				'config',
				__( 'Webhook endpoint not configured', 'rest-api-firewall' ),
			);
		}

		$timestamp = time();
		$body      = ! empty( $payload ) ? wp_json_encode( $payload ) : '';

		$signature = hash_hmac(
			'sha256',
			$body . $timestamp,
			$secret
		);

		$endpoint = $host . '/' . $route;

		$headers = array(
			'Content-Type'        => 'application/json',
			'X-Webhook-Signature' => $signature,
			'X-Webhook-Timestamp' => $timestamp,
			'X-Webhook-Source'    => 'wordpress',
		);

		if ( ! empty( $webhook['headers'] ) && is_array( $webhook['headers'] ) ) {
			$headers = array_merge( $headers, $webhook['headers'] );
		}

		$args = array(
			'timeout' => $timeout,
			'headers' => $headers,
			'body'    => $body,
		);

		if ( 'GET' === $method ) {
			$result = wp_remote_get( $endpoint, $args );
		} else {
			$result = wp_remote_post( $endpoint, $args );
		}

		if ( true === $is_test ) {
			$headers_sent                        = $headers;
			$headers_sent['X-Webhook-Signature'] = 'xxx-xxx-xxx-xxx';

			return array(
				'result'       => $result,
				'endpoint'     => $endpoint,
				'headers_sent' => $headers_sent,
			);
		}

		return $result;
	}

	/**
	 * Send a webhook request (legacy method, uses CoreOptions).
	 *
	 * @param string $route    The webhook route/endpoint.
	 * @param array  $payload  The payload data.
	 * @param bool   $is_test  Whether this is a test request.
	 * @return array|WP_Error The response or error.
	 */
	public static function post( string $route, array $payload, $is_test = false ) {

		$options = CoreOptions::read_options();
		$host    = rtrim( $options['application_host'], '/' );
		$route   = ltrim( $route, '/' );
		$secret  = get_option( 'rest_api_firewall_application_webhook_secret' );

		if ( ! $host || ! $secret ) {
			return new WP_Error(
				'config',
				__( 'Webhook not configured', 'rest-api-firewall' ),
			);
		}

		$timestamp = time();
		$body      = ! empty( $payload ) ? wp_json_encode( $payload ) : '';

		$signature = hash_hmac(
			'sha256',
			$body . $timestamp,
			$secret
		);

		$endpoint = $host . '/' . $route;

		$result = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 10,
				'headers' => array(
					'Content-Type'        => 'application/json',
					'X-Webhook-Signature' => $signature,
					'X-Webhook-Timestamp' => $timestamp,
					'X-Webhook-Source'    => 'wordpress',
				),
				'body'    => $body,
			)
		);

		if ( true === $is_test ) {
			return array(
				'result'       => $result,
				'endpoint'     => $endpoint,
				'headers_sent' => array(
					'Content-Type'        => 'application/json',
					'X-Webhook-Signature' => 'xxx-xxx-xxx-xxx',
					'X-Webhook-Timestamp' => $timestamp,
					'X-Webhook-Source'    => 'wordpress',
				),
			);
		}

		return $result;
	}


	public static function build_event_payload( string $event_key, array $event_config, array $args ): array {
		$payload = array(
			'event'     => $event_key,
			'group'     => $event_config['group'],
			'timestamp' => current_time( 'c' ),
		);

		switch ( $event_config['group'] ) {
			case 'posts':
			case 'attachments':
				$post_id = $args[0] ?? 0;
				if ( $post_id ) {
					$post                   = get_post( $post_id );
					$payload['post_id']     = $post_id;
					$payload['post_type']   = $post ? $post->post_type : '';
					$payload['post_status'] = $post ? $post->post_status : '';
				}
				break;

			case 'terms':
				$term_id             = $args[0] ?? 0;
				$taxonomy            = $args[2] ?? '';
				$payload['term_id']  = $term_id;
				$payload['taxonomy'] = $taxonomy;
				break;
		}

		return $payload;
	}
}

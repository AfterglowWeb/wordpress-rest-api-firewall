<?php namespace cmk\RestApiFirewall\Application;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;

final class WebhookClient {

	public static function post( string $route, array $payload ): array {

		$options = CoreOptions::read_options();
		$host    = rtrim( $options['application_host'], '/' );
		$route   = ltrim( $route, '/' );
		$secret  = get_option( 'rest_api_firewall_application_webhook_secret' );

		if ( ! $host || ! $secret ) {
			return new \WP_Error( 'config', 'Webhook not configured' );
		}

		$timestamp = time();
		$body      = ! empty( $payload ) ? wp_json_encode( $payload ) : array();

		$signature = hash_hmac(
			'sha256',
			$body . $timestamp,
			$secret
		);

		return wp_remote_post(
			$host . '/' . $route,
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
	}
}

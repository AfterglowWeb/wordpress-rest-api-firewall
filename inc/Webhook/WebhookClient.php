<?php namespace cmk\RestApiFirewall\Webhook;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use WP_Error;

final class WebhookClient {

	public static function post( string $route, array $payload ): array {

		$options = CoreOptions::read_options();
		$host    = rtrim( $options['application_host'], '/' );
		$route   = ltrim( $route, '/' );
		$secret  = get_option( 'rest_api_firewall_application_webhook_secret' );

		if ( ! $host || ! $secret ) {
			return new WP_Error( 'config', 'Webhook not configured' );
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
					$post              = get_post( $post_id );
					$payload['post_id']   = $post_id;
					$payload['post_type'] = $post ? $post->post_type : '';
					$payload['post_status'] = $post ? $post->post_status : '';
				}
				break;

			case 'terms':
				$term_id  = $args[0] ?? 0;
				$taxonomy = $args[2] ?? '';
				$payload['term_id']  = $term_id;
				$payload['taxonomy'] = $taxonomy;
				break;
		}

		return $payload;
	}
}

<?php

namespace cmk\RestApiFirewall\Webhook;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Webhook\WebhookClient;

class WebhookAutoTrigger {

	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'register_event_hooks' ), 20 );
	}

	public static function get_available_events(): array {
		$events = array(
			
			// Posts.
			'save_post'          => array(
				'label'       => __( 'Post saved', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a post is created or updated', 'rest-api-firewall' ),
				'group'       => 'posts',
				'context'     => array( 'free', 'pro' ),
			),
			'before_delete_post' => array(
				'label'       => __( 'Post deleted', 'rest-api-firewall' ),
				'description' => __( 'Triggered before a post is permanently deleted', 'rest-api-firewall' ),
				'group'       => 'posts',
				'context'     => array( 'free', 'pro' ),
			),
			'trashed_post'       => array(
				'label'       => __( 'Post trashed', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a post is moved to trash', 'rest-api-firewall' ),
				'group'       => 'posts',
				'context'     => array( 'free', 'pro' ),
			),
			'untrashed_post'     => array(
				'label'       => __( 'Post restored', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a post is restored from trash', 'rest-api-firewall' ),
				'group'       => 'posts',
				'context'     => array( 'free', 'pro' ),
			),

			// Attachments.
			'add_attachment'     => array(
				'label'       => __( 'Attachment added', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a new attachment is uploaded', 'rest-api-firewall' ),
				'group'       => 'attachments',
				'context'     => array( 'free', 'pro' ),
			),
			'edit_attachment'    => array(
				'label'       => __( 'Attachment edited', 'rest-api-firewall' ),
				'description' => __( 'Triggered when an attachment is modified', 'rest-api-firewall' ),
				'group'       => 'attachments',
				'context'     => array( 'free', 'pro' ),
			),
			'delete_attachment'  => array(
				'label'       => __( 'Attachment deleted', 'rest-api-firewall' ),
				'description' => __( 'Triggered when an attachment is deleted', 'rest-api-firewall' ),
				'group'       => 'attachments',
				'context'     => array( 'free', 'pro' ),
			),

			// Terms.
			'created_term'       => array(
				'label'       => __( 'Term created', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a new term is created', 'rest-api-firewall' ),
				'group'       => 'terms',
				'context'     => array( 'free', 'pro' ),
			),
			'edited_term'        => array(
				'label'       => __( 'Term edited', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a term is modified', 'rest-api-firewall' ),
				'group'       => 'terms',
				'context'     => array( 'free', 'pro' ),
			),
			'delete_term'        => array(
				'label'       => __( 'Term deleted', 'rest-api-firewall' ),
				'description' => __( 'Triggered when a term is deleted', 'rest-api-firewall' ),
				'group'       => 'terms',
				'context'     => array( 'free', 'pro' ),
			),
		);

		return apply_filters( 'rest_api_firewall_webhook_available_events', $events );
	}

	public static function get_event_groups(): array {
		$groups = array(
			'posts'       => __( 'Posts', 'rest-api-firewall' ),
			'attachments' => __( 'Attachments', 'rest-api-firewall' ),
			'terms'       => __( 'Terms', 'rest-api-firewall' ),
		);

		return apply_filters( 'rest_api_firewall_webhook_event_groups', $groups );
	}

	public function register_event_hooks(): void {
		$enabled_events = CoreOptions::read_option( 'application_webhook_auto_trigger_events' );

		if ( empty( $enabled_events ) || ! is_array( $enabled_events ) ) {
			return;
		}

		$available_events = self::get_available_events();

		foreach ( $enabled_events as $event_key ) {
			if ( ! isset( $available_events[ $event_key ] ) ) {
				continue;
			}

			$this->register_single_event_hook( $event_key, $available_events[ $event_key ] );
		}
	}

	private function register_single_event_hook( string $event_key, array $event_config ): void {
		$callback = function ( ...$args ) use ( $event_key, $event_config ) {
			$this->handle_event( $event_key, $event_config, $args );
		};

		$accepted_args = $this->get_hook_accepted_args( $event_key );

		add_action( $event_key, $callback, 99, $accepted_args );
	}

	private function get_hook_accepted_args( string $event_key ): int {
		$args_map = array(
			'save_post'          => 3, // $post_id, $post, $update
			'before_delete_post' => 2, // $post_id, $post
			'trashed_post'       => 2, // $post_id, $previous_status
			'untrashed_post'     => 2, // $post_id, $previous_status
			'add_attachment'     => 1, // $post_id
			'edit_attachment'    => 1, // $post_id
			'delete_attachment'  => 1, // $post_id
			'created_term'       => 3, // $term_id, $tt_id, $taxonomy
			'edited_term'        => 3, // $term_id, $tt_id, $taxonomy
			'delete_term'        => 5, // $term_id, $tt_id, $taxonomy, $deleted_term, $object_ids
		);

		return $args_map[ $event_key ] ?? 1;
	}

	private function handle_event( string $event_key, array $event_config, array $args ): void {
		$payload = WebhookClient::build_event_payload( $event_key, $event_config, $args );

		/**
		 * Filter payload before sending.
		 * Pro automation can intercept here (input hook).
		 *
		 * @param array  $payload Event payload.
		 * @param string $event_key Event hook name.
		 * @param array  $args Original hook arguments.
		 */
		$payload = apply_filters( 'rest_api_firewall_webhook_auto_trigger_payload', $payload, $event_key, $args );

		if ( false === $payload ) {
			return;
		}

		$response = $this->trigger_webhook( $payload );

		/**
		 * Action after webhook is triggered.
		 * Pro automation can hook here (output hook).
		 *
		 * @param array|WP_Error $response Webhook response.
		 * @param array          $payload Event payload.
		 * @param string         $event_key Event hook name.
		 * @param array          $args Original hook arguments.
		 */
		do_action( 'rest_api_firewall_webhook_auto_trigger_complete', $response, $payload, $event_key, $args );
	}

	private function trigger_webhook( array $payload ) {
		$webhook_endpoint = CoreOptions::read_option( 'application_webhook_endpoint' );

		if ( empty( $webhook_endpoint ) ) {
			return new \WP_Error( 'no_endpoint', __( 'No webhook endpoint configured.', 'rest-api-firewall' ) );
		}

		return WebhookClient::post( $webhook_endpoint, $payload );
	}
}

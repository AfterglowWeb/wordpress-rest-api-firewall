<?php

namespace cmk\RestApiFirewall\Webhook;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Webhook\WebhookClient;
use cmk\RestApiFirewall\Webhook\WebhookService;

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

			'save_post'          => array(
				'label'         => __( 'Post saved', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a post is created or updated', 'rest-api-firewall' ),
				'group'         => 'posts',
				'context'       => array( 'free', 'pro' ),
				'accepted_args' => 3, // post_id, post, update.
			),
			'before_delete_post' => array(
				'label'         => __( 'Post deleted', 'rest-api-firewall' ),
				'description'   => __( 'Triggered before a post is permanently deleted', 'rest-api-firewall' ),
				'group'         => 'posts',
				'context'       => array( 'pro' ),
				'accepted_args' => 2, // post_id, post.
			),
			'trashed_post'       => array(
				'label'         => __( 'Post trashed', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a post is moved to trash', 'rest-api-firewall' ),
				'group'         => 'posts',
				'context'       => array( 'pro' ),
				'accepted_args' => 2, // post_id, previous_status.
			),
			'untrashed_post'     => array(
				'label'         => __( 'Post restored', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a post is restored from trash', 'rest-api-firewall' ),
				'group'         => 'posts',
				'context'       => array( 'pro' ),
				'accepted_args' => 2, // post_id, previous_status.
			),

			'add_attachment'     => array(
				'label'         => __( 'Attachment added', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a new attachment is uploaded', 'rest-api-firewall' ),
				'group'         => 'attachments',
				'context'       => array( 'free', 'pro' ),
				'accepted_args' => 1, // post_id.
			),
			'edit_attachment'    => array(
				'label'         => __( 'Attachment edited', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when an attachment is modified', 'rest-api-firewall' ),
				'group'         => 'attachments',
				'context'       => array( 'pro' ),
				'accepted_args' => 1, // post_id.
			),
			'delete_attachment'  => array(
				'label'         => __( 'Attachment deleted', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when an attachment is deleted', 'rest-api-firewall' ),
				'group'         => 'attachments',
				'context'       => array( 'pro' ),
				'accepted_args' => 1, // post_id.
			),

			'created_term'       => array(
				'label'         => __( 'Term created', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a new term is created', 'rest-api-firewall' ),
				'group'         => 'terms',
				'context'       => array( 'free', 'pro' ),
				'accepted_args' => 3, // term_id, tt_id, taxonomy.
			),
			'edited_term'        => array(
				'label'         => __( 'Term edited', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a term is modified', 'rest-api-firewall' ),
				'group'         => 'terms',
				'context'       => array( 'pro' ),
				'accepted_args' => 3, // term_id, tt_id, taxonomy.
			),
			'delete_term'        => array(
				'label'         => __( 'Term deleted', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a term is deleted', 'rest-api-firewall' ),
				'group'         => 'terms',
				'context'       => array( 'pro' ),
				'accepted_args' => 5, // term_id, tt_id, taxonomy, deleted_term, object_ids.
			),

			'user_register'      => array(
				'label'         => __( 'User registered', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a new user account is created', 'rest-api-firewall' ),
				'group'         => 'users',
				'context'       => array( 'pro' ),
				'accepted_args' => 2, // user_id, userdata.
			),
			'wp_login'           => array(
				'label'         => __( 'User logged in', 'rest-api-firewall' ),
				'description'   => __( 'Triggered after a successful login', 'rest-api-firewall' ),
				'group'         => 'users',
				'context'       => array( 'pro' ),
				'accepted_args' => 2, // user_login, WP_User.
			),
			'profile_update'     => array(
				'label'         => __( 'User updated', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when a user profile is updated', 'rest-api-firewall' ),
				'group'         => 'users',
				'context'       => array( 'pro' ),
				'accepted_args' => 3, // user_id, old_user_data, userdata.
			),
			'delete_user'        => array(
				'label'         => __( 'User deleted', 'rest-api-firewall' ),
				'description'   => __( 'Triggered before a user is deleted', 'rest-api-firewall' ),
				'group'         => 'users',
				'context'       => array( 'pro' ),
				'accepted_args' => 3, // user_id, reassign, old_user_data.
			),

			'inbound_webhook'    => array(
				'label'         => __( 'Incoming webhook received', 'rest-api-firewall' ),
				'description'   => __( 'Triggered when an external service sends a signed request to an inbound webhook endpoint', 'rest-api-firewall' ),
				'group'         => 'inbound',
				'context'       => array( 'pro' ),
				'accepted_args' => 0, // Dispatched programmatically — not a real WP hook.
				'virtual'       => true,
			),
		);

		return apply_filters( 'rest_api_firewall_webhook_available_events', $events );
	}

	public static function get_event_groups(): array {
		$groups = array(
			'posts'       => __( 'Posts', 'rest-api-firewall' ),
			'attachments' => __( 'Attachments', 'rest-api-firewall' ),
			'terms'       => __( 'Terms', 'rest-api-firewall' ),
			'users'       => __( 'Users', 'rest-api-firewall' ),
			'inbound'     => __( 'Incoming Webhooks', 'rest-api-firewall' ),
		);

		return apply_filters( 'rest_api_firewall_webhook_event_groups', $groups );
	}

	public function register_event_hooks(): void {
		$webhooks_data = WebhookService::get_webhooks();
		$automations   = $webhooks_data['automations'] ?? array();
		$webhooks      = $webhooks_data['webhooks'] ?? array();

		if ( ! empty( $automations ) ) {
			$this->register_automation_hooks( $automations, $webhooks );
			return;
		}

		$this->register_legacy_event_hooks();
	}

	/**
	 * Register hooks using new automation structure.
	 *
	 * @param array $automations The automations array.
	 * @param array $webhooks    The webhooks array.
	 */
	private function register_automation_hooks( array $automations, array $webhooks ): void {
		$available_events = self::get_available_events();

		foreach ( $automations as $automation ) {
			if ( empty( $automation['enabled'] ) ) {
				continue;
			}

			// Support multi-event automations; fall back to legacy single-event column.
			$event_keys = ! empty( $automation['events'] ) && is_array( $automation['events'] )
				? $automation['events']
				: ( ! empty( $automation['event'] ) ? array( $automation['event'] ) : array() );

			foreach ( $event_keys as $event_key ) {
				if ( empty( $event_key ) || ! isset( $available_events[ $event_key ] ) ) {
					continue;
				}
				// Virtual events (e.g. inbound_webhook) are dispatched programmatically — no WP hook.
				if ( ! empty( $available_events[ $event_key ]['virtual'] ) ) {
					continue;
				}
				$this->register_automation_hook( $automation, $webhooks, $event_key, $available_events[ $event_key ] );
			}
		}
	}

	/**
	 * Register a single automation hook.
	 *
	 * @param array  $automation   The automation entry.
	 * @param array  $webhooks     All webhooks.
	 * @param string $event_key    The event hook name.
	 * @param array  $event_config The event configuration.
	 */
	private function register_automation_hook( array $automation, array $webhooks, string $event_key, array $event_config ): void {
		$callback = function ( ...$args ) use ( $automation, $webhooks, $event_key, $event_config ) {
			$this->handle_automation_event( $automation, $webhooks, $event_key, $event_config, $args );
		};

		$accepted_args = $this->get_hook_accepted_args( $event_key );

		add_action( $event_key, $callback, 99, $accepted_args );
	}

	/**
	 * Handle an automation-triggered event.
	 *
	 * @param array  $automation   The automation entry.
	 * @param array  $webhooks     All webhooks.
	 * @param string $event_key    The event hook name.
	 * @param array  $event_config The event configuration.
	 * @param array  $args         The original hook arguments.
	 */
	private function handle_automation_event( array $automation, array $webhooks, string $event_key, array $event_config, array $args ): void {
		$payload = WebhookClient::build_event_payload( $event_key, $event_config, $args );

		/**
		 * Filter payload before sending.
		 *
		 * @param array  $payload    Event payload.
		 * @param string $event_key  Event hook name.
		 * @param array  $args       Original hook arguments.
		 * @param array  $automation The automation entry.
		 */
		$payload = apply_filters( 'rest_api_firewall_webhook_auto_trigger_payload', $payload, $event_key, $args, $automation );

		if ( false === $payload ) {
			return;
		}

		$webhook_ids = $automation['webhook_ids'] ?? array();
		foreach ( $webhook_ids as $webhook_id ) {
			$webhook = $this->find_webhook_by_id( $webhooks, $webhook_id );
			if ( $webhook && ! empty( $webhook['enabled'] ) ) {
				$response = WebhookClient::post_with_webhook( $webhook, $payload );

				/**
				 * Action after webhook is triggered.
				 *
				 * @param array|WP_Error $response   Webhook response.
				 * @param array          $payload    Event payload.
				 * @param string         $event_key  Event hook name.
				 * @param array          $args       Original hook arguments.
				 * @param array          $automation The automation entry.
				 * @param array          $webhook    The webhook entry.
				 */
				do_action( 'rest_api_firewall_webhook_auto_trigger_complete', $response, $payload, $event_key, $args, $automation, $webhook );
			}
		}
	}

	/**
	 * Find a webhook by ID in the webhooks array.
	 *
	 * @param array  $webhooks All webhooks.
	 * @param string $id       The webhook ID.
	 * @return array|null The webhook or null.
	 */
	private function find_webhook_by_id( array $webhooks, string $id ): ?array {
		foreach ( $webhooks as $webhook ) {
			if ( isset( $webhook['id'] ) && $webhook['id'] === $id ) {
				return $webhook;
			}
		}
		return null;
	}

	private function register_legacy_event_hooks(): void {
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
		$available_events = self::get_available_events();

		return $available_events[ $event_key ]['accepted_args'] ?? 1;
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

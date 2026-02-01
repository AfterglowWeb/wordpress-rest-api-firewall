<?php
namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\Permissions;

class CoreOptionsService {
	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_rest_api_firewall_update_options', array( $this, 'ajax_update_options' ) );
		add_action( 'wp_ajax_rest_api_firewall_update_option', array( $this, 'ajax_update_option' ) );
		add_action( 'wp_ajax_rest_api_firewall_read_options', array( $this, 'ajax_read_options' ) );
	}

	public function ajax_read_options() {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		$options = CoreOptions::read_options();
		wp_send_json_success( $options );
	}

	public function ajax_update_options() {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['action'] ) && 'rest_api_firewall_update_options' === $_POST['action'] && isset( $_POST['options'] ) ) {

			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
			$options = json_decode( sanitize_text_field( wp_unslash( $_POST['options'] ) ), true );
			if ( ! is_array( $options ) ) {
				wp_send_json_error( array( 'error' => esc_html__( 'Invalid options data', 'rest-api-firewall' ) ), 400 );
			}

			$options = CoreOptions::update_options( $options );

			wp_send_json_success(
				array(
					'message' => esc_html__( 'Options saved', 'rest-api-firewall' ),
					'options' => $options,
				)
			);
		} else {
			$options = CoreOptions::read_options();
			wp_send_json_success( $options );
		}
	}

	public function ajax_update_option() {
		if ( false === Permissions::ajax_has_firewall_update_caps() ) {
			wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
		if ( isset( $_POST['action'] ) && 'rest_api_firewall_update_option' === $_POST['action'] && isset( $_POST['option'] ) ) {

			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in Permissions::ajax_has_firewall_update_caps()
			$option = json_decode( sanitize_text_field( wp_unslash( $_POST['option'] ) ), true );
			if ( ! is_array( $option ) ) {
				wp_send_json_error( array( 'error' => esc_html__( 'Invalid option data', 'rest-api-firewall' ) ), 422 );
			}

			$key   = isset( $option['key'] ) && ! empty( $option['key'] ) ? $option['key'] : '';
			$value = isset( $option['value'] ) && ! empty( $option['value'] ) ? $option['value'] : null;

			if ( empty( $key ) || empty( $value ) ) {
				wp_send_json_error( array( 'error' => esc_html__( 'Invalid option data', 'rest-api-firewall' ) ), 422 );
			}

			$option = CoreOptions::update_option( $key, $value );

			wp_send_json_success(
				array(
					'message' => esc_html__( 'Option saved', 'rest-api-firewall' ),
					'option'  => $option,
				)
			);
		} else {
			wp_send_json_error( 'Unknown parameter', 422 );
		}
	}

	

}

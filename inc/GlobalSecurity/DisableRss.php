<?php namespace cmk\RestApiFirewall\GlobalSecurity;

use cmk\RestApiFirewall\Core\CoreOptions;

defined( 'ABSPATH' ) || exit;

/**
 * List of hooks extracted from Plugin "Disable RSS, RDF, Atom Feeds"
 * Version 1.1 by Ataurr
 * https://wpmet.com/
 **/

class DisableRss {
	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {

		if ( false === CoreOptions::read_option( 'hide_oembed_routes' ) ) {
			return;
		}

		add_action( 'do_feed', array( $this, 'disable_all_feeds' ), 10 );
		add_action( 'do_feed_rdf', array( $this, 'disable_all_feeds' ), 10 );
		add_action( 'do_feed_rss', array( $this, 'disable_all_feeds' ), 10 );
		add_action( 'do_feed_rss2', array( $this, 'disable_all_feeds' ), 10 );
		add_action( 'do_feed_atom', array( $this, 'disable_all_feeds' ), 10 );
		add_action( 'do_feed_rss2_comments', array( $this, 'disable_all_feeds' ), 10 );
		add_action( 'do_feed_atom_comments', array( $this, 'disable_all_feeds' ), 10 );
		remove_action( 'wp_head', 'feed_links_extra', 10 );
		remove_action( 'wp_head', 'feed_links', 10 );
	}

	public function disable_all_feeds() {
		wp_die( esc_html__( 'No feed available.', 'rest-api-firewall' ), 404 );
	}
}

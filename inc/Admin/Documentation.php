<?php
namespace cmk\RestApiFirewall\Admin;

use cmk\RestApiFirewall\Core\FileUtils;

use League\CommonMark\MarkdownConverter;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\SmartPunct\SmartPunctExtension;
use League\CommonMark\Extension\Strikethrough\StrikethroughExtension;
use League\CommonMark\Extension\HeadingPermalink\HeadingPermalinkExtension;
use League\CommonMark\Extension\HeadingPermalink\HeadingPermalinkRenderer;

class Documentation {
	protected static $instance = null;

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {}

	public static function read_pages() {

		$docs_dir = REST_API_FIREWALL_DIR . '/docs';

		if ( ! FileUtils::is_dir( $docs_dir ) ) {
			return array();
		}

		$pages = array(
			array(
				'slug'  => 'presentation',
				'title' => __( 'Presentation', 'rest-api-firewall' ),
				'html'  => '',
			),
			array(
				'slug'  => 'getting-started',
				'title' => __( 'Getting Started', 'rest-api-firewall' ),
				'html'  => '',
			),
			array(
				'slug'  => 'hooks',
				'title' => __( 'Hooks', 'rest-api-firewall' ),
				'html'  => '',
			),
		);

		$config = array(
			'heading_permalink' => array(
				'html_class'          => 'blank-docs-heading-permalink',
				'id_prefix'           => 'rest_firewall_docs',
				'apply_id_to_heading' => false,
				'heading_class'       => '',
				'fragment_prefix'     => 'rest_firewall_docs',
				'insert'              => 'before',
				'min_heading_level'   => 1,
				'max_heading_level'   => 6,
				'title'               => 'Permalink',
				'symbol'              => HeadingPermalinkRenderer::DEFAULT_SYMBOL,
				'aria_hidden'         => true,
			),
		);

		$environment = new Environment( $config );
		$environment->addExtension( new SmartPunctExtension() );
		$environment->addExtension( new StrikethroughExtension() );
		$environment->addExtension( new HeadingPermalinkExtension() );

		$converter = new MarkdownConverter( $environment );

		foreach ( $pages as $page ) {

			$file = realpath( $docs_dir . '/' . $page['slug'] . '.md' );

			if ( false === FileUtils::is_readable( $file ) ) {
				continue;
			}

			$markdown = FileUtils::read_file( $file );
			if ( ! $markdown ) {
				continue;
			}

			$result = $converter->convert( $markdown );
			$html   = $result->getContent();

			$pages[] = array(
				'slug'  => $page['slug'],
				'title' => $page['title'],
				'html'  => $html,
			);
		}

		return $pages;
	}
}

<?php namespace cmk\RestApiFirewall\Theme;

defined( 'ABSPATH' ) || exit;

spl_autoload_register(
	function ( string $class ): void {
		$prefix = 'cmk\\RestApiFirewall\\Theme\\';

		if ( 0 !== strpos( $class, $prefix ) ) {
			return;
		}

		$relative_class = substr( $class, strlen( $prefix ) );
		$file = get_stylesheet_directory() . '/inc/' . str_replace( '\\', '/', $relative_class ) . '.php';

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
);

function check_plugin_dependency(): bool {
	return class_exists( 'cmk\\RestApiFirewall\\Core\\CoreOptions' )
		&& class_exists( 'cmk\\RestApiFirewall\\Core\\Utils' );
}

function plugin_dependency_notice(): void {
	if ( check_plugin_dependency() ) {
		return;
	}

	$message = sprintf(
		/* translators: %s is the plugin name */
		__( '<strong>REST API Firewall Theme</strong> requires the <strong>%s</strong> plugin to be installed and activated.', 'rest-api-firewall' ),
		'REST API Firewall'
	);

	printf(
		'<div class="notice notice-error"><p>%s</p></div>',
		wp_kses( $message, array( 'strong' => array() ) )
	);
}

add_action( 'admin_notices', __NAMESPACE__ . '\\plugin_dependency_notice' );

if ( ! check_plugin_dependency() ) {
	return;
}

Theme::get_instance();
PostContent::get_instance();
ImageFiles::get_instance();
RedirectTemplates::get_instance();
CustomPosts::get_instance();
DisableComments::get_instance();
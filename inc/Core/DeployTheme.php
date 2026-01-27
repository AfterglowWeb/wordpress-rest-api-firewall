<?php namespace cmk\RestApiFirewall\Core;

defined( 'ABSPATH' ) || exit;

/**
 * DeployTheme handles deploying the bundled theme to wp-content/themes.
 *
 * Workflow:
 * 1. React UI calls 'check' to get current state
 * 2. User clicks deploy -> 'deploy' action copies files with progress
 * 3. User clicks activate -> 'activate' action switches theme
 */
class DeployTheme {

	protected static $instance = null;

	private const THEME_SLUG = 'rest-api-firewall-theme';
	private const THEME_NAME = 'REST API Firewall Theme';

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {
		add_action( 'wp_ajax_deploy_theme', array( $this, 'ajax_handler' ) );
	}

	private static function get_source_dir(): string {
		return REST_API_FIREWALL_DIR . '/theme';
	}

	private static function get_target_dir(): string {
		return get_theme_root() . '/' . self::THEME_SLUG;
	}

	public static function is_deployed(): bool {
		$target = self::get_target_dir();
		return Utils::is_dir( $target ) && Utils::is_readable( $target . '/style.css' );
	}

	public static function is_active(): bool {
		return get_stylesheet() === self::THEME_SLUG;
	}

	public static function get_status(): array {
		$current_theme = wp_get_theme();

		return array(
			'deployed'      => self::is_deployed(),
			'active'        => self::is_active(),
			'theme_slug'    => self::THEME_SLUG,
			'theme_name'    => self::THEME_NAME,
			'source_exists' => Utils::is_dir( self::get_source_dir() ),
			'current_theme' => array(
				'name'       => $current_theme->get( 'Name' ),
				'slug'       => get_stylesheet(),
				'version'    => $current_theme->get( 'Version' ),
				'is_ours'    => get_stylesheet() === self::THEME_SLUG,
			),
			'bundled_version' => self::get_bundled_version(),
			'deployed_version' => self::is_deployed() ? self::get_deployed_version() : null,
		);
	}

	/**
	 * Get version from bundled theme.
	 */
	private static function get_bundled_version(): ?string {
		$style_css = self::get_source_dir() . '/style.css';
		return self::parse_theme_version( $style_css );
	}

	/**
	 * Get version from deployed theme.
	 */
	private static function get_deployed_version(): ?string {
		$style_css = self::get_target_dir() . '/style.css';
		return self::parse_theme_version( $style_css );
	}

	/**
	 * Parse version from style.css header.
	 */
	private static function parse_theme_version( string $file_path ): ?string {
		$content = Utils::read_file( $file_path );
		if ( ! $content ) {
			return null;
		}

		if ( preg_match( '/Version:\s*(.+)/i', $content, $matches ) ) {
			return trim( $matches[1] );
		}

		return null;
	}

	/**
	 * Deploy the theme by copying files.
	 * Returns an array of steps with status for progress tracking.
	 */
	public static function deploy(): array {
		$source = self::get_source_dir();
		$target = self::get_target_dir();
		$steps  = array();

		// Step 1: Validate source.
		$steps[] = array(
			'step'    => 'validate_source',
			'label'   => __( 'Validating source files', 'rest-api-firewall' ),
			'status'  => 'pending',
			'message' => '',
		);

		if ( ! Utils::is_dir( $source ) ) {
			$steps[0]['status']  = 'error';
			$steps[0]['message'] = __( 'Source theme directory not found in plugin.', 'rest-api-firewall' );
			return $steps;
		}

		$steps[0]['status'] = 'done';

		// Step 2: Create target directory.
		$steps[] = array(
			'step'    => 'create_directory',
			'label'   => __( 'Creating theme directory', 'rest-api-firewall' ),
			'status'  => 'pending',
			'message' => '',
		);

		if ( ! Utils::is_dir( $target ) ) {
			if ( ! Utils::mkdir_p( $target ) ) {
				$steps[1]['status']  = 'error';
				$steps[1]['message'] = __( 'Failed to create theme directory.', 'rest-api-firewall' );
				return $steps;
			}
		}

		$steps[1]['status'] = 'done';

		// Step 3: Copy files.
		$steps[] = array(
			'step'    => 'copy_files',
			'label'   => __( 'Copying theme files', 'rest-api-firewall' ),
			'status'  => 'pending',
			'message' => '',
			'files'   => array(),
		);

		$copy_result = self::copy_directory( $source, $target );

		if ( is_wp_error( $copy_result ) ) {
			$steps[2]['status']  = 'error';
			$steps[2]['message'] = $copy_result->get_error_message();
			return $steps;
		}

		$steps[2]['status'] = 'done';
		$steps[2]['files']  = $copy_result;
		$steps[2]['message'] = sprintf(
			/* translators: %d is the number of files */
			__( 'Copied %d files successfully.', 'rest-api-firewall' ),
			count( $copy_result )
		);

		// Step 4: Verify deployment.
		$steps[] = array(
			'step'    => 'verify',
			'label'   => __( 'Verifying deployment', 'rest-api-firewall' ),
			'status'  => 'pending',
			'message' => '',
		);

		if ( ! self::is_deployed() ) {
			$steps[3]['status']  = 'error';
			$steps[3]['message'] = __( 'Deployment verification failed.', 'rest-api-firewall' );
			return $steps;
		}

		$steps[3]['status']  = 'done';
		$steps[3]['message'] = __( 'Theme deployed successfully.', 'rest-api-firewall' );

		return $steps;
	}

	/**
	 * Recursively copy a directory using WP_Filesystem.
	 *
	 * @return array|\WP_Error Array of copied files on success, WP_Error on failure.
	 */
	private static function copy_directory( string $source, string $target ) {
		$wp_filesystem = Utils::wp_filesystem();

		if ( ! $wp_filesystem ) {
			return new \WP_Error( 'filesystem', __( 'WordPress filesystem not available.', 'rest-api-firewall' ) );
		}

		$copied_files = array();

		// Get directory contents.
		$files = $wp_filesystem->dirlist( $source );

		if ( false === $files ) {
			return new \WP_Error( 'read_error', __( 'Could not read source directory.', 'rest-api-firewall' ) );
		}

		foreach ( $files as $filename => $file_info ) {
			$source_path = trailingslashit( $source ) . $filename;
			$target_path = trailingslashit( $target ) . $filename;

			if ( 'd' === $file_info['type'] ) {
				// Directory: create and recurse.
				if ( ! $wp_filesystem->is_dir( $target_path ) ) {
					if ( ! $wp_filesystem->mkdir( $target_path, FS_CHMOD_DIR ) ) {
						return new \WP_Error(
							'mkdir_error',
							sprintf(
								/* translators: %s is the directory path */
								__( 'Failed to create directory: %s', 'rest-api-firewall' ),
								$target_path
							)
						);
					}
				}

				$sub_result = self::copy_directory( $source_path, $target_path );

				if ( is_wp_error( $sub_result ) ) {
					return $sub_result;
				}

				$copied_files = array_merge( $copied_files, $sub_result );

			} else {
				// File: copy.
				$content = $wp_filesystem->get_contents( $source_path );

				if ( false === $content ) {
					return new \WP_Error(
						'read_error',
						sprintf(
							/* translators: %s is the file path */
							__( 'Failed to read file: %s', 'rest-api-firewall' ),
							$source_path
						)
					);
				}

				if ( ! $wp_filesystem->put_contents( $target_path, $content, FS_CHMOD_FILE ) ) {
					return new \WP_Error(
						'write_error',
						sprintf(
							/* translators: %s is the file path */
							__( 'Failed to write file: %s', 'rest-api-firewall' ),
							$target_path
						)
					);
				}

				$copied_files[] = str_replace( trailingslashit( $target ), '', $target_path );
			}
		}

		return $copied_files;
	}

	/**
	 * Activate the deployed theme.
	 */
	public static function activate(): array {
		if ( ! self::is_deployed() ) {
			return array(
				'success' => false,
				'message' => __( 'Theme is not deployed. Please deploy first.', 'rest-api-firewall' ),
			);
		}

		if ( self::is_active() ) {
			return array(
				'success' => true,
				'message' => __( 'Theme is already active.', 'rest-api-firewall' ),
			);
		}

		// Switch theme.
		switch_theme( self::THEME_SLUG );

		// Clear caches.
		wp_cache_flush();

		// Verify activation.
		if ( ! self::is_active() ) {
			return array(
				'success' => false,
				'message' => __( 'Failed to activate theme.', 'rest-api-firewall' ),
			);
		}

		return array(
			'success' => true,
			'message' => __( 'Theme activated successfully.', 'rest-api-firewall' ),
		);
	}

	/**
	 * AJAX handler for theme deployment operations.
	 */
	public function ajax_handler(): void {
		if ( ! current_user_can( 'switch_themes' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized', 'rest-api-firewall' ) ), 403 );
		}

		if ( ! check_ajax_referer( 'rest_api_firewall_nonce', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid nonce', 'rest-api-firewall' ) ), 403 );
		}

		$action = isset( $_POST['theme_action'] ) ? sanitize_key( wp_unslash( $_POST['theme_action'] ) ) : '';

		switch ( $action ) {
			case 'check':
				wp_send_json_success( self::get_status() );
				break;

			case 'deploy':
				$steps = self::deploy();
				$has_error = false;

				foreach ( $steps as $step ) {
					if ( 'error' === $step['status'] ) {
						$has_error = true;
						break;
					}
				}

				if ( $has_error ) {
					wp_send_json_error( array(
						'steps'  => $steps,
						'status' => self::get_status(),
					) );
				} else {
					wp_send_json_success( array(
						'steps'  => $steps,
						'status' => self::get_status(),
					) );
				}
				break;

			case 'activate':
				$result = self::activate();

				if ( $result['success'] ) {
					wp_send_json_success( array(
						'message' => $result['message'],
						'status'  => self::get_status(),
					) );
				} else {
					wp_send_json_error( array(
						'message' => $result['message'],
						'status'  => self::get_status(),
					) );
				}
				break;

			default:
				wp_send_json_error( array( 'message' => __( 'Invalid action', 'rest-api-firewall' ) ), 400 );
		}
	}
}

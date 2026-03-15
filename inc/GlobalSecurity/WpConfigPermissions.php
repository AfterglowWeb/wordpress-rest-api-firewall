<?php namespace cmk\RestApiFirewall\GlobalSecurity;

use cmk\RestApiFirewall\Core\CoreOptions;
use cmk\RestApiFirewall\Core\FileUtils;

defined( 'ABSPATH' ) || exit;

class WpConfigPermissions {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
  
        $permissions = $this->read_permissions();
        if ( empty( $permissions ) ) {
            return;
        }

        if ( 0444 !== $permissions  && CoreOptions::read_option( 'secure_wp_config' ) ) {
            self::change_permissions();
        }
    }

    private function read_permissions(): int {
        FileUtils::wp_filesystem();
        if( FileUtils::is_readable( ABSPATH . 'wp-config.php' ) ) {
            return fileperms( ABSPATH . 'wp-config.php' ) & 0777;
        }

        return 0;
    }

    private function change_permissions(): bool {
        FileUtils::wp_filesystem();
        if( FileUtils::is_readable( ABSPATH . 'wp-config.php' ) ) {
            $handle = chmod( ABSPATH . 'wp-config.php', 0440 );
            if ( false === $handle ) {
                $handle = chmod( ABSPATH . 'wp-config.php', 0444 );
            }
        }

        return $handle;
    }



}
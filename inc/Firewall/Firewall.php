<?php
namespace cmk\RestApiFirewall\Firewall;

defined( 'ABSPATH' ) || exit;

use cmk\RestApiFirewall\Firewall\WordpressAuth;
use cmk\RestApiFirewall\Firewall\IpBlackList;
use cmk\RestApiFirewall\Firewall\RateLimit;
use WP_REST_Request;
use WP_Error;

class Firewall {

    public static function result( $result ) {
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        $ip_check = self::ip_blacklist( $result );
        if ( is_wp_error( $ip_check ) ) {
            return $ip_check;
        }
    
        $auth_check = self::wordpress_auth( $result );
        if ( is_wp_error( $auth_check ) ) {
            return $auth_check;
        }

        return $result;
    }

     public static function request( WP_REST_Request $request ) {
       
        $rate_check = self::rate_limit(  $request );
        if ( is_wp_error( $rate_check ) ) {
            return $rate_check;
        }
    
        return $request;
    }

    /**
	 * IP filter
	 *
	 * @param mixed            $result  Response to replace the requested version with.
	 * @param \WP_REST_Server  $server  Server instance.
	 * @param \WP_REST_Request $request Request used to generate the response.
	 * @return mixed|\WP_Error
	 */
	private static function ip_blacklist( $result ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}

        if ( false === FirewallOptions::get_option( 'enforce_ip_blacklist' ) ) {
			return $result;
		}

		$ip_check = IpBlackList::check_request();

		if ( is_wp_error( $ip_check ) ) {
			return $ip_check;
		}

		return $result;
	}

    /**
	 * WordPress Application Authentication
	 *
	 * @param mixed            $result  Response to replace the requested version with.
	 * @param \WP_REST_Server  $server  Server instance.
	 * @param \WP_REST_Request $request Request used to generate the response.
	 * @return mixed|\WP_Error
	 */
    public static function wordpress_auth( $result ) {

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === FirewallOptions::get_option( 'enforce_auth' ) ) {
			return $result;
		}

		if ( false === WordpressAuth::validate_wp_application_password() ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'Authentication required.', 'rest-api-firewall' ),
				array( 'status' => 401 )
			);
		}

		return $result;
	}

    /**
	 * Check rate limit for a request.
	 *
	 * @param \WP_REST_Request $request    The REST request.
	 * @param int|false        $rate_limit Optional rate limit (requests). Falls back to global.
	 * @param int|false        $time_limit Optional time window (seconds). Falls back to global.
	 * @return true|\WP_Error
	 */
	private static function rate_limit( WP_REST_Request $request, $rate_limit = false, $time_limit = false ) {

		$client_id        = RateLimit::get_client_identifier( $request );
		$key              = 'rest_firewall_rl_' . md5( $client_id . $request->get_route() );
		$firewall_options = FirewallOptions::get_options();

		$rate_limit = false !== $rate_limit ? (int) $rate_limit : (int) $firewall_options['rate_limit'];
		$time_limit = false !== $time_limit ? (int) $time_limit : (int) $firewall_options['rate_limit_time'];

		$count = (int) get_transient( $key );

		if ( $count >= $rate_limit ) {
			return new WP_Error(
				'rest_firewall_rate_limited',
				esc_html__( 'Too many requests.', 'rest-api-firewall' ),
				array( 'status' => 429 )
			);
		}

		set_transient( $key, $count + 1, $time_limit );

		return true;
	}

}
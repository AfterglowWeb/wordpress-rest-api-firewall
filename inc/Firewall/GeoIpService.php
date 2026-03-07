<?php

namespace cmk\RestApiFirewall\Firewall;

class GeoIpService {

	private const CACHE_KEY_PREFIX = 'rest_api_fw_geoip_';
	private const CACHE_TTL        = 86400 * 7; // 7 days.
	private const API_ENDPOINT     = 'https://ipapi.co/{ip}/json/';

	public static function get_geoip( string $ip ): ?array {

		$cached = self::get_cached( $ip );
		if ( $cached ) {
			return $cached;
		}

		$geoip = self::fetch_from_api( $ip );

		if ( $geoip ) {
			self::cache_result( $ip, $geoip );
			return $geoip;
		}

		return null;
	}

	private static function fetch_from_api( string $ip ): ?array {
		$url = str_replace( '{ip}', $ip, self::API_ENDPOINT );

		$response = wp_remote_get(
			$url,
			array(
				'timeout'   => 5,
				'sslverify' => true,
			)
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! is_array( $data ) ) {
			return null;
		}

		return array(
			'country'     => $data['country_code'] ?? null,
			'countryName' => $data['country_name'] ?? null,
			'city'        => $data['city'] ?? null,
			'latitude'    => $data['latitude'] ?? null,
			'longitude'   => $data['longitude'] ?? null,
			'isp'         => $data['org'] ?? null,
		);
	}

	private static function get_cached( string $ip ): ?array {
		$key    = self::CACHE_KEY_PREFIX . md5( $ip );
		$cached = wp_cache_get( $key, 'rest_api_firewall' );
		if ( false !== $cached ) {
			return $cached;
		}

		$from_transient = get_transient( $key );
		if ( false !== $from_transient ) {
			wp_cache_set( $key, $from_transient, 'rest_api_firewall', self::CACHE_TTL );
			return $from_transient;
		}

		return null;
	}

	private static function cache_result( string $ip, array $data ): void {
		$key = self::CACHE_KEY_PREFIX . md5( $ip );
		wp_cache_set( $key, $data, 'rest_api_firewall', self::CACHE_TTL );

		if ( wp_using_ext_object_cache() || is_admin() ) {
			set_transient( $key, $data, self::CACHE_TTL );
		}
	}
}

<?php

namespace cmk\RestApiFirewall\Firewall;

class GeoIpService {

	private const CACHE_KEY    = 'rest_api_firewall_geoip_cache';
	private const CACHE_TTL    = 86400 * 30;
	private const API_ENDPOINT = 'https://ipapi.co/{ip}/json/';

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
		$cache = get_transient( self::CACHE_KEY );

		if ( ! is_array( $cache ) ) {
			$cache = array();
		}

		return $cache[ $ip ] ?? null;
	}

	private static function cache_result( string $ip, array $data ): void {

		$transient    = get_transient( self::CACHE_KEY );
		$cache        = false !== $transient ? $transient : array();
		$cache[ $ip ] = $data;
		set_transient( self::CACHE_KEY, $cache, self::CACHE_TTL );
	}
}

<?php namespace cmk\RestApiFirewall\Firewall\IpFilter;

defined( 'ABSPATH' ) || exit;

final class CidrMatcher {

	public static function matches( string $ip, string $cidr ): bool {
		list( $subnet, $mask ) = explode( '/', $cidr );

		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) &&
			filter_var( $subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {

			$ip_long     = ip2long( $ip );
			$subnet_long = ip2long( $subnet );
			$mask_long   = -1 << ( 32 - (int) $mask );

			return ( $ip_long & $mask_long ) === ( $subnet_long & $mask_long );
		}

		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) &&
			filter_var( $subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {

			$ip_bin     = inet_pton( $ip );
			$subnet_bin = inet_pton( $subnet );
			$mask       = (int) $mask;
			$mask_bin   = str_repeat( "\xff", (int) ( $mask / 8 ) );

			if ( $mask % 8 ) {
				$mask_bin .= chr( 256 - pow( 2, 8 - ( $mask % 8 ) ) );
			}

			$mask_bin = str_pad( $mask_bin, 16, "\x00" );

			return ( $ip_bin & $mask_bin ) === ( $subnet_bin & $mask_bin );
		}

		return false;
	}
}
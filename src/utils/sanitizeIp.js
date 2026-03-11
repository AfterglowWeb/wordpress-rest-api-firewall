const MAX_IPV4_LEN = 15;
// 45 = longest IPv4-mapped form: ffff:ffff:ffff:ffff:ffff:ffff:255.255.255.255
const MAX_IPV6_LEN = 45;
// 49 = MAX_IPV6_LEN + '/128'
const MAX_CIDR_LEN = 49;

const IPV4_RE =
	/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/;

const HEX_GROUP_RE = /^[0-9a-fA-F]{1,4}$/;

export function isValidIpv4( value ) {
	if ( ! value || value.length > MAX_IPV4_LEN ) {
		return false;
	}
	return IPV4_RE.test( value );
}

/**
 * Validates an IPv6 address including:
 * - Full form:            2001:0db8:85a3:0000:0000:8a2e:0370:7334
 * - Compressed (::):      2001:db8::1, ::1, ::
 * - IPv4-mapped tail:     ::ffff:192.168.1.1, 64:ff9b::192.0.2.1
 */
export function isValidIpv6( value ) {
	if ( ! value || value.length > MAX_IPV6_LEN ) {
		return false;
	}

	// Zone IDs are not valid in a firewall context.
	if ( value.includes( '%' ) ) {
		return false;
	}

	// At most one '::' allowed.
	const dcCount = ( value.match( /::/g ) || [] ).length;
	if ( dcCount > 1 ) {
		return false;
	}

	const hasDoubleColon = dcCount === 1;
	let segments;

	if ( hasDoubleColon ) {
		const [ left, right ] = value.split( '::' );
		const leftSegs = left ? left.split( ':' ) : [];
		let rightSegs = right ? right.split( ':' ) : [];

		// Handle optional IPv4 tail on the right side of '::'
		if ( rightSegs.length > 0 && isValidIpv4( rightSegs[ rightSegs.length - 1 ] ) ) {
			rightSegs = [ ...rightSegs.slice( 0, -1 ), '0', '0' ];
		}

		// '::' must compress at least one group → max 7 explicit groups
		if ( leftSegs.length + rightSegs.length > 7 ) {
			return false;
		}

		segments = [ ...leftSegs, ...rightSegs ];
	} else {
		let segs = value.split( ':' );

		// Handle optional IPv4 tail in full-form address (e.g. ::ffff:a.b.c.d without '::')
		if ( segs.length > 0 && isValidIpv4( segs[ segs.length - 1 ] ) ) {
			segs = [ ...segs.slice( 0, -1 ), '0', '0' ];
		}

		if ( segs.length !== 8 ) {
			return false;
		}

		segments = segs;
	}

	return segments.every( ( s ) => HEX_GROUP_RE.test( s ) );
}

export function isValidCidr( value ) {
	if ( ! value || value.length > MAX_CIDR_LEN ) {
		return false;
	}

	const slashIdx = value.indexOf( '/' );
	if ( slashIdx === -1 ) {
		return false;
	}

	const addr = value.slice( 0, slashIdx );
	const prefixStr = value.slice( slashIdx + 1 );

	// Prefix must be a non-negative integer, no leading zeros (except '0' itself).
	if ( ! /^(?:0|[1-9][0-9]*)$/.test( prefixStr ) ) {
		return false;
	}
	const bits = Number( prefixStr );

	if ( isValidIpv4( addr ) ) {
		return bits <= 32;
	}
	if ( isValidIpv6( addr ) ) {
		return bits <= 128;
	}
	return false;
}

export function isValidIpOrCidr( value, allowCidr = true ) {
	if ( ! value ) {
		return false;
	}
	const v = value.trim();
	return (
		isValidIpv4( v ) ||
		isValidIpv6( v ) ||
		( allowCidr && isValidCidr( v ) )
	);
}

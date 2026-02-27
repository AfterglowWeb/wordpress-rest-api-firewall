/**
 * IP / CIDR validation utilities.
 *
 * All validators apply a hard length cap BEFORE running any regex.
 * Even though our regexes have bounded quantifiers and no catastrophic
 * backtracking, testing a 50 KB string against any regex is still slow.
 * A cheap length check eliminates that path entirely.
 *
 * JS validation is UX-only (instant feedback before submit).
 * PHP performs the authoritative check server-side via
 * IpEntryRepository::is_valid_ip_or_cidr().
 */

// Longest valid value of each kind
const MAX_IPV4_LEN      = 15; // "255.255.255.255"
const MAX_IPV6_LEN      = 39; // "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"
const MAX_IPV6_CIDR_LEN = 43; // same + "/128" — covers IPv4 CIDR too

// IPv4 — deterministic, bounded alternation, anchored start/end
const IPV4_RE =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidIpv4( value ) {
	if ( ! value || value.length > MAX_IPV4_LEN ) return false;
	return IPV4_RE.test( value );
}

/**
 * Validates any IPv6 address (full, compressed, loopback ::1, IPv4-mapped
 * ::ffff:192.0.2.1, etc.) using the URL constructor — the most complete
 * validator available without a library.
 *
 * This replaces the previous hand-rolled regex which missed most compressed
 * forms (::1, 2001:db8::1, …).
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidIpv6( value ) {
	if ( ! value || value.length > MAX_IPV6_LEN ) return false;
	try {
		new URL( `http://[${ value }]` );
		return true;
	} catch {
		return false;
	}
}

/**
 * Validates a CIDR range — IPv4 (/0–32) or IPv6 (/0–128).
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidCidr( value ) {
	if ( ! value || value.length > MAX_IPV6_CIDR_LEN ) return false;

	const slashIdx = value.indexOf( '/' );
	if ( slashIdx === -1 ) return false;

	const addr      = value.slice( 0, slashIdx );
	const prefixStr = value.slice( slashIdx + 1 );

	// Prefix must be a plain non-negative integer — no leading zeros, no floats
	if ( ! /^(?:0|[1-9][0-9]*)$/.test( prefixStr ) ) return false;
	const bits = parseInt( prefixStr, 10 );

	if ( isValidIpv4( addr ) ) return bits <= 32;
	if ( isValidIpv6( addr ) ) return bits <= 128;
	return false;
}

/**
 * Returns true for a plain IPv4, IPv6, or CIDR range.
 *
 * @param {string}  value
 * @param {boolean} [allowCidr=true]  Set false to reject CIDR notation (free-tier parity).
 * @returns {boolean}
 */
export function isValidIpOrCidr( value, allowCidr = true ) {
	if ( ! value ) return false;
	const v = value.trim();
	return isValidIpv4( v ) || isValidIpv6( v ) || ( allowCidr && isValidCidr( v ) );
}

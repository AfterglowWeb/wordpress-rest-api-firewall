const MAX_HOST_LENGTH   = 260;
const MAX_ORIGIN_LENGTH = 2048;

// RFC 1123 hostname label.
const LABEL_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export function isValidHostname( value ) {
	if ( ! value || typeof value !== 'string' ) return false;
	if ( value.length > MAX_HOST_LENGTH ) return false;

	if ( value.includes( '://' ) ) return false;

	const colons = ( value.match( /:/g ) || [] ).length;

	let host = value;
	let port = null;

	if ( colons === 1 ) {
		const sep = value.lastIndexOf( ':' );
		host = value.slice( 0, sep );
		port = value.slice( sep + 1 );
	} else if ( colons > 1 ) {
		return false;
	}

	if ( port !== null ) {
		if ( ! /^[0-9]{1,5}$/.test( port ) ) return false;
		const n = parseInt( port, 10 );
		if ( n < 1 || n > 65535 ) return false;
	}

	const labels = host.split( '.' );
	for ( const label of labels ) {
		if ( label.length === 0 || label.length > 63 ) return false;
		if ( ! LABEL_RE.test( label ) ) return false;
	}

	return true;
}

export function isValidOrigin( value ) {
	if ( ! value || typeof value !== 'string' ) return false;
	if ( value.length > MAX_ORIGIN_LENGTH ) return false;

	try {
		const url = new URL( value );
		if ( url.protocol !== 'http:' && url.protocol !== 'https:' ) return false;
		if ( url.username || url.password ) return false;
		if ( url.pathname !== '/' ) return false;
		if ( url.search || url.hash ) return false;
		return true;
	} catch {
		return false;
	}
}

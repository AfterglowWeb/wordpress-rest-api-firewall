/**
 * Simple sprintf implementation for basic string formatting
 * Supports:
 * - %d with numbers and %s with strings (sequential)
 * - %1$d, %2$d, %1$s, %2$s... (positional parameters)
 * @param {string} str  String to format
 * @param {...any} args Arguments to replace in the string
 * @return {string} Formatted string
 */
export default function sprintf( str, ...args ) {
	let i = 0;

	str = str.replace( /%(\d+)\$([sd])/g, ( match, position ) => {
		const index = parseInt( position, 10 ) - 1;
		if ( index >= 0 && index < args.length ) {
			return args[ index ];
		}
		return match;
	} );

	return str.replace( /%[sd]/g, ( match ) => {
		if ( i < args.length ) {
			return args[ i++ ];
		}
		return match;
	} );
}

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export function RateLimitFields( { values = {}, maxValues = {}, onChange } ) {
	const { __ } = wp.i18n || {};
	const {
		max_requests = '',
		window_seconds = '',
		release_seconds = '',
		blacklist_after = '',
		blacklist_window = '',
		enabled = false,
	} = values;

	const fieldMax = ( key ) => maxValues[ key ] ? { inputProps: { min: 1, max: maxValues[ key ] } } : { inputProps: { min: 1 } };

	return (
		<Stack spacing={ 2 }>
			<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
				<TextField
					label={ __( 'Max Requests', 'rest-api-firewall' ) }
					type="number"
					size="small"
					disabled={ ! enabled }
					value={ max_requests }
					onChange={ ( e ) => onChange( 'max_requests', e.target.value ) }
					helperText={ maxValues.max_requests ? `max ${ maxValues.max_requests }` : __( 'Requests allowed per window', 'rest-api-firewall' ) }
					{ ...fieldMax( 'max_requests' ) }
					sx={{ width: 150 }}
				/>
				<TextField
					label={ __( 'Window (seconds)', 'rest-api-firewall' ) }
					type="number"
					size="small"
					disabled={ ! enabled }
					value={ window_seconds }
					onChange={ ( e ) => onChange( 'window_seconds', e.target.value ) }
					helperText={ maxValues.window_seconds ? `max ${ maxValues.window_seconds }s` : __( 'Rolling time window', 'rest-api-firewall' ) }
					{ ...fieldMax( 'window_seconds' ) }
					sx={{ width: 150 }}
				/>
				<TextField
					label={ __( 'Release (seconds)', 'rest-api-firewall' ) }
					type="number"
					size="small"
					disabled={ ! enabled }
					value={ release_seconds }
					onChange={ ( e ) => onChange( 'release_seconds', e.target.value ) }
					helperText={ maxValues.release_seconds ? `max ${ maxValues.release_seconds }s` : __( 'Wait time before limitation resets', 'rest-api-firewall' ) }
					{ ...fieldMax( 'release_seconds' ) }
					sx={{ width: 150 }}
				/>
				<TextField
					label={ __( 'Blacklist After', 'rest-api-firewall' ) }
					type="number"
					size="small"
					disabled={ ! enabled }
					value={ blacklist_after }
					onChange={ ( e ) => onChange( 'blacklist_after', e.target.value ) }
					helperText={ maxValues.blacklist_after ? `max ${ maxValues.blacklist_after } violations ` : __( 'Violations before blacklisted', 'rest-api-firewall' ) }
					{ ...fieldMax( 'blacklist_after' ) }
					sx={{ width: 150 }}
				/>
				<TextField
					label={ __( 'Blacklist Window', 'rest-api-firewall' ) }
					type="number"
					size="small"
					disabled={ ! enabled }
					value={ blacklist_window }
					onChange={ ( e ) => onChange( 'blacklist_window', e.target.value ) }
					helperText={ maxValues.blacklist_window ? `max ${ maxValues.blacklist_window }s` : __( 'Time window for violations count (seconds)', 'rest-api-firewall' ) }
					{ ...fieldMax( 'blacklist_window' ) }
					sx={{ width: 150 }}
				/>
			</Stack>
		</Stack>
	);
}
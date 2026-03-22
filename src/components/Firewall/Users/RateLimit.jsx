import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export default function RateLimit( { form, setField } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack
			direction={ 'column' }
			my={ 3.6 }
			spacing={ 3 }
			justifyContent={ 'space-around' }
		>
			<Stack direction={ { xs: 'column', lg: 'row' } } gap={ 2 }>
				<TextField
					label={ __( 'Rate Limit Requests', 'rest-api-firewall' ) }
					name="rate_limit"
					type="number"
					helperText={ __(
						'Maximum requests before limiting',
						'rest-api-firewall'
					) }
					value={ form.rate_limit || 30 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>

				<TextField
					label={ __(
						'Rate Limit Window (seconds)',
						'rest-api-firewall'
					) }
					name="rate_limit_time"
					type="number"
					helperText={ __(
						'Time window for requests count',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_time || 60 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>
			</Stack>

			<Stack direction={ { xs: 'column', lg: 'row' } } gap={ 2 }>
				<TextField
					label={ __(
						'Rate Limit Release (seconds)',
						'rest-api-firewall'
					) }
					name="rate_limit_release"
					type="number"
					helperText={ __(
						'Wait time before limitation resets',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_release || 300 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>

				<TextField
					label={ __( 'Rate Limit Blacklist', 'rest-api-firewall' ) }
					name="rate_limit_blacklist"
					type="number"
					helperText={ __(
						'Number of limitation periods before blacklisted',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_blacklist || 5 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>

				<TextField
					label={ __(
						'Blacklist Limit Window (seconds)',
						'rest-api-firewall'
					) }
					name="rate_limit_blacklist_time"
					type="number"
					helperText={ __(
						'Time window for limitation periods count',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_blacklist_time || 3600 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>
			</Stack>
		</Stack>
	);
}

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
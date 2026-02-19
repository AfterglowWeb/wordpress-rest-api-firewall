import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

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

				<FormControl sx={ { flex: 1, maxWidth: 270 } }>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.enforce_rate_limit
								}
								onChange={ setField }
								size="small"
							/>
						}
						label={ __(
							'Enforce Rate Limiting',
							'rest-api-firewall'
						) }
					/>
					<FormHelperText>
						{ __(
							'Apply rate limiting to all routes',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>
			</Stack>

			<Stack direction={ { xs: 'column', lg: 'row' } } gap={ 2 }>
				<TextField
					label={ __(
						'Rate Limit Release (seconds)',
						'rest-api-firewall'
					) }
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

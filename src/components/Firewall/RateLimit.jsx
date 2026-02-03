import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

export default function RateLimit( { firewallOptions, handleOptionChange } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack
			direction={ 'column' }
			my={ 3.6 }
			spacing={ 3 }
			justifyContent={ 'space-around' }
		>
			<Stack direction={ { xs: 'column', md: 'row' } } gap={ 2 }>
				<TextField
					label={ __( 'Rate Limit Requests', 'rest-api-firewall' ) }
					type="number"
					helperText={ __(
						'Maximum requests before limiting',
						'rest-api-firewall'
					) }
					name="rate_limit"
					value={ firewallOptions.rate_limit }
					onChange={ handleOptionChange }
					fullWidth
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
					name="rate_limit_time"
					value={ firewallOptions.rate_limit_time }
					onChange={ handleOptionChange }
					fullWidth
				/>

				<FormControl sx={ { minWidth: 240 } }>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! firewallOptions.enforce_rate_limit
								}
								name="enforce_rate_limit"
								onChange={ handleOptionChange }
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

			<Stack direction={ { xs: 'column', md: 'row' } } gap={ 2 }>
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
					name="rate_limit_release"
					value={ firewallOptions.rate_limit_release }
					onChange={ handleOptionChange }
					fullWidth
				/>

				<TextField
					label={ __( 'Rate Limit Blacklist', 'rest-api-firewall' ) }
					type="number"
					helperText={ __(
						'Number of limitation periods before blacklisted',
						'rest-api-firewall'
					) }
					name="rate_limit_blacklist"
					value={ firewallOptions.rate_limit_blacklist }
					onChange={ handleOptionChange }
					fullWidth
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
					name="rate_limit_blacklist_time"
					value={ firewallOptions.rate_limit_blacklist_time }
					onChange={ handleOptionChange }
					fullWidth
				/>
			</Stack>
		</Stack>
	);
}

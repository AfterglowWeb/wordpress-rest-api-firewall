import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AllowedIps from '../Firewall/IpFilter/AllowedIps';
import AllowedOrigins from '../Firewall/IpFilter/AllowedOrigins';
import HttpMethodsSelector from '../Firewall/Users/HttpMethodsSelector';
import { RateLimitFields } from '../Firewall/Users/RateLimit';
import { AUTH_METHODS } from '../Firewall/Users/AuthManager';

export default function ApplicationEditorSettings( {
	title,
	setTitle,
	description,
	setDescription,
	appAllowedIps,
	setAppAllowedIps,
	allowedOrigins,
	setAllowedOrigins,
	appAllowedAuthMethods,
	setAppAllowedAuthMethods,
	appDefaultHttpMethods,
	setAppDefaultHttpMethods,
	rateLimitRequests,
	setRateLimitRequests,
	rateLimitWindow,
	setRateLimitWindow,
	rateLimitReleaseSeconds,
	setRateLimitReleaseSeconds,
	rateLimitBlacklistAfter,
	setRateLimitBlacklistAfter,
	rateLimitBlacklistWindow,
	setRateLimitBlacklistWindow,
	rateLimitEnabled,
	setRateLimitEnabled,
} ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack spacing={ 3 } maxWidth={ 780 } p={ { xs: 2, sm: 4 } }>

			<Stack spacing={ 3 }>
				<TextField
					label={ __( 'Title', 'rest-api-firewall' ) }
					value={ title }
					onChange={ ( e ) => setTitle( e.target.value ) }
					size="small"
				/>
				<TextField
					label={ __( 'Description', 'rest-api-firewall' ) }
					value={ description }
					onChange={ ( e ) => setDescription( e.target.value ) }
					size="small"
					multiline
					rows={ 3 }
					placeholder={ __(
						'Optional notes about this application, its purpose, or linked services.',
						'rest-api-firewall'
					) }
				/>
			</Stack>

			<Divider />

			<Stack spacing={ 3 }>

				<Stack spacing={ 0.75 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Allowed IPs', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{ __( 'In whitelist mode, only these IPs can access this application. Users can be restricted further beyond this list.', 'rest-api-firewall' ) }
					</Typography>
					<AllowedIps
						inline
						value={ appAllowedIps }
						onChange={ setAppAllowedIps }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 0.75 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Allowed Origins', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{ __( 'Restrict requests by Origin header. Combine with IP whitelisting for stronger security.', 'rest-api-firewall' ) }
					</Typography>
					<AllowedOrigins
						inline
						value={ allowedOrigins }
						onChange={ setAllowedOrigins }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 0.75 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Allowed Auth Methods', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{ __( 'Auth methods available to users of this application. Users can only use methods enabled here.', 'rest-api-firewall' ) }
					</Typography>
					<Stack direction="row" flexWrap="wrap" gap={ 1 }>
						{ AUTH_METHODS.filter( ( m ) => m.value !== 'any' ).map( ( method ) => (
							<FormControlLabel
								key={ method.value }
								control={
									<Checkbox
										size="small"
										checked={ appAllowedAuthMethods && appAllowedAuthMethods.length > 0 && appAllowedAuthMethods.includes( method.value ) }
										onChange={ ( e ) => {
											const next = e.target.checked
												? [ ...appAllowedAuthMethods, method.value ]
												: appAllowedAuthMethods.filter( ( v ) => v !== method.value );
											setAppAllowedAuthMethods( next );
										} }
									/>
								}
								label={ <Typography variant="body2">{ method.label }</Typography> }
							/>
						) ) }
					</Stack>
				</Stack>

				<Divider />

				<Stack spacing={ 0.75 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Default HTTP Methods', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{ __( 'HTTP verbs allowed by default. Users can restrict to a subset but cannot add methods not enabled here.', 'rest-api-firewall' ) }
					</Typography>
					<HttpMethodsSelector
						value={ appDefaultHttpMethods }
						onChange={ setAppDefaultHttpMethods }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 3 }>
					<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
						<Box>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Rate Limit', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'Default request cap for this application. Users can set a stricter limit but cannot exceed this.', 'rest-api-firewall' ) }
							</Typography>
						</Box>
						<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ rateLimitEnabled }
								onChange={ ( e ) => setRateLimitEnabled( e.target.checked ) }
							/>
						}
						label={ __( 'Enable Rate Limiting', 'rest-api-firewall' ) }
						/>
					</Stack>
					
					<RateLimitFields
						values={ {
							max_requests:    rateLimitRequests,
							window_seconds:  rateLimitWindow,
							release_seconds: rateLimitReleaseSeconds,
							blacklist_after: rateLimitBlacklistAfter,
							blacklist_window: rateLimitBlacklistWindow,
							enabled:         rateLimitEnabled,
						} }
						onChange={ ( key, val ) => {
							const setters = {
								max_requests:    setRateLimitRequests,
								window_seconds:  setRateLimitWindow,
								release_seconds: setRateLimitReleaseSeconds,
								blacklist_after: setRateLimitBlacklistAfter,
								blacklist_window: setRateLimitBlacklistWindow,
								enabled:         setRateLimitEnabled,
							};
							setters[ key ]?.( val );
						} }
					/>
				</Stack>

			</Stack>

			<Divider />
		</Stack>
	);
}

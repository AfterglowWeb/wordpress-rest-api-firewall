import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

import AllowedIps from '../IpFilter/AllowedIps';
import AllowedOrigins from '../IpFilter/AllowedOrigins';
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
	mailSmtpEnabled,
	setMailSmtpEnabled,
	mailSmtpHost,
	setMailSmtpHost,
	mailSmtpPort,
	setMailSmtpPort,
	mailSmtpEncryption,
	setMailSmtpEncryption,
	mailSmtpAuth,
	setMailSmtpAuth,
	mailSmtpUsername,
	setMailSmtpUsername,
	mailSmtpPassword,
	setMailSmtpPassword,
	mailSmtpFromEmail,
	setMailSmtpFromEmail,
	mailSmtpFromName,
	setMailSmtpFromName,
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
					inputProps={ { maxLength: 100 } }
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
					inputProps={ { maxLength: 300 } }
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

				<Divider />

				<Stack spacing={ 3 }>
					<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
						<Box>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Email SMTP Configuration', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'Configure SMTP settings for sending email notifications.', 'rest-api-firewall' ) }
							</Typography>
						</Box>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ mailSmtpEnabled }
									onChange={ ( e ) => setMailSmtpEnabled( e.target.checked ) }
								/>
							}
							label={ __( 'Enable SMTP', 'rest-api-firewall' ) }
						/>
					</Stack>

					{ mailSmtpEnabled && (
						<Stack spacing={ 2 }>
							<TextField
								label={ __( 'SMTP Host', 'rest-api-firewall' ) }
								value={ mailSmtpHost }
								onChange={ ( e ) => setMailSmtpHost( e.target.value ) }
								size="small"
								placeholder="smtp.example.com"
							/>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={ 2 }>
								<TextField
									label={ __( 'Port', 'rest-api-firewall' ) }
									value={ mailSmtpPort }
									onChange={ ( e ) => setMailSmtpPort( e.target.value ) }
									size="small"
									type="number"
									sx={ { flex: 1 } }
								/>
								<TextField
									select
									label={ __( 'Encryption', 'rest-api-firewall' ) }
									value={ mailSmtpEncryption }
									onChange={ ( e ) => setMailSmtpEncryption( e.target.value ) }
									size="small"
									sx={ { flex: 1 } }
								>
									<MenuItem value="tls">{ __( 'TLS', 'rest-api-firewall' ) }</MenuItem>
									<MenuItem value="ssl">{ __( 'SSL', 'rest-api-firewall' ) }</MenuItem>
									<MenuItem value="">{ __( 'None', 'rest-api-firewall' ) }</MenuItem>
								</TextField>
							</Stack>
							<FormControlLabel
								control={
									<Checkbox
										size="small"
										checked={ mailSmtpAuth }
										onChange={ ( e ) => setMailSmtpAuth( e.target.checked ) }
									/>
								}
								label={ <Typography variant="body2">{ __( 'Require Authentication', 'rest-api-firewall' ) }</Typography> }
							/>
							{ mailSmtpAuth && (
								<Stack spacing={ 2 }>
									<TextField
										label={ __( 'Username', 'rest-api-firewall' ) }
										value={ mailSmtpUsername }
										onChange={ ( e ) => setMailSmtpUsername( e.target.value ) }
										size="small"
									/>
									<TextField
										label={ __( 'Password', 'rest-api-firewall' ) }
										value={ mailSmtpPassword }
										onChange={ ( e ) => setMailSmtpPassword( e.target.value ) }
										size="small"
										type="password"
									/>
								</Stack>
							) }
							<Divider sx={ { my: 1 } } />
							<TextField
								label={ __( 'From Email', 'rest-api-firewall' ) }
								value={ mailSmtpFromEmail }
								onChange={ ( e ) => setMailSmtpFromEmail( e.target.value ) }
								size="small"
								placeholder="noreply@example.com"
							/>
							<TextField
								label={ __( 'From Name', 'rest-api-firewall' ) }
								value={ mailSmtpFromName }
								onChange={ ( e ) => setMailSmtpFromName( e.target.value ) }
								size="small"
								placeholder={ __( 'Your Site Name', 'rest-api-firewall' ) }
							/>
						</Stack>
					) }
				</Stack>

			</Stack>

			<Divider />
		</Stack>
	);
}

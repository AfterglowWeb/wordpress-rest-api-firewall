import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import AllowedIps from '../../IpFilter/AllowedIps';

import { JwtConfig } from './AuthManager';

import { RateLimitFields } from './RateLimit';
import Tooltip from '@mui/material/Tooltip';

export default function RestApiSingleUser( { form, setField } ) {
	const { __, sprintf } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const nonce = adminData?.nonce;

	const [ restApiUser, setRestApiUser ] = useState( [] );
	const [ allowedIps, setAllowedIps ] = useState( [] );

	const [ saving, setSaving ] = useState( false );
	const [ settingsLoaded, setSettingsLoaded ] = useState( false );
	const [ rateLimitFields, setRateLimitFields ] = useState( {
		rateLimitRequests:       form.rate_limit || 30,
		rateLimitWindow:         form.rate_limit_time || 60,
		rateLimitReleaseSeconds: form.rate_limit_release || 300,
		rateLimitBlacklistAfter: form.rate_limit_blacklist_after || 0,
		rateLimitBlacklistWindow: form.rate_limit_blacklist_window || 3600,
		rateLimitEnabled:        form.rate_limit_enabled || false,
	} );

	const adminUrl = adminData?.ajaxurl?.split( 'admin-ajax.php' )[ 0 ] || '';
	const usersPageUrl = `${ adminUrl }users.php`;

	useEffect( () => {
		if ( Array.isArray( adminData?.users ) && form.firewall_user_id ) {
			const currentUser = adminData.users.filter(
				( user ) => form.firewall_user_id === user.value
			);
			if ( currentUser && currentUser.length > 0 ) {
				setRestApiUser( currentUser[ 0 ] );
			}
		}
	}, [ adminData?.users, form.firewall_user_id ] );

	useEffect( () => {
		if ( ! adminData?.ajaxurl || ! nonce ) return;
		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( { action: 'get_firewall_global_settings', nonce } ),
		} )
			.then( ( res ) => res.json() )
			.then( ( result ) => {
				if ( result?.success && result?.data ) {
					setAllowedIps( result.data.allowed_ips || [] );

					setRateLimitFields( {
						rateLimitRequests:       result.data.rate_limit || 30,
						rateLimitWindow:         result.data.rate_limit_time || 60,
						rateLimitReleaseSeconds: result.data.rate_limit_release || 300,
						rateLimitBlacklistAfter: result.data.rate_limit_blacklist_after || 0,
						rateLimitBlacklistWindow: result.data.rate_limit_blacklist_window || 3600,
						rateLimitEnabled:        result.data.rate_limit_enabled || false,
					} );
				}
				setSettingsLoaded( true );
			} )
			.catch( () => setSettingsLoaded( true ) );
	}, [ adminData?.ajaxurl, nonce ] );

	const saveSetting = useCallback( async ( field, value ) => {
		setSaving( true );
		try {
			await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'save_firewall_global_settings',
					nonce,
					field,
					value: JSON.stringify( value ),
				} ),
			} );
		} catch {} // eslint-disable-line no-empty
		setSaving( false );
	}, [ adminData?.ajaxurl, nonce ] );

	const jwtConfig = {
		algorithm: form.firewall_jwt_algorithm || 'RS256',
		public_key: form.firewall_jwt_public_key || '',
		audience: form.firewall_jwt_audience || '',
		issuer: form.firewall_jwt_issuer || '',
	};

	const handleJwtConfigChange = ( key, value ) => {
		setField( 'firewall_jwt_' + key, value );
	};

	return (

		<Stack spacing={ 3 } p={ 4 } sx={ { maxWidth: 800 } }>
			
			<Stack
				direction={ { xs: 'column', lg: 'row' } }
				gap={ 2 }
				justifyContent={ 'space-between' }
			>
				<FormControl sx={ { flex: 1, maxWidth: 270 } }>
				<InputLabel id="user-id-label">
					{ __( 'REST API User', 'rest-api-firewall' ) }
				</InputLabel>
				<Select
					labelId="user-id-label"
					id="firewall_user_id"
					name="firewall_user_id"
					value={ form.firewall_user_id || 0 }
					label={ __( 'REST API User', 'rest-api-firewall' ) }
					onChange={ setField }
				>
					<MenuItem value={ 0 }>
						<em>{ __( 'Select User', 'rest-api-firewall' ) }</em>
					</MenuItem>
					{ adminData?.users &&
						adminData.users.length > 0 &&
						adminData.users.map( ( user ) =>
							user.value && user.label ? (
								<MenuItem
									key={ user.value }
									value={ user.value }
								>
									{ user.label }
								</MenuItem>
							) : null
						) }
				</Select>
				<FormHelperText>
					{ form.firewall_user_id &&
					restApiUser &&
					restApiUser?.label &&
					restApiUser?.admin_url ? (
						<>
							<span>
								{ sprintf(
									__(
										'Restrict authentication to %s,',
										'rest-api-firewall'
									),
									restApiUser.label
								) }
							</span>
							<Typography
								component="a"
								href={ restApiUser.admin_url }
								variant="body.2"
								target="_blank"
								sx={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									px: '4px',
									fontSize: '12px',
								} }
							>
								{ __( 'user profile', 'rest-api-firewall' ) }
								<OpenInNewIcon fontSize="inherit" />
							</Typography>
						</>
					) : (
						<>
							<span>
								{ __(
									'Restrict authentication to one user. Create an application password first in',
									'rest-api-firewall'
								) }
							</span>
							<Typography
								component="a"
								href={ usersPageUrl }
								variant="body.2"
								target="_blank"
								sx={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									pl: '4px',
									fontSize: '12px',
								} }
							>
								{ __( 'users list', 'rest-api-firewall' ) }
								<OpenInNewIcon fontSize="inherit" />
							</Typography>
						</>
					) }
				</FormHelperText>
			</FormControl>
			</Stack>

			<Divider />

			<Stack spacing={ 3 }>
				<Stack spacing={ 0 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Authentication Method', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{ __( 'Choose how clients authenticate to the REST API.', 'rest-api-firewall' ) }
					</Typography>
				</Stack>
				<FormControl size="small" sx={ { maxWidth: 280 } }>
					<InputLabel>
						{ __( 'Authentication Method', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						name="firewall_auth_method"
						value={ form.firewall_auth_method || 'wp_auth' }
						label={ __( 'Authentication Method', 'rest-api-firewall' ) }
						onChange={ setField }
					>
						<MenuItem value="wp_auth">
							{ __( 'WordPress Application Password', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="jwt">
							{ __( 'JWT', 'rest-api-firewall' ) }
						</MenuItem>
					</Select>
				</FormControl>
				{ form.firewall_auth_method === 'jwt' && (
					<JwtConfig config={ jwtConfig } onChange={ handleJwtConfigChange } />
				) }
			</Stack>
	
			<Divider />

		{ hasValidLicense ? (
			<Stack spacing={ 3 } sx={ { maxWidth: 760 } }>
				
				<Stack spacing={ 0 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Allowed IPs', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{ __( 'Only authorized requests from these IPs will be accepted.', 'rest-api-firewall' ) }
					</Typography>
				</Stack>

				<AllowedIps
					inline
					value={ allowedIps || [] }
					onChange={ setAllowedIps }
					onSave={ () => saveSetting( 'allowed_ips', allowedIps ) }
					saving={ saving }
				/>

				
			</Stack>
		) : (
			<Stack
				spacing={ 2 }
				sx={ {
					p: 3,
					border: '1px dashed',
					borderColor: 'divider',
					borderRadius: 1,
					bgcolor: 'action.hover',
					maxWidth: 760,
				} }
			>
				<Stack direction="row" alignItems="center" spacing={ 1 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'IP & Origin Filtering', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="caption" color="primary.main" sx={ { fontWeight: 600 } }>
						{ __( '— Pro Feature', 'rest-api-firewall' ) }
					</Typography>
				</Stack>
				<Typography variant="body2" color="text.secondary">
					{ __( 'Control REST API access by whitelisting specific IP addresses and origins. Available in the Pro tier with per-application configuration.', 'rest-api-firewall' ) }
				</Typography>
				<Stack spacing={ 0.75 }>
					<Stack direction="row" spacing={ 1 } alignItems="flex-start">
						<Typography variant="body2" color="text.disabled" sx={ { flexShrink: 0, mt: '1px' } }>
							›
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{ __( 'Whitelist IP addresses with full CIDR support', 'rest-api-firewall' ) }
						</Typography>
					</Stack>
					<Stack direction="row" spacing={ 1 } alignItems="flex-start">
						<Typography variant="body2" color="text.disabled" sx={ { flexShrink: 0, mt: '1px' } }>
							›
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{ __( 'Control CORS with allowed origins configuration', 'rest-api-firewall' ) }
						</Typography>
					</Stack>
					<Stack direction="row" spacing={ 1 } alignItems="flex-start">
						<Typography variant="body2" color="text.disabled" sx={ { flexShrink: 0, mt: '1px' } }>
							›
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{ __( 'Per-application isolation for multi-tenant setups', 'rest-api-firewall' ) }
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		) }

		<Divider />

		<Stack spacing={ 3 }>

			<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
					<Box>
						<Typography variant="subtitle1" fontWeight={ 600 }>
							{ __( 'Rate Limit', 'rest-api-firewall' ) }
						</Typography>
					</Box>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ rateLimitFields.rateLimitEnabled }
								onChange={ ( e ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitEnabled: e.target.checked } ) ) }
							/>
						}
						label={ __( 'Enable', 'rest-api-firewall' ) }
						sx={ { m: 0 } }
					/>
				</Stack>

				<RateLimitFields
					values={ {
						max_requests:    rateLimitFields.rateLimitRequests,
						window_seconds:  rateLimitFields.rateLimitWindow,
						release_seconds: rateLimitFields.rateLimitReleaseSeconds,
						blacklist_after: rateLimitFields.rateLimitBlacklistAfter,
						blacklist_window: rateLimitFields.rateLimitBlacklistWindow,
						enabled:         rateLimitFields.rateLimitEnabled,
					} }
					onChange={ ( key, val ) => {
						const setters = {
							max_requests:    ( v ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitRequests: v } ) ),
							window_seconds:  ( v ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitWindow: v } ) ),
							release_seconds: ( v ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitReleaseSeconds: v } ) ),
							blacklist_after: ( v ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitBlacklistAfter: v } ) ),
							blacklist_window: ( v ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitBlacklistWindow: v } ) ),
							enabled:         ( v ) => setRateLimitFields( ( prev ) => ( { ...prev, rateLimitEnabled: v } ) ),
						};
						if ( setters[ key ] ) {
							setters[ key ]?.( val );
						}
					} }
				/>

			</Stack>
		</Stack>
	);
}

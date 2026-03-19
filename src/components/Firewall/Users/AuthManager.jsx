import { useState, useEffect } from '@wordpress/element';

import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export const AUTH_METHODS = [
	{ value: 'any', label: 'Any (no restriction)' },
	{ value: 'jwt', label: 'JWT' },
	{ value: 'oauth', label: 'OAuth 2.0', comingSoon: true },
	{ value: 'wp_auth', label: 'WordPress Application Password' },
];

const JWT_ALGORITHMS = [
	'HS256',
	'HS384',
	'HS512',
	'RS256',
	'RS384',
	'RS512',
	'ES256',
];

export function JwtConfig( { config, onChange } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack spacing={ 2 }>
			<Stack
				direction={ { xs: 'column', sm: 'row' } }
				spacing={ 2 }
				flexWrap="wrap"
			>
				<FormControl size="small" sx={ { minWidth: 160 } }>
					<InputLabel>
						{ __( 'Algorithm', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						value={ config.algorithm || 'RS256' }
						onChange={ ( e ) =>
							onChange( 'algorithm', e.target.value )
						}
						label={ __( 'Algorithm', 'rest-api-firewall' ) }
					>
						{ JWT_ALGORITHMS.map( ( alg ) => (
							<MenuItem key={ alg } value={ alg }>
								{ alg }
							</MenuItem>
						) ) }
					</Select>
				</FormControl>

				<TextField
					label={ __( 'Audience', 'rest-api-firewall' ) }
					size="small"
					value={ config.audience || '' }
					onChange={ ( e ) => onChange( 'audience', e.target.value ) }
					placeholder="https://api.example.com"
					sx={ { maxWidth: 280 } }
					helperText={ __(
						'Expected aud claim (optional)',
						'rest-api-firewall'
					) }
				/>

				<TextField
					label={ __( 'Issuer', 'rest-api-firewall' ) }
					size="small"
					value={ config.issuer || '' }
					onChange={ ( e ) => onChange( 'issuer', e.target.value ) }
					placeholder="https://auth.example.com"
					sx={ { maxWidth: 280 } }
					helperText={ __(
						'Expected iss claim (optional)',
						'rest-api-firewall'
					) }
				/>
			</Stack>

			<TextField
				label={ __( 'Public Key / Secret', 'rest-api-firewall' ) }
				size="small"
				multiline
				rows={ 5 }
				value={ config.public_key || '' }
				onChange={ ( e ) => onChange( 'public_key', e.target.value ) }
				placeholder={
					'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
				}
				helperText={ __(
					'PEM public key for RS*/ES* algorithms, or shared secret for HS* algorithms.',
					'rest-api-firewall'
				) }
				inputProps={ {
					sx: { fontFamily: 'monospace', fontSize: '0.8rem' },
				} }
			/>
		</Stack>
	);
}

function OAuthConfig( { config, onChange } ) {
	const { __ } = wp.i18n || {};
	const [ showSecret, setShowSecret ] = useState( false );

	return (
		<Stack spacing={ 2 }>
			<Stack
				direction={ { xs: 'column', sm: 'row' } }
				spacing={ 2 }
				flexWrap="wrap"
			>
				<TextField
					label={ __( 'Client ID', 'rest-api-firewall' ) }
					size="small"
					value={ config.client_id || '' }
					onChange={ ( e ) =>
						onChange( 'client_id', e.target.value )
					}
					sx={ { maxWidth: 280 } }
				/>

				<TextField
					label={ __( 'Client Secret', 'rest-api-firewall' ) }
					size="small"
					type={ showSecret ? 'text' : 'password' }
					value={ config.client_secret || '' }
					onChange={ ( e ) =>
						onChange( 'client_secret', e.target.value )
					}
					sx={ { maxWidth: 280 } }
					InputProps={ {
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									size="small"
									onClick={ () =>
										setShowSecret( ( v ) => ! v )
									}
									edge="end"
								>
									{ showSecret ? (
										<VisibilityOffIcon fontSize="small" />
									) : (
										<VisibilityIcon fontSize="small" />
									) }
								</IconButton>
							</InputAdornment>
						),
					} }
				/>
			</Stack>

			<TextField
				label={ __( 'Token Endpoint', 'rest-api-firewall' ) }
				size="small"
				value={ config.token_endpoint || '' }
				onChange={ ( e ) =>
					onChange( 'token_endpoint', e.target.value )
				}
				placeholder="https://auth.example.com/oauth/token"
				sx={ { maxWidth: 440 } }
				helperText={ __(
					'OAuth 2.0 token endpoint URL',
					'rest-api-firewall'
				) }
			/>

			<TextField
				label={ __( 'Required Scopes', 'rest-api-firewall' ) }
				size="small"
				value={ config.scopes || '' }
				onChange={ ( e ) => onChange( 'scopes', e.target.value ) }
				placeholder="read write"
				sx={ { maxWidth: 280 } }
				helperText={ __(
					'Space-separated list of required OAuth scopes',
					'rest-api-firewall'
				) }
			/>
		</Stack>
	);
}

function WpAuthInfo() {
	const { __ } = wp.i18n || {};

	return (
		<Alert severity="info" sx={ { maxWidth: 560 } }>
			{ __(
				"WordPress Application Passwords are managed in the user's WordPress profile. The user must generate an Application Password under Users → Edit → Application Passwords. No additional configuration is required here.",
				'rest-api-firewall'
			) }
		</Alert>
	);
}

export default function AuthManager( {
	authMethod,
	onAuthMethodChange,
	authConfig,
	onAuthConfigChange,
	allowedAuthMethods = [],
} ) {
	const { __ } = wp.i18n || {};

	const noEnforcement = allowedAuthMethods.length === 0;
	const singleEnforcement = allowedAuthMethods.length === 1;
	const multiEnforcement = allowedAuthMethods.length > 1;

	useEffect( () => {
		if ( singleEnforcement && authMethod !== allowedAuthMethods[ 0 ] ) {
			onAuthMethodChange( allowedAuthMethods[ 0 ] );
		}
	}, [ allowedAuthMethods.join( ',' ) ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const visibleMethods = noEnforcement
		? AUTH_METHODS.map( ( m ) =>
				m.value === 'any'
					? { ...m, label: __( 'No Authentication', 'rest-api-firewall' ) }
					: m
		  )
		: AUTH_METHODS.filter( ( m ) => allowedAuthMethods.includes( m.value ) );

	const selectValue =
		multiEnforcement && ( authMethod === 'any' || ! allowedAuthMethods.includes( authMethod ) )
			? ''
			: authMethod;

	const updateConfig = ( key, value ) => {
		onAuthConfigChange( { ...authConfig, [ key ]: value } );
	};

	const renderValue = ( value ) => {
		const method = visibleMethods.find( ( m ) => m.value === value );
		return method ? method.label : ( value || __( 'Select…', 'rest-api-firewall' ) );
	};

	return (
		<Stack spacing={ 2 }>
			<FormControl size="small" sx={ { maxWidth: 280 } }>
				<InputLabel>
					{ __( 'Select Authentication Method', 'rest-api-firewall' ) }
				</InputLabel>
				<Select
					value={ selectValue }
					onChange={ ( e ) => onAuthMethodChange( e.target.value ) }
					label={ __( 'Select Authentication Method', 'rest-api-firewall' ) }
					disabled={ singleEnforcement }
					displayEmpty={ multiEnforcement }
					renderValue={ renderValue }
				>
					{ visibleMethods.map( ( opt ) => (
						<MenuItem key={ opt.value } value={ opt.value } disabled={ !! opt.comingSoon }>
							<Stack direction="row" alignItems="center" gap={ 1 }>
								{ opt.label }
								{ opt.comingSoon && (
									<Tooltip title={ __( 'Coming soon', 'rest-api-firewall' ) } placement="right">
										<Chip label={ __( 'Soon', 'rest-api-firewall' ) } size="small" sx={ { height: 16, fontSize: '0.65rem' } } />
									</Tooltip>
								) }
							</Stack>
						</MenuItem>
					) ) }
				</Select>
			</FormControl>

			{ authMethod === 'jwt' && (
				<JwtConfig config={ authConfig } onChange={ updateConfig } />
			) }
			{ authMethod === 'oauth' && (
				<OAuthConfig config={ authConfig } onChange={ updateConfig } />
			) }
			{ authMethod === 'wp_auth' && <WpAuthInfo /> }
		</Stack>
	);
}

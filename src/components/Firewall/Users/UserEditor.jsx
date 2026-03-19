import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';

import useProActions from '../../../hooks/useProActions';
import formatDate from '../../../utils/formatDate';

import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AuthManager from './AuthManager';
import LoadingMessage from '../../LoadingMessage';
import useRegisterToolbar from '../../../hooks/useRegisterToolbar';
import AllowedIps from '../IpFilter/AllowedIps';
import AllowedOrigins from '../IpFilter/AllowedOrigins';
import HttpMethodsSelector from './HttpMethodsSelector';
import { UserRateLimitFields } from './RateLimit';

function SectionHeader( { title, description } ) {
	return (
		<Box>
			<Typography variant="subtitle1" fontWeight={ 600 }>
				{ title }
			</Typography>
			{ description && (
				<Typography variant="body2" color="text.secondary">
					{ description }
				</Typography>
			) }
		</Box>
	);
}

export default function UserEditor( { user, onBack, appSettings = {} } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId, setDirtyFlag } = useApplication();

	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! user.id;

	// Snapshot of the last-saved values — used to compute isDirty.
	const savedRef = useRef( null );

	// Stable refs for handlers that close over state (prevents stale closures in toolbar).
	const handleSaveRef = useRef( null );
	const handleDeleteRef = useRef( null );

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ wpUserId, setWpUserId ] = useState( '' );
	const [ title, setTitle ] = useState( user.display_name || '' );
	const [ author, setAuthor ] = useState( user.author_name || '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ enabled, setEnabled ] = useState( !! user.enabled );
	const [ authMethod, setAuthMethod ] = useState( user.auth_method || 'any' );
	const [ authConfig, setAuthConfig ] = useState( user.auth_config || {} );
	const [ allowedMethods, setAllowedMethods ] = useState(
		user.allowed_methods || [ 'get' ]
	);
	const [ rateLimitRequests, setRateLimitRequests ] = useState(
		user.rate_limit_max_requests ?? 100
	);
	const [ rateLimitWindow, setRateLimitWindow ] = useState(
		user.rate_limit_window_seconds ?? 60
	);
	const [ rateLimitRelease, setRateLimitRelease ] = useState(
		user.rate_limit_release_seconds ?? 300
	);
	const [ rateLimitBlacklistAfter, setRateLimitBlacklistAfter ] = useState(
		user.rate_limit_blacklist_after ?? 5
	);
	const [ rateLimitBlacklistWindow, setRateLimitBlacklistWindow ] = useState(
		user.rate_limit_blacklist_window ?? 3600
	);
	const [ rateLimitEnabled, setRateLimitEnabled ] = useState( user.rate_limit_enabled !== false );
	const [ userAllowedIps, setUserAllowedIps ] = useState( user.allowed_ips || [] );
	const [ userAllowedOrigins, setUserAllowedOrigins ] = useState( user.allowed_origins || [] );

	const appAllowedAuthMethods = appSettings?.allowed_auth_methods || [];
	const appRateLimit = appSettings?.rate_limit || {};

	// True only when form values have diverged from the last saved snapshot.
	const isDirty = useMemo( () => {
		if ( isNew ) {
			return !! wpUserId;
		}
		if ( ! savedRef.current ) {
			return false;
		}
		const s = savedRef.current;
		return (
			enabled !== s.enabled ||
			authMethod !== s.authMethod ||
			JSON.stringify( authConfig ) !== s.authConfigJson ||
			JSON.stringify( allowedMethods ) !== s.allowedMethodsJson ||
			rateLimitEnabled !== s.rateLimitEnabled ||
			rateLimitRequests !== s.rateLimitRequests ||
			rateLimitWindow !== s.rateLimitWindow ||
			rateLimitRelease !== s.rateLimitRelease ||
			rateLimitBlacklistAfter !== s.rateLimitBlacklistAfter ||
			rateLimitBlacklistWindow !== s.rateLimitBlacklistWindow ||
			JSON.stringify( userAllowedIps ) !== s.allowedIpsJson ||
			JSON.stringify( userAllowedOrigins ) !== s.allowedOriginsJson
		);
	}, [
		isNew, wpUserId, enabled, authMethod, authConfig, allowedMethods,
		rateLimitEnabled, rateLimitRequests, rateLimitWindow, rateLimitRelease,
		rateLimitBlacklistAfter, rateLimitBlacklistWindow, userAllowedIps, userAllowedOrigins,
	] );

	useEffect( () => {
		setDirtyFlag(
			isDirty
				? { has: true, message: __( 'You are editing a user. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: { has: false, message: '' }
		);
	}, [ isDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	// Build a snapshot from current state (captured in closure at call time).
	const buildSnapshot = () => ( {
		enabled,
		authMethod,
		authConfigJson: JSON.stringify( authConfig ),
		allowedMethodsJson: JSON.stringify( allowedMethods ),
		rateLimitEnabled,
		rateLimitRequests,
		rateLimitWindow,
		rateLimitRelease,
		rateLimitBlacklistAfter,
		rateLimitBlacklistWindow,
		allowedIpsJson: JSON.stringify( userAllowedIps ),
		allowedOriginsJson: JSON.stringify( userAllowedOrigins ),
	} );

	const loadEntry = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_user_entry',
					nonce,
					id: user.id,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				const e = result.data.entry;
				setTitle( e.display_name || '' );
				setAuthor( e.author_name || '' );
				setEnabled( !! e.enabled );
				setDateCreated(
					formatDate( e.date_created, adminData.date_format, adminData.time_format )
				);
				setDateModified(
					formatDate( e.date_modified, adminData.date_format, adminData.time_format )
				);
				setAuthMethod( e.auth_method || 'any' );
				setAuthConfig( e.auth_config || {} );
				setAllowedMethods( e.allowed_methods || [ 'get' ] );
				setRateLimitRequests( e.rate_limit_max_requests ?? 100 );
				setRateLimitWindow( e.rate_limit_window_seconds ?? 60 );
				setRateLimitRelease( e.rate_limit_release_seconds ?? 300 );
				setRateLimitBlacklistAfter( e.rate_limit_blacklist_after ?? 0 );
				setRateLimitBlacklistWindow( e.rate_limit_blacklist_window ?? 0 );
				setRateLimitEnabled( e.rate_limit_enabled !== false );
				setUserAllowedIps( e.allowed_ips || [] );
				setUserAllowedOrigins( e.allowed_origins || [] );

				// Save the snapshot — isDirty will compute to false after this.
				savedRef.current = {
					enabled: !! e.enabled,
					authMethod: e.auth_method || 'any',
					authConfigJson: JSON.stringify( e.auth_config || {} ),
					allowedMethodsJson: JSON.stringify( e.allowed_methods || [ 'get' ] ),
					rateLimitEnabled: e.rate_limit_enabled !== false,
					rateLimitRequests: e.rate_limit_max_requests ?? 100,
					rateLimitWindow: e.rate_limit_window_seconds ?? 60,
					rateLimitRelease: e.rate_limit_release_seconds ?? 300,
					rateLimitBlacklistAfter: e.rate_limit_blacklist_after ?? 0,
					rateLimitBlacklistWindow: e.rate_limit_blacklist_window ?? 0,
					allowedIpsJson: JSON.stringify( e.allowed_ips || [] ),
					allowedOriginsJson: JSON.stringify( e.allowed_origins || [] ),
				};
			} else {
				setLoadError(
					result?.data?.message || __( 'Failed to load user', 'rest-api-firewall' )
				);
			}
		} catch ( err ) {
			setLoadError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, user.id ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		loadEntry();
	}, [ isNew, loadEntry ] );

	const commonPayload = {
		application_id: selectedApplicationId,
		enabled: enabled ? '1' : '0',
		auth_method: authMethod,
		auth_config: JSON.stringify( authConfig ),
		allowed_methods: JSON.stringify( allowedMethods ),
		rate_limit_enabled: rateLimitEnabled ? '1' : '0',
		allowed_ips: JSON.stringify( userAllowedIps ),
		allowed_origins: JSON.stringify( userAllowedOrigins ),
		rate_limit_max_requests: rateLimitEnabled ? String( parseInt( rateLimitRequests, 10 ) || 100 ) : '',
		rate_limit_window_seconds: rateLimitEnabled ? String( parseInt( rateLimitWindow, 10 ) || 60 ) : '',
		rate_limit_release: rateLimitEnabled ? String( parseInt( rateLimitRelease, 10 ) || 300 ) : '',
		rate_limit_blacklist_after: rateLimitEnabled ? String( parseInt( rateLimitBlacklistAfter, 10 ) || 0 ) : '',
		rate_limit_blacklist_window: rateLimitEnabled ? String( parseInt( rateLimitBlacklistWindow, 10 ) || 0 ) : '',
	};

	const handleSave = () => {
		if ( isNew ) {
			if ( ! wpUserId ) {
				return;
			}
			save(
				{
					action: 'add_user_entry',
					application_id: user.application_id,
					wp_user_id: wpUserId,
					...commonPayload,
				},
				{
					skipConfirm: true,
					successTitle: __( 'User Added', 'rest-api-firewall' ),
					successMessage: __( 'User added successfully.', 'rest-api-firewall' ),
					onSuccess: () => { clearDirty(); onBack(); },
				}
			);
		} else {
			const snapshotAtSave = buildSnapshot();
			save(
				{ action: 'update_user_entry', id: user.id, ...commonPayload },
				{
					skipConfirm: true,
					successTitle: __( 'User Saved', 'rest-api-firewall' ),
					successMessage: __( 'User settings saved successfully.', 'rest-api-firewall' ),
					onSuccess: () => { savedRef.current = snapshotAtSave; },
				}
			);
		}
	};

	const handleDelete = () => {
		remove(
			{ action: 'delete_user_entry', id: user.id },
			{
				confirmTitle: __( 'Delete User', 'rest-api-firewall' ),
				confirmMessage: __(
					'Are you sure you want to permanently delete this user? This action cannot be undone.',
					'rest-api-firewall'
				),
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				successTitle: __( 'User Deleted', 'rest-api-firewall' ),
				successMessage: __( 'The user has been removed.', 'rest-api-firewall' ),
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	};

	// Keep refs up to date so the stable toolbar handlers always call the latest version.
	handleSaveRef.current = handleSave;
	handleDeleteRef.current = handleDelete;

	const updateToolbar = useRegisterToolbar( {
		isNew,
		breadcrumb: [ __( 'User', 'rest-api-firewall' ) ],
		docPage: 'users',
		handleBack: () => { clearDirty(); onBack(); },
		handleSave: () => handleSaveRef.current?.(),
		handleDelete: () => handleDeleteRef.current?.(),
		setEnabled: isNew ? null : ( checked ) => setEnabled( checked ),
		enabled: isNew ? null : enabled,
	} );

	useEffect( () => {
		updateToolbar( {
			title,
			author,
			dateCreated,
			dateModified,
			saving,
			enabled: isNew ? null : enabled,
			canSave: isDirty,
			dirtyFlag: isDirty
				? { has: true, message: __( 'You are editing a user. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: null,
		} );
	}, [ title, author, dateCreated, dateModified, saving, enabled, isDirty, isNew ] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( loading ) {
		return <LoadingMessage />;
	}

	return (
		<Stack spacing={ 0 }>


			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack
				p={ { xs: 2, sm: 4 } }
				spacing={ 3 }
				sx={ { maxWidth: 760 } }
			>
				{ isNew && (
					<Stack spacing={ 2 }>
						<SectionHeader
							title={ __( 'WordPress User', 'rest-api-firewall' ) }
							description={ __( 'Select the WordPress user to link to this application.', 'rest-api-firewall' ) }
						/>
						<FormControl size="small" sx={ { maxWidth: 340 } } required>
							<InputLabel>
								{ __( 'WordPress User', 'rest-api-firewall' ) }
							</InputLabel>
							<Select
								value={ wpUserId }
								onChange={ ( e ) => {
									const selected = ( adminData?.users || [] ).find( ( u ) => u.value === e.target.value );
									setWpUserId( e.target.value );
									if ( selected ) setTitle( selected.label );
								} }
								label={ __( 'WordPress User', 'rest-api-firewall' ) }
							>
								{ ( adminData?.users || [] ).map( ( u ) => (
									<MenuItem key={ u.value } value={ u.value }>
										{ u.label }
									</MenuItem>
								) ) }
							</Select>
						</FormControl>

						<Divider />
					</Stack>
				) }

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed IPs', 'rest-api-firewall' ) }
						description={ __( 'Restrict this user to specific IP addresses. Must be within the application\'s allowed IPs.', 'rest-api-firewall' ) }
					/>
					<AllowedIps
						inline
						value={ userAllowedIps }
						onChange={ ( newIps ) => {
							const appIps = appSettings?.allowed_ips || [];
							setUserAllowedIps(
								appIps.length > 0 ? newIps.filter( ( ip ) => appIps.includes( ip ) ) : newIps
							);
						} }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed Origins', 'rest-api-firewall' ) }
						description={ __( 'Restrict this user to specific origins. Must be within the application\'s allowed origins.', 'rest-api-firewall' ) }
					/>
					<AllowedOrigins
						inline
						value={ userAllowedOrigins }
						onChange={ ( newOrigins ) => {
							const appOrigins = appSettings?.allowed_origins || [];
							setUserAllowedOrigins(
								appOrigins.length > 0 ? newOrigins.filter( ( o ) => appOrigins.includes( o ) ) : newOrigins
							);
						} }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Authentication Method', 'rest-api-firewall' ) }
					/>
					<AuthManager
						authMethod={ authMethod }
						onAuthMethodChange={ setAuthMethod }
						authConfig={ authConfig }
						onAuthConfigChange={ setAuthConfig }
						allowedAuthMethods={ appAllowedAuthMethods }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed HTTP Methods', 'rest-api-firewall' ) }
						description={ __( 'Which HTTP verbs this user is allowed to use against the API.', 'rest-api-firewall' ) }
					/>
					<HttpMethodsSelector
						value={ allowedMethods }
						onChange={ setAllowedMethods }
						allowedMethods={ appSettings?.default_http_methods || [] }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
						<SectionHeader
							title={ __( 'Rate Limiting', 'rest-api-firewall' ) }
							description={ __( 'Per-user request cap. When disabled, the application-level rate limit applies.', 'rest-api-firewall' ) }
						/>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ rateLimitEnabled }
									onChange={ ( e ) => setRateLimitEnabled( e.target.checked ) }
								/>
							}
							label=""
							sx={ { mr: 0 } }
						/>
					</Stack>
					{ rateLimitEnabled && (
						<UserRateLimitFields
							values={ {
								max_requests: rateLimitRequests,
								window_seconds: rateLimitWindow,
								release_seconds: rateLimitRelease,
								blacklist_after: rateLimitBlacklistAfter,
								blacklist_window: rateLimitBlacklistWindow,
							} }
							onChange={ ( key, val ) => {
								const setters = {
									max_requests: setRateLimitRequests,
									window_seconds: setRateLimitWindow,
									release_seconds: setRateLimitRelease,
									blacklist_after: setRateLimitBlacklistAfter,
									blacklist_window: setRateLimitBlacklistWindow,
								};
								setters[ key ]?.( val );
							} }
						/>
					) }
					{ ! rateLimitEnabled && appRateLimit.max_requests && (
						<Typography variant="body2" color="text.secondary">
							{ __( 'Using application default:', 'rest-api-firewall' ) }{ ' ' }
							{ appRateLimit.max_requests } { __( 'req /', 'rest-api-firewall' ) } { appRateLimit.window_seconds }s
						</Typography>
					) }
				</Stack>
			</Stack>
		</Stack>
	);
}

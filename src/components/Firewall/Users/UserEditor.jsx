import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';
import { useNavigation } from '../../../contexts/NavigationContext';

import useProActions from '../../../hooks/useProActions';
import formatDate from '../../../utils/formatDate';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AuthManager from './AuthManager';
import LoadingMessage from '../../LoadingMessage';
import useRegisterToolbar from '../../../hooks/useRegisterToolbar';
import HttpMethodsSelector from './HttpMethodsSelector';
import { RateLimitFields } from './RateLimit';

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
	const { navigate } = useNavigation();

	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! user.id;

	const [ savedSnapshot, setSavedSnapshot ] = useState( null );

	const handleSaveRef = useRef( null );
	const handleDeleteRef = useRef( null );

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ wpUserId, setWpUserId ] = useState( user.wp_user_id || '' );
	const [ title, setTitle ] = useState( user.title || '' );
	const [ displayName, setDisplayName ] = useState( user.display_name || '' );
	const [ description, setDescription ] = useState( user.description || '' );
	const [ author, setAuthor ] = useState( user.author_name || '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ enabled, setEnabled ] = useState( !! user.enabled );
	const [ authMethod, setAuthMethod ] = useState( user.auth_method || 'any' );
	const [ authConfig, setAuthConfig ] = useState( user.auth_config || {} );
	const [ allowedMethods, setAllowedMethods ] = useState(
		user.allowed_methods || [ 'get' ]
	);
	const appRateLimitDefaults = appSettings?.rate_limit || {};

	const [ rateLimitRequests, setRateLimitRequests ] = useState(
		user.rate_limit_max_requests ?? appRateLimitDefaults.max_requests ?? 100
	);
	const [ rateLimitWindow, setRateLimitWindow ] = useState(
		user.rate_limit_window_seconds ?? appRateLimitDefaults.window_seconds ?? 60
	);
	const [ rateLimitRelease, setRateLimitRelease ] = useState(
		user.rate_limit_release_seconds ?? appRateLimitDefaults.release_seconds ?? 300
	);
	const [ rateLimitBlacklistAfter, setRateLimitBlacklistAfter ] = useState(
		user.rate_limit_blacklist_after ?? appRateLimitDefaults.blacklist_after ?? 5
	);
	const [ rateLimitBlacklistWindow, setRateLimitBlacklistWindow ] = useState(
		user.rate_limit_blacklist_window ?? appRateLimitDefaults.blacklist_window ?? 3600
	);
	const [ rateLimitEnabled, setRateLimitEnabled ] = useState( user.rate_limit_enabled !== false );
	const [ userAllowedIps, setUserAllowedIps ] = useState( user.allowed_ips || [] );
	const [ userAllowedOrigins, setUserAllowedOrigins ] = useState( user.allowed_origins || [] );

	const appAllowedAuthMethods = appSettings?.allowed_auth_methods || [];

	const isDirty = useMemo( () => {
		if ( isNew ) {
			return !! wpUserId;
		}
		if ( ! savedSnapshot ) {
			return false;
		}
		const s = savedSnapshot;
		return (
			title !== s.title ||
			description !== s.description ||
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
		isNew, wpUserId, savedSnapshot, title, description, enabled, authMethod, authConfig, allowedMethods,
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

	const buildSnapshot = () => ( {
		title,
		description,
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
				setWpUserId( e.wp_user_id || '' );
				setTitle( e.title || '' );
				setDisplayName( e.display_name || '' );
				setDescription( e.description || '' );
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
				const appRl = appRateLimitDefaults;
				const rlRequests       = e.rate_limit_max_requests    ?? appRl.max_requests    ?? 100;
				const rlWindow         = e.rate_limit_window_seconds  ?? appRl.window_seconds  ?? 60;
				const rlRelease        = e.rate_limit_release_seconds ?? appRl.release_seconds ?? 300;
				const rlBlacklistAfter = e.rate_limit_blacklist_after  ?? appRl.blacklist_after ?? 5;
				const rlBlacklistWin   = e.rate_limit_blacklist_window ?? appRl.blacklist_window ?? 3600;

				setRateLimitRequests( rlRequests );
				setRateLimitWindow( rlWindow );
				setRateLimitRelease( rlRelease );
				setRateLimitBlacklistAfter( rlBlacklistAfter );
				setRateLimitBlacklistWindow( rlBlacklistWin );
				setRateLimitEnabled( e.rate_limit_enabled !== false );
				setUserAllowedIps( e.allowed_ips || [] );
				setUserAllowedOrigins( e.allowed_origins || [] );

				setSavedSnapshot( {
					title: e.title || '',
					description: e.description || '',
					enabled: !! e.enabled,
					authMethod: e.auth_method || 'any',
					authConfigJson: JSON.stringify( e.auth_config || {} ),
					allowedMethodsJson: JSON.stringify( e.allowed_methods || [ 'get' ] ),
					rateLimitEnabled: e.rate_limit_enabled !== false,
					rateLimitRequests:        rlRequests,
					rateLimitWindow:          rlWindow,
					rateLimitRelease:         rlRelease,
					rateLimitBlacklistAfter:  rlBlacklistAfter,
					rateLimitBlacklistWindow: rlBlacklistWin,
					allowedIpsJson: JSON.stringify( e.allowed_ips || [] ),
					allowedOriginsJson: JSON.stringify( e.allowed_origins || [] ),
				} );
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
		title: title,
		description,
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
					onSuccess: () => { setSavedSnapshot( snapshotAtSave ); },
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

	handleSaveRef.current = handleSave;
	handleDeleteRef.current = handleDelete;

	const updateToolbar = useRegisterToolbar( {
		isNew,
		breadcrumb: __( 'Users', 'rest-api-firewall' ),
		newEntryLabel: __( 'New User', 'rest-api-firewall' ),
		docPage: 'users',
		handleBack: () => { clearDirty(); onBack(); },
		handleSave: () => handleSaveRef.current?.(),
		handleDelete: () => handleDeleteRef.current?.(),
		setEnabled: isNew ? null : ( checked ) => setEnabled( checked ),
		enabled: isNew ? null : enabled,
	} );

	useEffect( () => {
		updateToolbar( {
			title: title || displayName,
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
	}, [ title, displayName, author, dateCreated, dateModified, saving, enabled, isDirty, isNew ] ); // eslint-disable-line react-hooks/exhaustive-deps

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
				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'WordPress User', 'rest-api-firewall' ) }
						description={ __( 'Select the WordPress user to link to this application.', 'rest-api-firewall' ) }
					/>
					<FormControl disabled={ ! isNew } size="small" sx={ { maxWidth: 340 } } required>
						<InputLabel id="wp-user-select-label">{ __( 'WordPress User', 'rest-api-firewall' ) }</InputLabel>
						<Select
							labelId="wp-user-select-label"
							value={ wpUserId }
							onChange={ ( e ) => {
								const selected = ( adminData?.users || [] ).find( ( u ) => u.value === e.target.value );
								setWpUserId( e.target.value );
								if ( selected ) setDisplayName( selected.label );
							} }
							label={ __( 'WordPress User', 'rest-api-firewall' ) }
							renderValue={ ( val ) => {
								const found = ( adminData?.users || [] ).find( ( u ) => u.value === val );
								return found?.label || displayName || val;
							} }
						>
							{ ( adminData?.users || [] ).map( ( u ) => (
								<MenuItem key={ u.value } value={ u.value }>
									{ u.label }
								</MenuItem>
							) ) }
						</Select>
					</FormControl>
				</Stack>

				<Divider />

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

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed IPs', 'rest-api-firewall' ) }
						description={ __( 'Restrict this user to a subset of the application\'s allowed IPs.', 'rest-api-firewall' ) }
					/>
					{ ( appSettings?.allowed_ips || [] ).length === 0 ? (
						<Link
							component="button"
							sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}
							variant="body2"
							onClick={ () => navigate( 'applications', selectedApplicationId ) }
						>
							{ __( 'Configure IPs in the application first', 'rest-api-firewall' ) }
						</Link>
					) : (
						<FormControl size="small" sx={ { maxWidth: 340 } }>
							<InputLabel>{ __( 'Allowed IPs', 'rest-api-firewall' ) }</InputLabel>
							<Select
								multiple
								value={ userAllowedIps }
								onChange={ ( e ) => setUserAllowedIps( e.target.value ) }
								input={ <OutlinedInput label={ __( 'Allowed IPs', 'rest-api-firewall' ) } /> }
								renderValue={ ( selected ) => (
									<Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 0.5 } }>
										{ selected.map( ( val ) => <Chip key={ val } label={ val } size="small" /> ) }
									</Box>
								) }
							>
								{ ( appSettings?.allowed_ips || [] ).map( ( ip ) => (
									<MenuItem key={ ip } value={ ip }>{ ip }</MenuItem>
								) ) }
							</Select>
						</FormControl>
					) }
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed Origins', 'rest-api-firewall' ) }
						description={ __( 'Restrict this user to a subset of the application\'s allowed origins.', 'rest-api-firewall' ) }
					/>
					{ ( appSettings?.allowed_origins || [] ).length === 0 ? (
						<Link
							component="button"
							sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}
							variant="body2"
							onClick={ () => navigate( 'applications', selectedApplicationId ) }
						>
							{ __( 'Configure origins in the application first', 'rest-api-firewall' ) }
						</Link>
					) : (
						<FormControl size="small" sx={ { maxWidth: 340 } }>
							<InputLabel>{ __( 'Allowed Origins', 'rest-api-firewall' ) }</InputLabel>
							<Select
								multiple
								value={ userAllowedOrigins }
								onChange={ ( e ) => setUserAllowedOrigins( e.target.value ) }
								input={ <OutlinedInput label={ __( 'Allowed Origins', 'rest-api-firewall' ) } /> }
								renderValue={ ( selected ) => (
									<Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 0.5 } }>
										{ selected.map( ( val ) => <Chip key={ val } label={ val } size="small" /> ) }
									</Box>
								) }
							>
								{ ( appSettings?.allowed_origins || [] ).map( ( origin ) => (
									<MenuItem key={ origin } value={ origin }>{ origin }</MenuItem>
								) ) }
							</Select>
						</FormControl>
					) }
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

					{ ! rateLimitEnabled && appRateLimitDefaults.max_requests && (
						<Typography variant="body2" color="text.secondary">
							{ __( 'Using application default:', 'rest-api-firewall' ) }{ ' ' }
							{ appRateLimitDefaults.max_requests } { __( 'req /', 'rest-api-firewall' ) } { appRateLimitDefaults.window_seconds }s
						</Typography>
					) }

					<RateLimitFields
						values={ {
							max_requests: rateLimitRequests,
							window_seconds: rateLimitWindow,
							release_seconds: rateLimitRelease,
							blacklist_after: rateLimitBlacklistAfter,
							blacklist_window: rateLimitBlacklistWindow,
							enabled: rateLimitEnabled,
						} }
						maxValues={ appRateLimitDefaults }
						onChange={ ( key, val ) => {
							if ( key === 'enabled' ) { setRateLimitEnabled( val ); return; }
							const appMax = appRateLimitDefaults[ key ];
							const numVal = Number( val );
							const clamped = appMax ? Math.min( numVal, appMax ) : numVal;
							const setters = {
								max_requests: setRateLimitRequests,
								window_seconds: setRateLimitWindow,
								release_seconds: setRateLimitRelease,
								blacklist_after: setRateLimitBlacklistAfter,
								blacklist_window: setRateLimitBlacklistWindow,
							};
							setters[ key ]?.( clamped );
						} }
					/>
		
					
				</Stack>
			</Stack>
		</Stack>
	);
}

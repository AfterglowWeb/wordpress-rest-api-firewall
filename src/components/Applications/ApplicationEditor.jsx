import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import ApiIcon from '@mui/icons-material/Api';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WebhookIcon from '@mui/icons-material/Webhook';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';

import formatDate from '../../utils/formatDate';
import { countAllCustomNodes } from '../Firewall/Routes/routesPolicyUtils';
import LoadingMessage from '../LoadingMessage';
import useRegisterToolbar from '../../hooks/useRegisterToolbar';
import ConfirmWithInputDialog from '../ConfirmWithInputDialog';
import AllowedIps from '../Firewall/IpFilter/AllowedIps';
import AllowedOrigins from '../Firewall/IpFilter/AllowedOrigins';
import HttpMethodsSelector from '../Firewall/Users/HttpMethodsSelector';
import { RateLimitFields } from '../Firewall/Users/RateLimit';
import { AUTH_METHODS } from '../Firewall/Users/AuthManager';

const DISABLE_BEHAVIOR_LABELS = {
	'404':      '404 Not Found',
	'410':      '410 Gone',
	'301_url':  '301 Custom URL',
	'301_page': '301 WP Page',
	'empty':    'Empty (no response)',
};

const MODULE_KEY = {
	1:  { module: 'users',          panelKey: 'user-rate-limiting',  optionKey: 'user_rate_limit_enabled' },
	2:  { module: 'routes_policy',  panelKey: 'per-route-settings',  optionKey: 'firewall_routes_policy_enabled' },
	3:  { module: 'ip_filter',      panelKey: 'ip-filtering',        optionKey: null },
	4:  { module: 'collections',    panelKey: 'collections',         optionKey: 'rest_collections_enabled' },
	5:  { module: 'models',         panelKey: 'models-properties',   optionKey: 'rest_models_enabled' },
	7:  { module: 'webhooks',       panelKey: 'webhook',             optionKey: 'webhooks_enabled' },
	8:  { module: 'mails',          panelKey: 'emails',              optionKey: 'mails_enabled' },
	12: { module: 'logs',           panelKey: 'logs',                optionKey: null },
	13: { module: 'automations',    panelKey: 'automations',         optionKey: 'automations_enabled' },
};

function PanelCard( { title, Icon, panel, module, onNavigate, enabled, onToggleEnabled, children } ) {
	return (
		<Paper
			variant="outlined"
			sx={ {
				borderRadius: 2,
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
				transition: 'border-color 0.15s',
				'&:hover': onNavigate ? { borderColor: 'primary.main' } : {},
			} }
		>
			<Stack 
			direction="row" 
			alignItems="center" 
			spacing={ 1 } 
			sx={{
				borderBottom: '1px solid',
				borderColor: 'divider',
				bgcolor: 'grey.50',
			}}>

				<Stack
					direction="row"
					flex={1}
					alignItems="center"
					spacing={ 1.5 }
					onClick={ () => onNavigate?.( panel ) }
					sx={ {
						py: 1.25,
						px: 1,
						cursor: onNavigate ? 'pointer' : 'default',
						transition: 'background-color 0.15s',
						'&:hover': onNavigate ? { bgcolor: 'action.hover' } : {},
					} }
				>
					{ Icon && (
						<Icon sx={ { fontSize: 17, color: 'text.primary' } } />
					) }
					<Typography variant="body2" fontWeight={ 700 } sx={ { flex: 1 } }>
						{ title }
					</Typography>
					
					{ onNavigate && (
						<ArrowForwardIosIcon sx={ { fontSize: 10, color: 'text.disabled', flexShrink: 0 } } />
					) }

				</Stack>

				{ onToggleEnabled !== undefined && (
					<Stack flexGrow={0} pr={1}>
					<Switch
						size="small"
						checked={ !! enabled }
						onChange={ ( e ) => {
							e.stopPropagation();
							onToggleEnabled( module, ! enabled );
						} }
						onClick={ ( e ) => e.stopPropagation() }
					/>
					</Stack>
				) }
			</Stack>

			<Box sx={ { p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 } }>
				{ children }
			</Box>
		</Paper>
	);
}

function UserRow( { user, onClick } ) {
	const { __ } = wp.i18n || {};
	const name = user.title || user.display_name || `User #${ user.wp_user_id }`;
	const methods = user.allowed_methods || [];
	const ips = user.allowed_ips || [];
	const origins = user.allowed_origins || [];
	const authMethod = user.auth_method && user.auth_method !== 'any' ? user.auth_method : null;

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			spacing={ 1 }
			onClick={ onClick }
			sx={ {
				py: 0.75,
				px: 0.5,
				borderRadius: 1,
				cursor: 'pointer',
				'&:hover': { bgcolor: 'action.hover' },
				'&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
			} }
		>
			<Box sx={ { minWidth: 0, flex: 1 } }>
				<Typography variant="caption" fontWeight={ 600 } display="block" noWrap>
					{ name }
				</Typography>
				<Stack direction="row" flexWrap="wrap" gap={ 0.5 } mt={ 0.5 }>
					{ authMethod && (
						<Chip label={ authMethod } size="small" variant="outlined" />
					) }
					{ methods.map( ( m ) => (
						<Chip key={ m } label={ m.toUpperCase() } size="small" color="primary" variant="outlined" sx={ { fontSize: 10 } } />
					) ) }
					{ ips.map( ( ip ) => (
						<Chip key={ ip } label={ ip } size="small" sx={ { fontFamily: 'monospace', fontSize: 10 } } />
					) ) }
					{ origins.map( ( o ) => (
						<Chip key={ o } label={ o } size="small" sx={ { fontFamily: 'monospace', fontSize: 10, maxWidth: 120 } } />
					) ) }
					{ ! authMethod && methods.length === 0 && ips.length === 0 && origins.length === 0 && (
						<Typography variant="caption" color="text.disabled">{ __( 'No restrictions', 'rest-api-firewall' ) }</Typography>
					) }
				</Stack>
			</Box>
			<ArrowForwardIosIcon sx={ { fontSize: 10, color: 'text.disabled', flexShrink: 0, mt: 0.5 } } />
		</Stack>
	);
}

function DataRow( { label, children } ) {
	return (
		<Stack direction="row" spacing={ 1 } py={1} alignItems="center">
			<Typography
				variant="caption"
				color="text.disabled"
				sx={ { flexShrink: 0 } }
			>
				{ label }
			</Typography>
			<Box sx={ { flex: 1, overflow: 'hidden', minWidth: 0 } }>
				{ children }
			</Box>
		</Stack>
	);
}

export default function ApplicationEditor( { application, onBack } ) {
	const { adminData, updateAdminData } = useAdminData();
	const { navigate } = useNavigation();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;

	const { __ } = wp.i18n || {};

	const { setDirtyFlag } = useApplication();
	const { save, remove, saving } = useProActions();

	const isNew = ! application.id;

	const handleSaveRef = useRef( null );
	const handleDeleteRef = useRef( null );

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	const handlePanelNavigate = useCallback(
		( panelNum ) => navigate( MODULE_KEY[ panelNum ]?.panelKey || '' ),
		[ navigate ]
	);
	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ title, setTitle ] = useState( application.title || '' );
	const [ enabled, setEnabled ] = useState( application.enabled ?? true );
	const [ description, setDescription ] = useState( '' );
	const [ ipFilter, setIpFilter ] = useState( { enabled: false, mode: 'blacklist' } );
	const [ ipFilterIps, setIpFilterIps ] = useState( [] );
	const [ allowedOrigins, setAllowedOrigins ] = useState( [] );
	const [ rateLimitRequests, setRateLimitRequests ] = useState( 100 );
	const [ rateLimitWindow, setRateLimitWindow ] = useState( 60 );
	const [ policyActive, setPolicyActive ] = useState(
		application.policy ?? false
	);

	const [ author, setAuthor ] = useState( '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ appUsers, setAppUsers ] = useState( [] );
	const [ activeTab, setActiveTab ] = useState( 0 );
	const [ routesCustomCount, setRoutesCustomCount ] = useState( null );

	const [ serverSettings, setServerSettings ] = useState( {} );
	const [ appAllowedIps, setAppAllowedIps ] = useState( [] );
	const [ appAllowedAuthMethods, setAppAllowedAuthMethods ] = useState( [] );
	const [ appDefaultHttpMethods, setAppDefaultHttpMethods ] = useState( [ 'get' ] );
	const [ rateLimitReleaseSeconds, setRateLimitReleaseSeconds ] = useState( 300 );
	const [ rateLimitBlacklistAfter, setRateLimitBlacklistAfter ] = useState( 5 );
	const [ rateLimitBlacklistWindow, setRateLimitBlacklistWindow ] = useState( 3600 );
	const [ rateLimitEnabled, setRateLimitEnabled ] = useState( true );

	const [ confirmDeleteOpen, setConfirmDeleteOpen ] = useState( false );
	const [ savedSnapshot, setSavedSnapshot ] = useState( null );

	const isDirty = useMemo( () => {
		if ( isNew ) return !! title.trim();
		if ( ! savedSnapshot ) return false;
		const s = savedSnapshot;
		return (
			title !== s.title ||
			enabled !== s.enabled ||
			description !== s.description ||
			JSON.stringify( appAllowedIps ) !== s.allowedIpsJson ||
			JSON.stringify( allowedOrigins ) !== s.allowedOriginsJson ||
			JSON.stringify( appAllowedAuthMethods ) !== s.allowedAuthMethodsJson ||
			JSON.stringify( appDefaultHttpMethods ) !== s.defaultHttpMethodsJson ||
			String( rateLimitRequests ) !== s.rateLimitRequests ||
			String( rateLimitWindow ) !== s.rateLimitWindow ||
			String( rateLimitReleaseSeconds ) !== s.rateLimitReleaseSeconds ||
			String( rateLimitBlacklistAfter ) !== s.rateLimitBlacklistAfter ||
			String( rateLimitBlacklistWindow ) !== s.rateLimitBlacklistWindow ||
			rateLimitEnabled !== s.rateLimitEnabled
		);
	}, [ isNew, savedSnapshot, title, enabled, description, appAllowedIps, allowedOrigins, appAllowedAuthMethods, appDefaultHttpMethods, rateLimitRequests, rateLimitWindow, rateLimitReleaseSeconds, rateLimitBlacklistAfter, rateLimitBlacklistWindow, rateLimitEnabled ] );

	useEffect( () => {
		setDirtyFlag(
			isDirty
				? { has: true, message: __( 'You are editing an application. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: { has: false, message: '' }
		);
	}, [ isDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const loadEntry = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: application.id,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				const e = result.data.entry;
				setTitle( e.title || '' );
				setEnabled( e.enabled ?? true );
				setPolicyActive( e.policy ?? false );
				setAuthor( e.author_name || '' );
				setDateCreated(
					formatDate(
						e.date_created,
						adminData.date_format,
						adminData.time_format
					)
				);
				setDateModified(
					formatDate(
						e.date_modified,
						adminData.date_format,
						adminData.time_format
					)
				);

				const s = e.settings || {};
				setServerSettings( s );
				setDescription( e.description || '' );
				setAllowedOrigins( s.allowed_origins || [] );
				setAppAllowedIps( s.allowed_ips || [] );
				setAppAllowedAuthMethods( s.allowed_auth_methods || [] );
				setAppDefaultHttpMethods( s.default_http_methods || [ 'get' ] );
				setRateLimitRequests( s.rate_limit?.max_requests ?? 100 );
				setRateLimitWindow( s.rate_limit?.window_seconds ?? 60 );
				setRateLimitReleaseSeconds( s.rate_limit?.release_seconds ?? 300 );
				setRateLimitBlacklistAfter( s.rate_limit?.blacklist_after ?? 5 );
				setRateLimitBlacklistWindow( s.rate_limit?.blacklist_window ?? 3600 );
				setRateLimitEnabled( s.rate_limit?.enabled !== false );
				setSavedSnapshot( {
					title:                    e.title || '',
					enabled:                  e.enabled ?? true,
					description:              e.description || '',
					allowedIpsJson:           JSON.stringify( s.allowed_ips || [] ),
					allowedOriginsJson:       JSON.stringify( s.allowed_origins || [] ),
					allowedAuthMethodsJson:   JSON.stringify( s.allowed_auth_methods || [] ),
					defaultHttpMethodsJson:   JSON.stringify( s.default_http_methods || [ 'get' ] ),
					rateLimitRequests:        String( s.rate_limit?.max_requests ?? 100 ),
					rateLimitWindow:          String( s.rate_limit?.window_seconds ?? 60 ),
					rateLimitReleaseSeconds:  String( s.rate_limit?.release_seconds ?? 300 ),
					rateLimitBlacklistAfter:  String( s.rate_limit?.blacklist_after ?? 5 ),
					rateLimitBlacklistWindow: String( s.rate_limit?.blacklist_window ?? 3600 ),
					rateLimitEnabled:         s.rate_limit?.enabled !== false,
				} );
			}
		} catch ( err ) {
			setLoadError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, application.id ] );

	const loadIpFilter = useCallback( async () => {
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( { action: 'get_ip_filter', nonce } ),
			} );
			const data = await res.json();
			if ( data?.success && data?.data ) {
				const { enabled, mode } = data.data;
				setIpFilter( { enabled: !! enabled, mode: mode || 'blacklist' } );
				if ( enabled && mode === 'whitelist' ) {
					const res2 = await fetch( adminData.ajaxurl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						body: new URLSearchParams( { action: 'get_ip_entries', nonce, list_type: 'whitelist' } ),
					} );
					const data2 = await res2.json();
					if ( data2?.success && data2?.data?.entries ) {
						setIpFilterIps( data2.data.entries.map( ( e ) => e.ip ).filter( Boolean ) );
					}
				}
			}
		} catch {
			// Silent fail.
		}
	}, [ adminData, nonce ] );

	const loadRoutesCount = useCallback( async () => {
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_routes_policy_tree',
					nonce,
					application_id: application.id,
				} ),
			} );
			const result = await res.json();
			if ( result?.success && result?.data?.tree ) {
				setRoutesCustomCount( countAllCustomNodes( result.data.tree ) );
			}
		} catch {}
	}, [ adminData, nonce, application.id ] );

	const loadUsers = useCallback( async () => {
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_application_users',
					nonce,
					application_id: application.id,
				} ),
			} );
			const result = await response.json();
			if ( result?.success && result?.data?.users ) {
				setAppUsers( result.data.users );
			}
		} catch {}
	}, [ adminData, nonce, application.id ] );

	const getModuleEnabled = ( panel ) => {
		if ( panel === 3 ) return ipFilter.enabled;
		const { optionKey } = MODULE_KEY[ panel ] || {};
		return optionKey ? !! adminData?.admin_options?.[ optionKey ] : true;
	};

	const handleModuleToggle = useCallback(
		async ( module, enabledState ) => {
			const entry = Object.values( MODULE_KEY ).find( ( m ) => m.module === module );
			if ( entry?.optionKey ) {
				updateAdminData( {
					...adminData,
					admin_options: { ...( adminData.admin_options || {} ), [ entry.optionKey ]: enabledState },
				} );
			} else if ( 'ip_filter' === module ) {
				setIpFilter( ( prev ) => ( { ...prev, enabled: enabledState } ) );
			}
			try {
				await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					body: new URLSearchParams( {
						action: 'rest_api_firewall_activate_module',
						nonce,
						module,
						enabled: enabledState ? '1' : '0',
					} ),
				} );
			} catch {
				// Silent fail.
			}
		},
		[ adminData, nonce, updateAdminData ] // eslint-disable-line react-hooks/exhaustive-deps
	);

	useEffect( () => {
		loadIpFilter();
	}, [ loadIpFilter ] );

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		loadEntry();
		loadUsers();
		loadRoutesCount();
	}, [ isNew, loadEntry, loadUsers, loadRoutesCount ] );

	const buildCurrentSettings = useCallback( () => ( {
		...serverSettings,
		allowed_ips: appAllowedIps,
		allowed_origins: allowedOrigins,
		allowed_auth_methods: appAllowedAuthMethods,
		default_http_methods: appDefaultHttpMethods,
		rate_limit: {
			enabled: rateLimitEnabled,
			max_requests: Number( rateLimitRequests ) || 0,
			window_seconds: Number( rateLimitWindow ) || 0,
			release_seconds: Number( rateLimitReleaseSeconds ) || 0,
			blacklist_after: Number( rateLimitBlacklistAfter ) || 0,
			blacklist_window: Number( rateLimitBlacklistWindow ) || 0,
		},
	} ), [
		serverSettings, appAllowedIps, allowedOrigins,
		appAllowedAuthMethods, appDefaultHttpMethods,
		rateLimitRequests, rateLimitWindow, rateLimitReleaseSeconds,
		rateLimitBlacklistAfter, rateLimitBlacklistWindow, rateLimitEnabled,
	] );

	const handleSave = () => {
		if ( ! title.trim() ) {
			return;
		}

		save(
			{
				action: isNew ? 'add_application_entry' : 'update_application_entry',
				...( ! isNew && { id: application.id } ),
				title: title.trim(),
				description,
				enabled: enabled ? '1' : '0',
				settings: JSON.stringify( isNew ? {} : buildCurrentSettings() ),
			},
			{
				skipConfirm: true,
				successTitle: __( 'Application Saved', 'rest-api-firewall' ),
				successMessage: __( 'Application saved successfully.', 'rest-api-firewall' ),
				onSuccess: isNew ? () => { clearDirty(); onBack(); } : () => {
				setSavedSnapshot( {
					title,
					enabled,
					description,
					allowedIpsJson:           JSON.stringify( appAllowedIps ),
					allowedOriginsJson:       JSON.stringify( allowedOrigins ),
					allowedAuthMethodsJson:   JSON.stringify( appAllowedAuthMethods ),
					defaultHttpMethodsJson:   JSON.stringify( appDefaultHttpMethods ),
					rateLimitRequests:        String( rateLimitRequests ),
					rateLimitWindow:          String( rateLimitWindow ),
					rateLimitReleaseSeconds:  String( rateLimitReleaseSeconds ),
					rateLimitBlacklistAfter:  String( rateLimitBlacklistAfter ),
					rateLimitBlacklistWindow: String( rateLimitBlacklistWindow ),
					rateLimitEnabled,
				} );
			},
			}
		);
	};

	const handleDelete = () => setConfirmDeleteOpen( true );

	const handleConfirmDelete = () => {
		setConfirmDeleteOpen( false );
		remove(
			{
				action: 'delete_application_entry',
				id: application.id,
			},
			{
				skipConfirm: true,
				successTitle: __( 'Application Deleted', 'rest-api-firewall' ),
				successMessage: __( 'The application has been removed.', 'rest-api-firewall' ),
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	};

	handleSaveRef.current = handleSave;
	handleDeleteRef.current = handleDelete;

	const updateToolbar = useRegisterToolbar( {
		isNew,
		breadcrumb: __( 'Applications', 'rest-api-firewall' ),
		newEntryLabel: __( 'New Application', 'rest-api-firewall' ),
		docPage: 'applications',
		showAppLink: false,
		handleBack: () => { clearDirty(); onBack(); },
		handleSave: () => handleSaveRef.current?.(),
		handleDelete: () => handleDeleteRef.current?.(),
		setEnabled,
	} );

	useEffect( () => {
		updateToolbar( {
			title,
			author,
			dateCreated,
			dateModified,
			saving,
			enabled,
			canSave: isDirty,
			dirtyFlag: isDirty
				? { has: true, message: __( 'You are editing an application. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: null,
		} );
	}, [ title, author, dateCreated, dateModified, saving, enabled, isDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( loading ) {
		return <LoadingMessage message={ isNew ? __( 'Creating new application...', 'rest-api-firewall' ) : __( 'Loading application...', 'rest-api-firewall' ) } />;
	}

	return (
		<Stack spacing={ 0 }>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Box sx={ { px: { xs: 2, sm: 4 }, borderBottom: 1, borderColor: 'divider' } }>
				<Tabs value={ activeTab } onChange={ ( e, v ) => setActiveTab( v ) }>
					<Tab icon={ <SettingsOutlinedIcon /> } iconPosition="start" label={ __( 'Settings', 'rest-api-firewall' ) } />
					<Tab icon={ <GridViewOutlinedIcon /> } iconPosition="start" label={ __( 'Modules', 'rest-api-firewall' ) } />
				</Tabs>
			</Box>

			{ activeTab === 0 && (
			<Stack spacing={ 3 } maxWidth={780} p={ { xs: 2, sm: 4 } }>
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
							<Switch
								size="small"
								checked={ rateLimitEnabled }
								onChange={ ( e ) => setRateLimitEnabled( e.target.checked ) }
							/>
						</Stack>


						<RateLimitFields
							values={ {
								max_requests: rateLimitRequests,
								window_seconds: rateLimitWindow,
								release_seconds: rateLimitReleaseSeconds,
								blacklist_after: rateLimitBlacklistAfter,
								blacklist_window: rateLimitBlacklistWindow,
								enabled: rateLimitEnabled,
							} }
							onChange={ ( key, val ) => {
								const setters = {
									max_requests: setRateLimitRequests,
									window_seconds: setRateLimitWindow,
									release_seconds: setRateLimitReleaseSeconds,
									blacklist_after: setRateLimitBlacklistAfter,
									blacklist_window: setRateLimitBlacklistWindow,
									enabled: setRateLimitEnabled,
								};
								setters[ key ]?.( val );
							} }
						/>
					</Stack>

				</Stack>

			</Stack>
			) }

			{ activeTab === 1 && (
			<Box
				sx={ {
					p: { xs: 2, sm: 4 },
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
					gap: 2,
					maxWidth: 900,
				} }
			>
				{ /* Auth & Rate Limit */ }
				<PanelCard
					title={ __( 'Users', 'rest-api-firewall' ) }
					Icon={ SecurityOutlined }
					panel={ 1 }
					module="users"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 1 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					{ appUsers.length > 0
						? appUsers.map( ( u ) => (
							<UserRow
								key={ u.id }
								user={ u }
								onClick={ () => navigate( 'user-rate-limiting', u.id ) }
							/>
						) )
						: ! isNew && (
							<Typography variant="caption" color="text.disabled">
								{ __( 'No users linked to this application.', 'rest-api-firewall' ) }
							</Typography>
						)
					}

				</PanelCard>

				{ /* Routes */ }
				<PanelCard
					title={ __( 'Routes', 'rest-api-firewall' ) }
					Icon={ AccountTreeOutlinedIcon }
					panel={ 2 }
					module="routes_policy"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 2 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					{ /* Auth. & Rate Limiting */ }
					<DataRow label={ __( 'Auth & RL', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							<Chip
								label={ __( 'Auth', 'rest-api-firewall' ) }
								size="small"
								color={ serverSettings.enforce_auth ? 'success' : 'default' }
								variant={ serverSettings.enforce_auth ? 'filled' : 'outlined' }
								sx={ { fontSize: 10 } }
							/>
							<Chip
								label={ __( 'Rate limit', 'rest-api-firewall' ) }
								size="small"
								color={ serverSettings.enforce_rate_limit ? 'success' : 'default' }
								variant={ serverSettings.enforce_rate_limit ? 'filled' : 'outlined' }
								sx={ { fontSize: 10 } }
							/>
						</Stack>
					</DataRow>

					{ /* Disable Routes */ }
					<DataRow label={ __( 'Disabled routes', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ [ serverSettings.hide_user_routes && 'users', serverSettings.hide_oembed_routes && 'oembed', serverSettings.hide_batch_routes && 'batch' ].filter( Boolean ).length > 0
								? [ serverSettings.hide_user_routes && 'users', serverSettings.hide_oembed_routes && 'oembed', serverSettings.hide_batch_routes && 'batch' ].filter( Boolean ).map( ( r ) => (
									<Chip key={ r } label={ r } size="small" sx={ { fontFamily: 'monospace', fontSize: 10 } } />
								) )
								: <Typography variant="caption" color="text.disabled">{ __( 'None', 'rest-api-firewall' ) }</Typography>
							}
						</Stack>
					</DataRow>

					{ /* Disabled Route Response */ }
					<DataRow label={ __( 'Response', 'rest-api-firewall' ) }>
						<Typography variant="caption" noWrap>
							{ DISABLE_BEHAVIOR_LABELS[ serverSettings.disable_behavior ] || '404 Not Found' }
						</Typography>
					</DataRow>

					{ /* Disable HTTP Methods */ }
					<DataRow label={ __( 'HTTP off', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ ( serverSettings.disabled_methods || [] ).length > 0
								? ( serverSettings.disabled_methods || [] ).map( ( m ) => (
									<Chip key={ m } label={ m.toUpperCase() } size="small" sx={ { fontFamily: 'monospace', fontSize: 10 } } />
								) )
								: <Typography variant="caption" color="text.disabled">{ __( 'None', 'rest-api-firewall' ) }</Typography>
							}
						</Stack>
					</DataRow>

					{ /* Disable Post Types */ }
					<DataRow label={ __( 'Post types off', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ ( serverSettings.disabled_post_types || [] ).length > 0
								? <>
									{ ( serverSettings.disabled_post_types || [] ).slice( 0, 3 ).map( ( p ) => (
										<Chip key={ p } label={ p } size="small" sx={ { fontSize: 10 } } />
									) ) }
									{ ( serverSettings.disabled_post_types || [] ).length > 3 && (
										<Typography variant="caption" color="text.secondary">+{ serverSettings.disabled_post_types.length - 3 }</Typography>
									) }
									</>
								: <Typography variant="caption" color="text.disabled">{ __( 'None', 'rest-api-firewall' ) }</Typography>
							}
						</Stack>
					</DataRow>

					{ /* Custom rules count */ }
					{ routesCustomCount !== null && (
						<DataRow label={ __( 'Custom rules', 'rest-api-firewall' ) }>
							<Chip
								label={ routesCustomCount }
								size="small"
								color={ routesCustomCount > 0 ? 'primary' : 'default' }
								variant="outlined"
							/>
						</DataRow>
					) }
				</PanelCard>

				{ /* IP Filtering */ }
				<PanelCard
					title={ __( 'IP Filtering', 'rest-api-firewall' ) }
					Icon={ VpnLockOutlinedIcon }
					panel={ 3 }
					module="ip_filter"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 3 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'Mode', 'rest-api-firewall' ) }>
						<Chip
							size="small"
							variant="outlined"
							label={
								! ipFilter.enabled
									? __( 'Disabled', 'rest-api-firewall' )
									: ipFilter.mode === 'whitelist'
									? __( 'Whitelist', 'rest-api-firewall' )
									: __( 'Blacklist', 'rest-api-firewall' )
							}
							color={
								! ipFilter.enabled
									? 'default'
									: ipFilter.mode === 'whitelist'
									? 'success'
									: 'warning'
							}
						/>
					</DataRow>
					{ allowedOrigins.length > 0 && (
						<DataRow label={ __( 'Origins', 'rest-api-firewall' ) }>
							<Typography variant="caption" noWrap sx={ { fontFamily: 'monospace' } }>
								{ allowedOrigins.slice( 0, 2 ).join( ', ' ) }
								{ allowedOrigins.length > 2 ? ` +${ allowedOrigins.length - 2 }` : '' }
							</Typography>
						</DataRow>
					) }
					{ ipFilter.enabled && ipFilter.mode === 'whitelist' && ipFilterIps.length > 0 && (
						<DataRow label={ __( 'IPs', 'rest-api-firewall' ) }>
							<Typography variant="caption" noWrap sx={ { fontFamily: 'monospace' } }>
								{ ipFilterIps.slice( 0, 2 ).join( ', ' ) }
								{ ipFilterIps.length > 2 ? ` +${ ipFilterIps.length - 2 }` : '' }
							</Typography>
						</DataRow>
					) }
				</PanelCard>

				{ /* Collections */ }
				<PanelCard
					title={ __( 'Collections', 'rest-api-firewall' ) }
					Icon={ ApiIcon }
					panel={ 4 }
					module="collections"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 4 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'Sorting', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Endpoint grouping & access rules', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</PanelCard>

				<PanelCard
					title={ __( 'Properties', 'rest-api-firewall' ) }
					Icon={ RuleOutlinedIcon }
					panel={ 5 }
					module="models"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 5 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'Transform', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'REST output field filtering', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
					<DataRow label={ __( 'Models', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Custom field model definitions', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</PanelCard>

				{ /* Settings Route */ }
				<PanelCard
					title={ __( 'Settings Route', 'rest-api-firewall' ) }
					Icon={ BusinessOutlinedIcon }
					panel={ 6 }
					module="settings_route"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 6 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'Route', 'rest-api-firewall' ) }>
						<Typography variant="caption" noWrap sx={ { fontFamily: 'monospace' } }>
							wp/v2/settings
						</Typography>
					</DataRow>
				</PanelCard>

				{ /* Automations */ }
				<PanelCard
					title={ __( 'Automations', 'rest-api-firewall' ) }
					Icon={ AutoFixHighOutlinedIcon }
					panel={ 13 }
					module="automations"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 13 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'Triggers', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Event-based rules & actions', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</PanelCard>

				{ /* Webhooks */ }
				<PanelCard
					title={ __( 'Webhooks', 'rest-api-firewall' ) }
					Icon={ WebhookIcon }
					panel={ 7 }
					module="webhooks"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 7 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'Settings', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Outbound event notifications', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
					<DataRow label={ __( 'Entries', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Per-event webhook targets', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</PanelCard>

				{ /* Emails */ }
				<PanelCard
					title={ __( 'Emails', 'rest-api-firewall' ) }
					Icon={ EmailOutlinedIcon }
					panel={ 8 }
					module="mails"
					onNavigate={ handlePanelNavigate }
					enabled={ getModuleEnabled( 8 ) }
					onToggleEnabled={ handleModuleToggle }
				>
					<DataRow label={ __( 'SMTP', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Mail server configuration', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
					<DataRow label={ __( 'Templates', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Email notification templates', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</PanelCard>

				{ /* Logs */ }
				<Tooltip title={ __( 'Logs are global across all applications', 'rest-api-firewall' ) } placement="top">
					<span>
						<PanelCard
							title={ __( 'Logs', 'rest-api-firewall' ) }
							Icon={ AssessmentOutlinedIcon }
							panel={ 12 }
							onNavigate={ handlePanelNavigate }
						>
							<DataRow label={ __( 'Scope', 'rest-api-firewall' ) }>
								<Typography variant="caption" color="text.disabled">
									{ __( 'Global request history & audit trail', 'rest-api-firewall' ) }
								</Typography>
							</DataRow>
						</PanelCard>
					</span>
				</Tooltip>
			</Box>
			) }

			<ConfirmWithInputDialog
				open={ confirmDeleteOpen }
				title={ __( 'Delete Application', 'rest-api-firewall' ) }
				message={ __( 'This will permanently delete the application and all its configuration. This action cannot be undone.', 'rest-api-firewall' ) }
				requiredText={ title }
				confirmLabel={ __( 'Delete', 'rest-api-firewall' ) }
				onConfirm={ handleConfirmDelete }
				onCancel={ () => setConfirmDeleteOpen( false ) }
				loading={ saving }
			/>
		</Stack>
	);
}
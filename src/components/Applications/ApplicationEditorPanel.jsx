import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';

import formatDate from '../../utils/formatDate';
import { countAllCustomNodes } from '../Firewall/Routes/routesPolicyUtils';
import LoadingMessage from '../LoadingMessage';
import useRegisterToolbar from '../../hooks/useRegisterToolbar';
import ConfirmWithInputDialog from '../ConfirmWithInputDialog';
import ApplicationEditorSettings from './ApplicationEditorSettings';
import ApplicationEditorModules from './ApplicationEditorModules';

const MODULE_KEY = {
	1:  { module: 'users',          panelKey: 'user-rate-limiting',  optionKey: 'user_rate_limit_enabled' },
	2:  { module: 'routes_policy',  panelKey: 'per-route-settings',  optionKey: 'firewall_routes_policy_enabled' },
	4:  { module: 'collections',    panelKey: 'collections',         optionKey: 'rest_collections_enabled' },
	5:  { module: 'models',         panelKey: 'models-properties',   optionKey: 'rest_models_enabled' },
	7:  { module: 'webhooks',       panelKey: 'webhook',             optionKey: 'webhooks_enabled' },
	8:  { module: 'mails',          panelKey: 'emails',              optionKey: 'mails_enabled' },
	12: { module: 'logs',           panelKey: 'logs',                optionKey: null },
	13: { module: 'automations',    panelKey: 'automations',         optionKey: 'automations_enabled' },
};

export default function ApplicationEditorPanel( { application, onBack } ) {
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
	const [ activeTab, setActiveTab ] = useState( 0 );

	// ── Entry fields ──────────────────────────────────────────────────────────
	const [ title, setTitle ] = useState( application.title || '' );
	const [ enabled, setEnabled ] = useState( application.enabled ?? true );
	const [ description, setDescription ] = useState( '' );
	const [ author, setAuthor ] = useState( '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	// ── Settings fields ───────────────────────────────────────────────────────
	const [ serverSettings, setServerSettings ] = useState( {} );
	const [ appAllowedIps, setAppAllowedIps ] = useState( [] );
	const [ allowedOrigins, setAllowedOrigins ] = useState( [] );
	const [ appAllowedAuthMethods, setAppAllowedAuthMethods ] = useState( [] );
	const [ appDefaultHttpMethods, setAppDefaultHttpMethods ] = useState( [ 'get' ] );
	const [ rateLimitRequests, setRateLimitRequests ] = useState( 100 );
	const [ rateLimitWindow, setRateLimitWindow ] = useState( 60 );
	const [ rateLimitReleaseSeconds, setRateLimitReleaseSeconds ] = useState( 300 );
	const [ rateLimitBlacklistAfter, setRateLimitBlacklistAfter ] = useState( 5 );
	const [ rateLimitBlacklistWindow, setRateLimitBlacklistWindow ] = useState( 3600 );
	const [ rateLimitEnabled, setRateLimitEnabled ] = useState( true );

	const [ appUsers, setAppUsers ] = useState( [] );
	const [ routesCustomCount, setRoutesCustomCount ] = useState( null );

	const [ confirmDeleteOpen, setConfirmDeleteOpen ] = useState( false );
	const [ savedSnapshot, setSavedSnapshot ] = useState( null );

	// ── Dirty tracking ────────────────────────────────────────────────────────
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

	// ── Data loaders ──────────────────────────────────────────────────────────
	const loadEntry = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
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
				setAuthor( e.author_name || '' );
				setDateCreated( formatDate( e.date_created, adminData.date_format, adminData.time_format ) );
				setDateModified( formatDate( e.date_modified, adminData.date_format, adminData.time_format ) );

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

	const loadUsers = useCallback( async () => {
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
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

	useEffect( () => {
		if ( isNew ) return;
		loadEntry();
		loadUsers();
		loadRoutesCount();
	}, [ isNew, loadEntry, loadUsers, loadRoutesCount ] );

	// ── Module toggle ─────────────────────────────────────────────────────────
	const getModuleEnabled = ( panel ) => {
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

	// ── Save / Delete ─────────────────────────────────────────────────────────
	const buildCurrentSettings = useCallback( () => ( {
		...serverSettings,
		allowed_ips:          appAllowedIps,
		allowed_origins:      allowedOrigins,
		allowed_auth_methods: appAllowedAuthMethods,
		default_http_methods: appDefaultHttpMethods,
		rate_limit: {
			enabled:         rateLimitEnabled,
			max_requests:    Number( rateLimitRequests ) || 0,
			window_seconds:  Number( rateLimitWindow ) || 0,
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
		if ( ! title.trim() ) return;

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
				successTitle:   __( 'Application Saved', 'rest-api-firewall' ),
				successMessage: __( 'Application saved successfully.', 'rest-api-firewall' ),
				onSuccess: isNew
					? () => { clearDirty(); onBack(); }
					: () => {
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
			{ action: 'delete_application_entry', id: application.id },
			{
				skipConfirm: true,
				successTitle:   __( 'Application Deleted', 'rest-api-firewall' ),
				successMessage: __( 'The application has been removed.', 'rest-api-firewall' ),
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	};

	handleSaveRef.current = handleSave;
	handleDeleteRef.current = handleDelete;

	// ── Toolbar ───────────────────────────────────────────────────────────────
	const updateToolbar = useRegisterToolbar( {
		isNew,
		breadcrumb:    __( 'Applications', 'rest-api-firewall' ),
		newEntryLabel: __( 'New Application', 'rest-api-firewall' ),
		docPage:       'applications',
		showAppLink:   false,
		handleBack:   () => { clearDirty(); onBack(); },
		handleSave:   () => handleSaveRef.current?.(),
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
		return <LoadingMessage message={ isNew
			? __( 'Creating new application...', 'rest-api-firewall' )
			: __( 'Loading application...', 'rest-api-firewall' )
		} />;
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
				<ApplicationEditorSettings
					title={ title }
					setTitle={ setTitle }
					description={ description }
					setDescription={ setDescription }
					appAllowedIps={ appAllowedIps }
					setAppAllowedIps={ setAppAllowedIps }
					allowedOrigins={ allowedOrigins }
					setAllowedOrigins={ setAllowedOrigins }
					appAllowedAuthMethods={ appAllowedAuthMethods }
					setAppAllowedAuthMethods={ setAppAllowedAuthMethods }
					appDefaultHttpMethods={ appDefaultHttpMethods }
					setAppDefaultHttpMethods={ setAppDefaultHttpMethods }
					rateLimitRequests={ rateLimitRequests }
					setRateLimitRequests={ setRateLimitRequests }
					rateLimitWindow={ rateLimitWindow }
					setRateLimitWindow={ setRateLimitWindow }
					rateLimitReleaseSeconds={ rateLimitReleaseSeconds }
					setRateLimitReleaseSeconds={ setRateLimitReleaseSeconds }
					rateLimitBlacklistAfter={ rateLimitBlacklistAfter }
					setRateLimitBlacklistAfter={ setRateLimitBlacklistAfter }
					rateLimitBlacklistWindow={ rateLimitBlacklistWindow }
					setRateLimitBlacklistWindow={ setRateLimitBlacklistWindow }
					rateLimitEnabled={ rateLimitEnabled }
					setRateLimitEnabled={ setRateLimitEnabled }
				/>
			) }

			{ activeTab === 1 && (
				<ApplicationEditorModules
					isNew={ isNew }
					appUsers={ appUsers }
					serverSettings={ serverSettings }
					routesCustomCount={ routesCustomCount }
					allowedOrigins={ allowedOrigins }
					getModuleEnabled={ getModuleEnabled }
					handleModuleToggle={ handleModuleToggle }
					handlePanelNavigate={ handlePanelNavigate }
					navigate={ navigate }
				/>
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

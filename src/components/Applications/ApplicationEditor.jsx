import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import ApiIcon from '@mui/icons-material/Api';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WebhookIcon from '@mui/icons-material/Webhook';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import formatDate from '../../utils/formatDate';
import LoadingMessage from '../LoadingMessage';
import EntryToolbar from '../shared/EntryToolbar';

const MODULE_KEY = {
	1:  { module: 'users',          optionKey: 'user_rate_limit_enabled' },
	2:  { module: 'routes_policy',  optionKey: 'firewall_routes_policy_enabled' },
	3:  { module: 'ip_filter',      optionKey: null },
	4:  { module: 'collections',    optionKey: 'rest_collections_enabled' },
	5:  { module: 'models',         optionKey: 'rest_models_enabled' },
	6:  { module: 'settings_route', optionKey: 'rest_settings_route_enabled' },
	7:  { module: 'webhooks',       optionKey: 'webhooks_enabled' },
	8:  { module: 'mails',          optionKey: 'mails_enabled' },
	13: { module: 'automations',    optionKey: 'automations_enabled' },
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

export default function ApplicationEditor( { application, onBack, onNavigate } ) {
	const { adminData, updateAdminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;

	const { __ } = wp.i18n || {};

	const { setDirtyFlag } = useApplication();
	const { save, remove, saving } = useProActions();

	const isNew = ! application.id;

	useEffect( () => {
		setDirtyFlag( { has: true, message: __( 'You are editing an application. Unsaved changes will be lost.', 'rest-api-firewall' ) } );
		return () => setDirtyFlag( { has: false, message: '' } );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
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
				setDescription( s.description || '' );
				setAllowedOrigins( s.allowed_origins || [] );
				setRateLimitRequests( s.rate_limit?.max_requests ?? 100 );
				setRateLimitWindow( s.rate_limit?.window_seconds ?? 60 );
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
			// Fail silently.
		}
	}, [ adminData, nonce ] );

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
				// Fail silently.
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
	}, [ isNew, loadEntry, loadUsers ] );

	const handleSave = async () => {
		if ( ! title.trim() ) {
			return;
		}

		let existingSettings = {};
		if ( ! isNew ) {
			try {
				const res = await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					body: new URLSearchParams( { action: 'get_application_entry', nonce, id: application.id } ),
				} );
				const result = await res.json();
				if ( result?.success && result?.data?.entry ) {
					existingSettings = result.data.entry.settings || {};
				}
			} catch {}
		}

		save(
			{
				action: isNew ? 'add_application_entry' : 'update_application_entry',
				...( ! isNew && { id: application.id } ),
				title: title.trim(),
				enabled: enabled ? '1' : '0',
				settings: JSON.stringify( { ...existingSettings, description } ),
			},
			{
				skipConfirm: true,
				successTitle: __( 'Application Saved', 'rest-api-firewall' ),
				successMessage: __( 'Application saved successfully.', 'rest-api-firewall' ),
				onSuccess: isNew ? () => { clearDirty(); onBack(); } : undefined,
			}
		);
	};

	const handleDelete = () => {
		remove(
			{
				action: 'delete_application_entry',
				id: application.id,
			},
			{
				confirmTitle: __( 'Delete Application', 'rest-api-firewall' ),
				confirmMessage: __(
					'Are you sure you want to permanently delete this application? This action cannot be undone.',
					'rest-api-firewall'
				),
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				successTitle: __( 'Application Deleted', 'rest-api-firewall' ),
				successMessage: __(
					'The application has been removed.',
					'rest-api-firewall'
				),
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	};

	if ( loading ) {
		return <LoadingMessage message={ isNew ? __( 'Creating new application...', 'rest-api-firewall' ) : __( 'Loading application...', 'rest-api-firewall' ) } />;
	}

	return (
		<Stack spacing={ 0 }>
			<EntryToolbar
				isNew={ isNew }
				title={ title }
				author={ author }
				dateCreated={ dateCreated }
				dateModified={ dateModified }
				handleBack={ () => { clearDirty(); onBack(); } }
				handleSave={ handleSave }
				handleDelete={ handleDelete }
				saving={ saving }
				enabled={ enabled }
				setEnabled={ setEnabled }
				breadcrumb={ [ __( 'Applications', 'rest-api-firewall' ), __( 'Application', 'rest-api-firewall' ) ] }
				docPage="applications"
			/>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack p={ { xs: 2, sm: 4 } } spacing={ 2 } sx={ { maxWidth: 560 } }>
				<TextField
					label={ __( 'Title', 'rest-api-firewall' ) }
					value={ title }
					onChange={ ( e ) => setTitle( e.target.value ) }
					size="small"
					sx={ { maxWidth: 340 } }
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

			{ ! isNew && (
				<>
					<Divider />

					<Box
						sx={ {
							p: { xs: 2, sm: 4 },
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
							gap: 2,
							maxWidth: 1100,
						} }
					>
						{ /* Auth & Rate Limit */ }
						<PanelCard
							title={ __( 'Auth & Rate Limit', 'rest-api-firewall' ) }
							Icon={ SecurityOutlined }
							panel={ 1 }
							module="users"
							onNavigate={ onNavigate }
							enabled={ getModuleEnabled( 1 ) }
							onToggleEnabled={ handleModuleToggle }
						>
							<DataRow label={ __( 'Users', 'rest-api-firewall' ) }>
								{ appUsers.length > 0 ? (
									<Typography variant="caption" noWrap>
										{ appUsers.slice( 0, 2 ).map( ( u ) => u.display_name ).join( ', ' ) }
										{ appUsers.length > 2 ? ` +${ appUsers.length - 2 }` : '' }
									</Typography>
								) : (
									<Typography variant="caption" color="text.disabled" fontStyle="italic">
										{ __( 'No users linked', 'rest-api-firewall' ) }
									</Typography>
								) }
							</DataRow>
							<DataRow label={ __( 'Rate limit', 'rest-api-firewall' ) }>
								<Typography variant="caption" sx={ { fontFamily: 'monospace' } }>
									{ rateLimitRequests } req / { rateLimitWindow }s
								</Typography>
							</DataRow>
						</PanelCard>

						{ /* Routes */ }
						<PanelCard
							title={ __( 'Routes', 'rest-api-firewall' ) }
							Icon={ AccountTreeIcon }
							panel={ 2 }
							module="routes_policy"
							onNavigate={ onNavigate }
							enabled={ getModuleEnabled( 2 ) }
							onToggleEnabled={ handleModuleToggle }
						>
							<DataRow label={ __( 'Policy', 'rest-api-firewall' ) }>
								<Chip
									label={ policyActive ? __( 'Active', 'rest-api-firewall' ) : __( 'None', 'rest-api-firewall' ) }
									color={ policyActive ? 'success' : 'default' }
									size="small"
									variant="outlined"
								/>
							</DataRow>
						</PanelCard>

						{ /* IP Filtering */ }
						<PanelCard
							title={ __( 'IP Filtering', 'rest-api-firewall' ) }
							Icon={ VpnLockOutlinedIcon }
							panel={ 3 }
							module="ip_filter"
							onNavigate={ onNavigate }
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
							onNavigate={ onNavigate }
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
							onNavigate={ onNavigate }
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
							onNavigate={ onNavigate }
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
							onNavigate={ onNavigate }
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
							onNavigate={ onNavigate }
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
							onNavigate={ onNavigate }
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
									onNavigate={ onNavigate }
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
				</>
			) }
		</Stack>
	);
}

import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
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

function PanelCard( { title, Icon, panel, onNavigate, enabled, onToggleEnabled, children } ) {
	const handleToggle = ( e ) => {
		e.stopPropagation();
		onToggleEnabled?.( panel, ! enabled );
	};

	return (
		<Paper
			variant="outlined"
			sx={ {
				borderRadius: 2,
				display: 'flex',
				flexDirection: 'column',
				aspectRatio: '1 / 1',
				overflow: 'hidden',
				transition: 'border-color 0.15s, background-color 0.15s',
				'&:hover': onNavigate
					? { borderColor: 'primary.main', bgcolor: 'action.hover' }
					: {},
			} }
		>
			{ /* Clickable body */ }
			<Box
				sx={ { flex: 1, p: 2, cursor: onNavigate ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0 } }
				onClick={ () => onNavigate?.( panel ) }
			>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
					<Stack direction="row" spacing={ 0.75 } alignItems="center">
						{ Icon && <Icon sx={ { fontSize: 15, color: 'text.secondary' } } /> }
						<Typography variant="subtitle2" fontWeight={ 600 } sx={ { lineHeight: 1.2 } }>
							{ title }
						</Typography>
					</Stack>
					{ onNavigate && (
						<ArrowForwardIosIcon sx={ { fontSize: 10, color: 'text.disabled', flexShrink: 0, mt: 0.25 } } />
					) }
				</Stack>

				<Box sx={ { flex: 1, overflow: 'hidden' } }>
					{ children }
				</Box>
			</Box>

			{ /* Footer with enable toggle */ }
			{ onToggleEnabled !== undefined && (
				<Box
					sx={ { px: 1.5, py: 0.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' } }
					onClick={ ( e ) => e.stopPropagation() }
				>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ !! enabled }
								onChange={ handleToggle }
							/>
						}
						label={
							<Typography variant="caption" color="text.secondary">
								{ enabled ? wp.i18n.__( 'On', 'rest-api-firewall' ) : wp.i18n.__( 'Off', 'rest-api-firewall' ) }
							</Typography>
						}
						sx={ { m: 0 } }
					/>
				</Box>
			) }
		</Paper>
	);
}

export default function ApplicationEditor( { application, onBack, onNavigate } ) {
	const { adminData } = useAdminData();
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
			// IP filter info is supplementary — fail silently
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

		// Re-fetch current settings to avoid overwriting changes made in other panels.
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
		return <LoadingMessage />;
	}

	const InfoRow = ( { label, children } ) => (
		<Stack direction="row" spacing={ 0.5 } alignItems="baseline" flexWrap="wrap">
			<Typography variant="caption" color="text.disabled" sx={ { flexShrink: 0 } }>
				{ label }
			</Typography>
			{ children }
		</Stack>
	);

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
							gridTemplateColumns: 'repeat(3, 1fr)',
							gap: 2,
							maxWidth: 900,
						} }
					>
						{ /* Auth & Rate Limit */ }
						<PanelCard
							title={ __( 'Auth & Rate Limit', 'rest-api-firewall' ) }
							Icon={ SecurityOutlined }
							panel={ 1 }
							onNavigate={ onNavigate }
						>
							{ appUsers.length > 0 ? (
								<>
									<InfoRow label={ __( 'Users:', 'rest-api-firewall' ) }>
										<Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 0.5 } }>
											{ appUsers.slice( 0, 2 ).map( ( u ) => (
												<Chip
													key={ u.id }
													label={ u.display_name }
													size="small"
													variant="outlined"
													sx={ {
														maxWidth: 110,
														fontSize: '0.65rem',
														height: 18,
														'& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', px: 0.75 },
													} }
												/>
											) ) }
											{ appUsers.length > 2 && (
												<Chip label={ `+${ appUsers.length - 2 }` } size="small" sx={ { height: 18, fontSize: '0.65rem' } } />
											) }
										</Box>
									</InfoRow>
								</>
							) : (
								<Typography variant="caption" color="text.secondary" fontStyle="italic">
									{ __( 'No users linked', 'rest-api-firewall' ) }
								</Typography>
							) }
							{ ( rateLimitRequests || rateLimitWindow ) && (
								<InfoRow label={ __( 'Rate limit:', 'rest-api-firewall' ) }>
									<Typography variant="caption" sx={ { fontFamily: 'monospace' } }>
										{ rateLimitRequests } req / { rateLimitWindow }s
									</Typography>
								</InfoRow>
							) }
						</PanelCard>

						{ /* Routes */ }
						<PanelCard
							title={ __( 'Routes', 'rest-api-firewall' ) }
							Icon={ AccountTreeIcon }
							panel={ 2 }
							onNavigate={ onNavigate }
						>
							<InfoRow label={ __( 'Policy:', 'rest-api-firewall' ) }>
								<Chip
									label={
										policyActive
											? __( 'Active', 'rest-api-firewall' )
											: __( 'None', 'rest-api-firewall' )
									}
									color={ policyActive ? 'success' : 'default' }
									size="small"
									variant="outlined"
									sx={ { height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } } }
								/>
							</InfoRow>
						</PanelCard>

						{ /* IP Filtering */ }
						<PanelCard
							title={ __( 'IP Filtering', 'rest-api-firewall' ) }
							Icon={ VpnLockOutlinedIcon }
							panel={ 3 }
							onNavigate={ onNavigate }
						>
							<InfoRow label={ __( 'Mode:', 'rest-api-firewall' ) }>
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
									sx={ { height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } } }
								/>
							</InfoRow>
							{ allowedOrigins.length > 0 && (
								<InfoRow label={ __( 'Origins:', 'rest-api-firewall' ) }>
									<Typography
										variant="caption"
										sx={ { fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' } }
									>
										{ allowedOrigins.slice( 0, 2 ).join( ', ' ) }
										{ allowedOrigins.length > 2 ? ` +${ allowedOrigins.length - 2 }` : '' }
									</Typography>
								</InfoRow>
							) }
							{ ipFilter.enabled && ipFilter.mode === 'whitelist' && ipFilterIps.length > 0 && (
								<InfoRow label={ __( 'IPs:', 'rest-api-firewall' ) }>
									<Typography
										variant="caption"
										sx={ { fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' } }
									>
										{ ipFilterIps.slice( 0, 2 ).join( ', ' ) }
										{ ipFilterIps.length > 2 ? ` +${ ipFilterIps.length - 2 }` : '' }
									</Typography>
								</InfoRow>
							) }
						</PanelCard>

						{ /* Collections */ }
						<PanelCard
							title={ __( 'Collections', 'rest-api-firewall' ) }
							Icon={ ApiIcon }
							panel={ 4 }
							onNavigate={ onNavigate }
						>
							<Typography variant="caption" color="text.secondary">
								{ __( 'REST endpoint grouping & access rules', 'rest-api-firewall' ) }
							</Typography>
						</PanelCard>

						{ /* Properties & Models */ }
						<PanelCard
							title={ __( 'Properties & Models', 'rest-api-firewall' ) }
							Icon={ RuleOutlinedIcon }
							panel={ 5 }
							onNavigate={ onNavigate }
						>
							<Typography variant="caption" color="text.secondary">
								{ __( 'REST output filtering, custom models', 'rest-api-firewall' ) }
							</Typography>
						</PanelCard>

						{ /* Settings Route */ }
						<PanelCard
							title={ __( 'Settings Route', 'rest-api-firewall' ) }
							Icon={ BusinessOutlinedIcon }
							panel={ 6 }
							onNavigate={ onNavigate }
						>
							<Typography variant="caption" color="text.secondary" sx={ { fontFamily: 'monospace' } }>
								wp/v2/settings
							</Typography>
						</PanelCard>

						{ /* Automations */ }
						<PanelCard
							title={ __( 'Automations', 'rest-api-firewall' ) }
							Icon={ AutoFixHighOutlinedIcon }
							panel={ 13 }
							onNavigate={ onNavigate }
						>
							<Typography variant="caption" color="text.secondary">
								{ __( 'Triggers & automated actions', 'rest-api-firewall' ) }
							</Typography>
						</PanelCard>

						{ /* Webhooks */ }
						<PanelCard
							title={ __( 'Webhooks', 'rest-api-firewall' ) }
							Icon={ WebhookIcon }
							panel={ 7 }
							onNavigate={ onNavigate }
						>
							<Typography variant="caption" color="text.secondary">
								{ __( 'Outbound event notifications', 'rest-api-firewall' ) }
							</Typography>
						</PanelCard>

						{ /* Emails */ }
						<PanelCard
							title={ __( 'Emails', 'rest-api-firewall' ) }
							Icon={ EmailOutlinedIcon }
							panel={ 8 }
							onNavigate={ onNavigate }
						>
							<Typography variant="caption" color="text.secondary">
								{ __( 'Email notifications & templates', 'rest-api-firewall' ) }
							</Typography>
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
									<Typography variant="caption" color="text.secondary">
										{ __( 'Request history & audit trail', 'rest-api-firewall' ) }
									</Typography>
								</PanelCard>
							</span>
						</Tooltip>
					</Box>
				</>
			) }
		</Stack>
	);
}

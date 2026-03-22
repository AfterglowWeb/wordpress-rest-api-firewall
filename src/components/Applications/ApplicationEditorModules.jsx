import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
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

const DISABLE_BEHAVIOR_LABELS = {
	'404':      '404 Not Found',
	'410':      '410 Gone',
	'301_url':  '301 Custom URL',
	'301_page': '301 WP Page',
	'empty':    'Empty (no response)',
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
				sx={ {
					borderBottom: '1px solid',
					borderColor: 'divider',
					bgcolor: 'grey.50',
				} }
			>
				<Stack
					direction="row"
					flex={ 1 }
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
					<Stack flexGrow={ 0 } pr={ 1 }>
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
		<Stack direction="row" spacing={ 1 } py={ 1 } alignItems="center">
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

export default function ApplicationEditorModules( {
	isNew,
	appUsers,
	serverSettings,
	routesCustomCount,
	allowedOrigins,
	ipFilter,
	ipFilterIps,
	getModuleEnabled,
	handleModuleToggle,
	handlePanelNavigate,
	navigate,
} ) {
	const { __ } = wp.i18n || {};

	return (
		<Box
			sx={ {
				p: { xs: 2, sm: 4 },
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
				gap: 2,
				maxWidth: 900,
			} }
		>
			{ /* Users */ }
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
							variant="outlined"
							sx={ { fontSize: 10 } }
						/>
						<Chip
							label={ __( 'Rate limit', 'rest-api-firewall' ) }
							size="small"
							color={ serverSettings.enforce_rate_limit ? 'success' : 'default' }
							variant="outlined"
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

			{ /* Properties */ }
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
	);
}

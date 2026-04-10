import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
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
						<Icon color="primary" sx={ { fontSize: 17, color: 'text.primary' } } />
					) }
					<Typography color="primary" variant="body2" fontWeight={ 700 } sx={ { flex: 1 } }>
						{ title }
					</Typography>
					{ onNavigate && (
						<ArrowForwardIosIcon color="primary" sx={ { fontSize: 12, flexShrink: 0 } } />
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

function DataRow( { label, children } ) {
	return (
		<Stack
			direction="row"
			spacing={ 1 }
			p={ 1 }
			mb={1}
			alignItems="center"
			sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
		>
			<Tooltip title={ label } disableInteractive placement="top">
				<Typography
					variant="caption"
					color="text.disabled"
					sx={ { flexShrink: 0, width: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }
				>
					{ label }
				</Typography>
			</Tooltip>
			<Box sx={ { flex: 1, overflow: 'hidden', minWidth: 0 } }>
				{ children }
			</Box>
		</Stack>
	);
}

function EntryRow( { label, count, onBrowse } ) {
	const { __ } = wp.i18n || {};
	return (
		<Stack
			direction="row"
			spacing={ 1 }
			p={ 1 }
			alignItems="center"
			justifyContent="space-between"
			sx={{ bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
		>
			<Stack spacing={ 0.25 } flex={ 1 }>
				<Typography variant="caption" color="text.secondary" fontWeight={ 600 }>
					{ label }
				</Typography>
				<Typography variant="body2" fontWeight={ 600 }>
					{ count } { count === 1 ? __( 'item', 'rest-api-firewall' ) : __( 'items', 'rest-api-firewall' ) }
				</Typography>
			</Stack>
			{ onBrowse && (
				<Button
					size="small"
					variant="contained"
					disableElevation
					onClick={ onBrowse }
					sx={{ textTransform: 'none', fontSize: '0.75rem' }}
				>
					{ __( 'Browse', 'rest-api-firewall' ) }
				</Button>
			) }
		</Stack>
	);
}



export default function ApplicationEditorModules( {
	isNew,
	appUsers,
	serverSettings,
	routesCustomCount,
	getModuleEnabled,
	handleModuleToggle,
	handlePanelNavigate,
	navigate,
} ) {
	const { __ } = wp.i18n || {};

	const perPageSet = serverSettings.rest_collection_per_page_settings?.length > 0 ? 
		serverSettings.rest_collection_per_page_settings.filter( ( s ) => s.enabled ) : [];
	const orderSet = serverSettings.rest_collection_orders?.length > 0 ?
		serverSettings.rest_collection_orders.filter( ( s ) => s.enabled ) : [];

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
				<EntryRow
					label={ __( 'Linked Users', 'rest-api-firewall' ) }
					count={ appUsers.length }
					onBrowse={ appUsers.length > 0 ? () => handlePanelNavigate( 1 ) : null }
				/>
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
				{/* Global Enforcement */}
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Enforcement', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Auth & Rate limit', 'rest-api-firewall' ) }>
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
				</Stack>

				<Divider sx={{ my: 1 }} />

				{/* Restrictions */}
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Restrictions', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Disabled routes', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ [ serverSettings.hide_user_routes && 'users', serverSettings.hide_oembed_routes && 'oembed', serverSettings.hide_batch_routes && 'batch' ].filter( Boolean ).length > 0
								? [ serverSettings.hide_user_routes && 'users', serverSettings.hide_oembed_routes && 'oembed', serverSettings.hide_batch_routes && 'batch' ].filter( Boolean ).map( ( r ) => (
									<Chip key={ r } label={ r } size="small" sx={ { fontFamily: 'monospace', fontSize: 10 } } />
								) )
								: <Typography variant="caption">{ __( 'None', 'rest-api-firewall' ) }</Typography>
							}
						</Stack>
					</DataRow>
					<DataRow label={ __( 'Disabled methods', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ ( serverSettings.disabled_methods || [] ).length > 0
								? ( serverSettings.disabled_methods || [] ).map( ( m ) => (
									<Chip key={ m } label={ m.toUpperCase() } size="small" sx={ { fontFamily: 'monospace', fontSize: 10 } } />
								) )
								: <Typography variant="caption">{ __( 'None', 'rest-api-firewall' ) }</Typography>
							}
						</Stack>
					</DataRow>
					<DataRow label={ __( 'Disabled types', 'rest-api-firewall' ) }>
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ ( serverSettings.disabled_post_types || [] ).length > 0
								? ( serverSettings.disabled_post_types || [] ).map( ( p ) => (
										<Chip key={ p } label={ p } size="small" sx={ { fontSize: 10 } } />
									) )
								: <Typography variant="caption">{ __( 'None', 'rest-api-firewall' ) }</Typography>
							}
						</Stack>
					</DataRow>
				</Stack>

				<Divider sx={{ my: 1 }} />

				{/* Advanced */}
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Advanced', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Disabled response', 'rest-api-firewall' ) }>
						<Typography variant="caption" noWrap>
							{ DISABLE_BEHAVIOR_LABELS[ serverSettings.disable_behavior ] || '404 Not Found' }
						</Typography>
					</DataRow>
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
				</Stack>
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
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Settings', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Per Page', 'rest-api-firewall' ) }>
						<Chip
							label={ perPageSet?.length > 0 ? __( 'Enabled', 'rest-api-firewall' ) : __( 'Off', 'rest-api-firewall' ) }
							size="small"
							color={ perPageSet?.length > 0 ? 'success' : 'default' }
							variant="outlined"
							sx={ { fontSize: 10 } }
						/>
					</DataRow>
					<DataRow label={ __( 'Custom Order', 'rest-api-firewall' ) }>
						<Chip
							label={ orderSet?.length > 0 ? __( 'Enabled', 'rest-api-firewall' ) : __( 'Off', 'rest-api-firewall' ) }
							size="small"
							color={ orderSet?.length > 0 ? 'success' : 'default' }
							variant="outlined"
							sx={ { fontSize: 10 } }
						/>
					</DataRow>
				</Stack>
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
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Configuration', 'rest-api-firewall' ) }
					</Typography>
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
				</Stack>
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
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Event-Based Automation', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Triggers & Actions', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Configure automated responses', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</Stack>
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
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Event Notifications', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Configuration', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Outbound event targets', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</Stack>
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
				<Stack spacing={ 0.75 }>
					<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
						{ __( 'Mail & Notifications', 'rest-api-firewall' ) }
					</Typography>
					<DataRow label={ __( 'Server', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'SMTP configuration', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
					<DataRow label={ __( 'Templates', 'rest-api-firewall' ) }>
						<Typography variant="caption" color="text.disabled">
							{ __( 'Email notification templates', 'rest-api-firewall' ) }
						</Typography>
					</DataRow>
				</Stack>
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
						<Stack spacing={ 0.75 }>
							<Typography variant="caption" color="text.secondary" fontWeight={ 600 } sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
								{ __( 'Monitoring', 'rest-api-firewall' ) }
							</Typography>
							<DataRow label={ __( 'Scope', 'rest-api-firewall' ) }>
								<Typography variant="caption" color="text.disabled">
									{ __( 'Global request history & audit trail', 'rest-api-firewall' ) }
								</Typography>
							</DataRow>
						</Stack>
					</PanelCard>
				</span>
			</Tooltip>
		</Box>
	);
}

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
import Button from '@mui/material/Button';

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

function UserRow( { user, onClick } ) {
	const { __ } = wp.i18n || {};
	const name = user.title || user.display_name || `User #${ user.wp_user_id }`;
	const methods = user.allowed_methods || [];
	const ips = user.allowed_ips || [];
	const origins = user.allowed_origins || [];
	const authMethod = user.auth_method && user.auth_method !== 'any' ? user.auth_method : null;

	return (
		<Stack
			onClick={ onClick }
			sx={ {
				px: 0.5,
				pb: 0.5,
				'&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
			} }
		>
			<Button
				size="small"
				variant="text"
				sx={ { alignSelf: 'flex-start', fontSize: 12, mb: 0.5 } }
				onClick={ onClick }
				endIcon={ <ArrowForwardIosIcon sx={ { fontSize: 12 } } /> }
			>
				{ name }
			</Button>

			<DataRow label={ __( 'Auth', 'rest-api-firewall' ) }>
				{ authMethod
					? <Chip label={ authMethod } size="small" variant="outlined" />
					: <Typography variant="caption" color="text.disabled">{ __( 'Any', 'rest-api-firewall' ) }</Typography>
				}
			</DataRow>

			<DataRow label={ __( 'Methods', 'rest-api-firewall' ) }>
				<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
					{ methods.map( ( m ) => (
						<Chip key={ m } label={ m.toUpperCase() } size="small" color="primary" variant="outlined" sx={ { fontSize: 10 } } />
					) ) }
				</Stack>
			</DataRow>

			{ ips.length > 0 && (
				<DataRow label={ __( 'IPs', 'rest-api-firewall' ) }>
					<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
						{ ips.map( ( ip ) => (
							<Chip key={ ip } label={ ip } size="small" sx={ { fontFamily: 'monospace', fontSize: 10 } } />
						) ) }
					</Stack>
				</DataRow>
			) }

			{ origins.length > 0 && (
				<DataRow label={ __( 'Origins', 'rest-api-firewall' ) }>
					<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
						{ origins.map( ( o ) => (
							<Chip key={ o } label={ o } size="small" sx={ { fontFamily: 'monospace', fontSize: 10, maxWidth: 120 } } />
						) ) }
					</Stack>
				</DataRow>
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

				<DataRow label={ __( 'Disabled response', 'rest-api-firewall' ) }>
					<Typography variant="caption" noWrap>
						{ DISABLE_BEHAVIOR_LABELS[ serverSettings.disable_behavior ] || '404 Not Found' }
					</Typography>
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
				{/*<DataRow label={ __( 'Per Page Enforced On', 'rest-api-firewall' ) }>
					<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
						{ perPageSet?.length > 0 ? perPageSet.map( ( s ) => (
							<Chip
								key={ s.label }
								label={ s.label }
								size="small"
								sx={ { fontFamily: 'monospace', fontSize: 10 } }
							/>
						) ) : <Typography variant="caption">{ __( 'None', 'rest-api-firewall' ) }</Typography> }
					</Stack>
				</DataRow>
				<DataRow label={ __( 'Custom Order Set On', 'rest-api-firewall' ) }>
					<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
						{ orderSet?.length > 0 ? orderSet.map( ( s ) => (
							<Chip
								key={ s.label }
								label={ s.label }
								size="small"
								sx={ { fontFamily: 'monospace', fontSize: 10 } }
							/>
						) ) : <Typography variant="caption">{ __( 'None', 'rest-api-firewall' ) }</Typography> }
					</Stack>
				</DataRow>*/}
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

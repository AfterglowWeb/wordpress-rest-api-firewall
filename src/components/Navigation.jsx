import { useState, useCallback } from '@wordpress/element';
import { useLicense } from '../contexts/LicenseContext';
import { useAdminData } from '../contexts/AdminDataContext';
import { useApplication } from '../contexts/ApplicationContext';
import useProActions from '../hooks/useProActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import ApiIcon from '@mui/icons-material/Api';
import WebhookIcon from '@mui/icons-material/Webhook';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';

import AppIdentity from './AppIdentity';
import ApplicationSelector from './ApplicationSelector';
import Documentation from './Documentation/Documentation';

export const DRAWER_WIDTH = 220;
export const APP_BAR_HEIGHT = 75;
export const APP_FOOTER_HEIGHT = 40;
export const WP_ADMIN_BAR_HEIGHT_DESKTOP = 32;
export const WP_ADMIN_BAR_HEIGHT_MOBILE = 46;
export const WP_MENU_WIDTH_MD = 36;
export const WP_MENU_WIDTH_LG = 160;

export default function Navigation( {
	panelGroup,
	onPanelChange,
	migrationNeeded,
	migrationDone,
	schemaUpdateNeeded,
	onOpenMigration,
	showSaveButton,
	onSave,
	saving,
	needsLicense,
} ) {
	const { hasValidLicense } = useLicense();
	const { adminData, updateAdminData } = useAdminData();
	const { dirtyFlag } = useApplication();
	const { save } = useProActions();
	const { __ } = wp.i18n || {};
	const theme = useTheme();
	const isMobile = useMediaQuery( theme.breakpoints.down( 'md' ) );

	const [ mobileOpen, setMobileOpen ] = useState( false );

	// Per-panel module enabled states (driven from adminData.admin_options + IpFilter's own option).
	const moduleKey = {
		1:  { module: 'users', optionKey: 'user_rate_limit_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		2:  { module: 'routes_policy', optionKey: 'firewall_routes_policy_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		3:  { module: 'ip_filter', optionKey: null, label: __( 'Active', 'rest-api-firewall' ) },
		4:  { module: 'collections', optionKey: 'rest_collections_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		5:  { module: 'models', optionKey: 'rest_models_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		6:  { module: 'settings_route', optionKey: 'rest_settings_route_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		7:  { module: 'webhooks', optionKey: 'webhooks_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		8:  { module: 'mails', optionKey: 'mails_enabled', label: __( 'Active', 'rest-api-firewall' ) },
		13: { module: 'automations', optionKey: 'automations_enabled', label: __( 'Active', 'rest-api-firewall' ) },
	};

	// IpFilter reads from its own REST option; store it in local state hydrated on mount.
	const [ ipFilterEnabled, setIpFilterEnabled ] = useState(
		() => !! adminData?.ip_filter_enabled
	);

	const getModuleEnabled = ( pg ) => {
		if ( pg === 3 ) return ipFilterEnabled;
		const key = moduleKey[ pg ]?.optionKey;
		return key ? !! adminData?.admin_options?.[ key ] : null;
	};

	const handleModuleToggle = useCallback(
		( pg, checked ) => {
			const info = moduleKey[ pg ];
			if ( ! info ) return;

			save(
				{
					action: 'rest_api_firewall_activate_module',
					module: info.module,
					enabled: checked ? '1' : '0',
				},
				{
					confirmTitle: checked
						? __( 'Enable Module', 'rest-api-firewall' )
						: __( 'Disable Module', 'rest-api-firewall' ),
					confirmMessage: checked
						? __( 'Enable this module?', 'rest-api-firewall' )
						: __( 'Disable this module?', 'rest-api-firewall' ),
					confirmLabel: checked
						? __( 'Enable', 'rest-api-firewall' )
						: __( 'Disable', 'rest-api-firewall' ),
					successTitle: __( 'Module Updated', 'rest-api-firewall' ),
					successMessage: checked
						? __( 'Module enabled successfully.', 'rest-api-firewall' )
						: __( 'Module disabled successfully.', 'rest-api-firewall' ),
					onSuccess: () => {
						if ( pg === 3 ) {
							setIpFilterEnabled( checked );
						} else {
							updateAdminData( {
								admin_options: {
									...adminData?.admin_options,
									[ info.optionKey ]: checked,
								},
							} );
						}
					},
				}
			);
		},
		[ adminData, updateAdminData, save, __ ] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const menuItems = [
		{
			key: 'applications',
			label: __( 'Applications', 'rest-api-firewall' ),
			breadcrumbPrefix: 'Pro',
			panelGroup: 0,
			icon: AppsOutlinedIcon,
			disabled: ! hasValidLicense,
		},
		{
			type: 'section',
			label: __( 'REST API Firewall', 'rest-api-firewall' ),
		},
		{
			key: 'user-rate-limiting',
			label: __( 'Auth. & Rate Limit', 'rest-api-firewall' ),
			breadcrumbPrefix: 'REST API Firewall',
			panelGroup: 1,
			icon: SecurityOutlined,
		},
		{
			key: 'per-route-settings',
			label: __( 'Routes', 'rest-api-firewall' ),
			breadcrumbPrefix: 'REST API Firewall',
			panelGroup: 2,
			icon: AccountTreeIcon,
		},
		{
			key: 'ip-filtering',
			label: __( 'IP Filtering', 'rest-api-firewall' ),
			breadcrumbPrefix: 'REST API Firewall',
			panelGroup: 3,
			icon: VpnLockOutlinedIcon,
		},

		{
			type: 'section',
			label: __( 'REST API Output', 'rest-api-firewall' ),
		},
		{
			key: 'collections',
			label: __( 'Collections', 'rest-api-firewall' ),
			secondary: 'wp/v2/posts/*',
			breadcrumbPrefix: 'REST API Output',
			panelGroup: 4,
			icon: ApiIcon,
		},
		{
			key: 'models-properties',
			label: __( 'Properties', 'rest-api-firewall' ),
			secondary: 'wp/v2/posts/*',
			breadcrumbPrefix: 'REST API Output',
			panelGroup: 5,
			icon: RuleOutlinedIcon,
		},
		{
			key: 'settings-route',
			label: __( 'Settings Route', 'rest-api-firewall' ),
			breadcrumbPrefix: 'REST API Output',
			secondary: 'wp/v2/settings',
			panelGroup: 6,
			icon: BusinessOutlinedIcon,
		},

		{ type: 'section', label: __( 'Integrations', 'rest-api-firewall' ) },
		{
			key: 'automations',
			label: __( 'Automations', 'rest-api-firewall' ),
			breadcrumbPrefix: 'Integrations',
			panelGroup: 13,
			icon: AutoFixHighOutlinedIcon,
			disabled: ! hasValidLicense,
		},
		{
			key: 'webhook',
			label: hasValidLicense
				? __( 'Webhooks', 'rest-api-firewall' )
				: __( 'Webhook', 'rest-api-firewall' ),
			breadcrumbPrefix: 'Integrations',
			panelGroup: 7,
			icon: WebhookIcon,
		},
		{
			key: 'emails',
			label: __( 'Emails', 'rest-api-firewall' ),
			breadcrumbPrefix: 'Integrations',
			panelGroup: 8,
			icon: EmailOutlined,
			disabled: ! hasValidLicense,
		},

		{ type: 'section', label: __( '', 'rest-api-firewall' ) },
		{
			key: 'logs',
			label: __( 'Logs', 'rest-api-firewall' ),
			breadcrumbPrefix: 'All Applications',
			panelGroup: 12,
			icon: AssessmentOutlinedIcon,
			disabled: ! hasValidLicense,
		},

		{ type: 'section', label: __( '', 'rest-api-firewall' ) },
		{
			key: 'theme',
			label: __( 'Theme', 'rest-api-firewall' ),
			breadcrumbPrefix: 'Modules',
			panelGroup: 9,
			icon: PaletteOutlined,
		},
		{
			key: 'license',
			label: __( 'License', 'rest-api-firewall' ),
			breadcrumbPrefix: '',
			panelGroup: 10,
			icon: CardMembershipOutlinedIcon,
		},
		...( migrationNeeded && ! migrationDone
			? [
					{
						key: 'migrate-pro',
						label: __( 'Migrate to Pro', 'rest-api-firewall' ),
						icon: RocketLaunchOutlinedIcon,
						badge: true,
						action: onOpenMigration,
					},
			  ]
			: [] ),
		{
			key: 'configuration',
			label: __( 'Configuration', 'rest-api-firewall' ),
			breadcrumbPrefix: '',
			panelGroup: 11,
			icon: SettingsOutlinedIcon,
			badge: schemaUpdateNeeded && ! migrationDone,
		},
	];

	const activeMenuItem =
		menuItems.find( ( m ) => m.panelGroup === panelGroup ) || null;

	return (
		<>
			<Drawer
				variant={ isMobile ? 'temporary' : 'permanent' }
				anchor="left"
				open={ isMobile ? mobileOpen : true }
				onClose={ () => setMobileOpen( false ) }
				sx={ {
					'.MuiPaper-root': {
						width: DRAWER_WIDTH,
						top: {
							xs: WP_ADMIN_BAR_HEIGHT_MOBILE,
							md: WP_ADMIN_BAR_HEIGHT_DESKTOP,
						},
						left: {
							xs: 0,
							md: WP_MENU_WIDTH_MD,
							lg: WP_MENU_WIDTH_LG,
						},
						height: {
							xs: `calc(100vh - ${
								WP_ADMIN_BAR_HEIGHT_MOBILE
							}px)`,
							md: `calc(100vh - ${
								WP_ADMIN_BAR_HEIGHT_DESKTOP
							}px)`,
						},
						overflowY: 'auto',
					},
				} }
			>
				<AppIdentity />
				<Divider />

				<List component="nav" disablePadding sx={{pb:4}}>
					{ menuItems.map( ( item, index ) => {
						if ( item.type === 'section' ) {
							return (
								<Stack
									sx={ { mt: 1 === index ? 0 : 2 } }
									key={ `section-${ index }` }
								>
									{ 0 !== index && <Divider /> }

									{ item.label ? (
										<Typography
											key={ `section-${ index }` }
											variant="caption"
											sx={ {
												display: 'block',
												px: 2,
												mb: 1,
												mt: 2,
												textTransform: 'uppercase',
												letterSpacing: 0.5,
												fontSize: '0.7rem',
												color: 'text.secondary',
											} }
										>
											{ item.label }
										</Typography>
									) : (
										<Stack py={ 1 } />
									) }
								</Stack>
							);
						}

						const isActive = panelGroup === item.panelGroup;
						const Icon = item.icon;

						return (
							<Tooltip
								key={ item.key }
								title={
									item.disabled
										? __(
												'License required',
												'rest-api-firewall'
										  )
										: ''
								}
								placement="right"
							>
								<span>
									<ListItemButton
										sx={ {
											px: 3,
											backgroundColor: isActive
												? 'grey.100'
												: '',
										} }
										disabled={ !! item.disabled }
										onClick={ () => {
											if ( item.action ) {
												item.action();
											} else {
												onPanelChange( item.panelGroup );
											}
											setMobileOpen( false );
										} }
									>
										{ Icon && (
											<ListItemIcon
												sx={ {
													px: 1,
													minWidth: 32,
													color: isActive
														? 'primary.main'
														: 'text.secondary',
												} }
											>
												<Badge
													color="error"
													variant="dot"
													invisible={ ! item.badge }
												>
													<Icon fontSize="small" />
												</Badge>
											</ListItemIcon>
										) }

										<ListItemText
											sx={ {
												'& .MuiListItemText-primary': {
													fontSize: '0.9rem',
													lineHeight: 'normal',
												},
											} }
											primary={ item.label }
											secondary={
												<Typography
													variant="caption"
													color="text.secondary"
												>
													{ item.secondary }
												</Typography>
											}
										/>
									</ListItemButton>
								</span>
							</Tooltip>
						);
					} ) }
				</List>
			</Drawer>

			<Slide in={ !dirtyFlag.has } direction="down">
				<AppBar
					elevation={ 0 }
					sx={ {
						'&.MuiAppBar-positionFixed': {
							top: {
								xs: WP_ADMIN_BAR_HEIGHT_MOBILE,
								md: WP_ADMIN_BAR_HEIGHT_DESKTOP,
							},
							left: {
								xs: 0,
								md: DRAWER_WIDTH + WP_MENU_WIDTH_MD,
								lg: DRAWER_WIDTH + WP_MENU_WIDTH_LG,
							},
							width: {
								xs: '100%',
								md: `calc(100% - ${ DRAWER_WIDTH + WP_MENU_WIDTH_MD }px)`,
								lg: `calc(100% - ${ DRAWER_WIDTH + WP_MENU_WIDTH_LG }px)`,
							},
						},
					} }
				>
					<Toolbar
						variant="dense"
						sx={ {
							bgcolor: 'background.paper',
							borderBottom: 1,
							borderColor: 'divider',
							px: 2,
							height: { xs: 'auto', xl: APP_BAR_HEIGHT },
                    		minHeight: APP_BAR_HEIGHT,
							overflow: 'hidden',
							gap: 2,
						} }
					>
						{ isMobile && (
							<IconButton
								edge="start"
								onClick={ () => setMobileOpen( true ) }
								sx={ { mr: 1, color: 'text.primary' } }
							>
								<MenuIcon />
							</IconButton>
						) }

						{ hasValidLicense &&
							( panelGroup < 9 || panelGroup === 13 ) && (
								<ApplicationSelector />
							) }

						
						<Stack direction="row" alignItems="center" gap={ 2 }>

							<Stack>
								{ activeMenuItem?.breadcrumbPrefix && (
									<Typography
										variant="caption"
										color="text.secondary"
										sx={ {
											display: 'block',
											textTransform: 'uppercase',
											letterSpacing: 0.5,
										} }
									>
										{ activeMenuItem.breadcrumbPrefix }
									</Typography>
								) }
								<Typography
									variant="h6"
									fontWeight={ 600 }
									color="text.primary"
									sx={ { lineHeight: 1.2 } }
								>
									{ activeMenuItem?.label || '' }
									{ activeMenuItem?.secondary && (
										<Typography
											variant="caption"
											color="text.secondary"
											sx={ { ml: 1 } }
										>
											{ activeMenuItem.secondary }
										</Typography>
									) }
								</Typography>
							</Stack>

							<Divider variant="middle" flexItem orientation="vertical" />

							{ hasValidLicense && moduleKey[ panelGroup ] !== undefined && (
								<FormControlLabel
								control={
									<Switch
										size="small"
										checked={ !! getModuleEnabled( panelGroup ) }
										onChange={ ( e ) => handleModuleToggle( panelGroup, e.target.checked ) }
									/>
								}
								sx={{ 
									flex: 0,
									'.MuiFormControlLabel-label': { color: 'text.primary' } }}
								label={ 'Enable' }
								/>
							) }
							
						</Stack>

						<Stack flex={ 1 }/>

						<Stack direction="row" gap={ 2 } alignItems="center">
							<Documentation
								page="getting-started"
								buttonText="Doc."
							/>

							{ showSaveButton && (
								<Tooltip
									followCursor
									title={
										needsLicense
											? __(
													'Licence required',
													'rest-api-firewall'
											)
											: ''
									}
								>
									<Box>
										<Button
											variant="contained"
											disableElevation
											size="small"
											onClick={ onSave }
											disabled={ needsLicense || saving }
										>
											{ __( 'Save', 'rest-api-firewall' ) }
										</Button>
									</Box>
								</Tooltip>
							) }
						</Stack>
					</Toolbar>
				</AppBar>
			</Slide>
		</>
	);
}

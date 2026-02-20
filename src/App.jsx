import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { DialogProvider } from './contexts/DialogContext';
import useSettingsForm from './contexts/useSettingsForm';
import useSaveOptions from './hooks/useSaveOptions';

import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Drawer from '@mui/material/Drawer';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';

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

import ConfirmDialog from './components/ConfirmDialog';
import ThemeSettings from './components/ThemeSettings';

import Properties from './components/ApiOutput/Properties';
import SiteSettings from './components/ApiOutput/SettingsRoute';
import Firewall from './components/Firewall/Firewall';
import Smtp from './components/Emails/Smtp';
import Webhook from './components/Webhook/Webhook';

import Documentation from './components/Documentation';
import LicenseDialog from './components/LicenseDialog';
import Collections from './components/ApiOutput/Collections';

const DRAWER_WIDTH = 220;
const APP_BAR_HEIGHT = 75;
const APP_FOOTER_HEIGHT = 40;
const WP_ADMIN_BAR_HEIGHT_DESKTOP = 32;   // >= md.  : desktop admin bar
const WP_ADMIN_BAR_HEIGHT_MOBILE  = 46;   // < md.   : mobile admin bar
const WP_MENU_WIDTH_MD = 36;              // md → lg : collapsed menu
const WP_MENU_WIDTH_LG = 160;             // lg+     : complete menu

const AppLogo = styled( Avatar )( () => ( {
	width: 48,
	height: 48,
	background: 'linear-gradient(307deg, #ffb7c4 0%, #ff002e 100%)',
	borderRadius: 12,
	fontSize: '1.4rem',
	fontWeight: 500,
	fontFamily: 'Helvetica, Arial, sans-serif',
	color: 'white',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	position: 'relative',
} ) );

function AppContent() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { save, saving } = useSaveOptions();
	const theme = useTheme();
	const isMobile = useMediaQuery( theme.breakpoints.down( 'md' ) );

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ mobileOpen, setMobileOpen ] = useState( false );
	const [ panelGroup, setPanelGroup ] = useState( 1 );
	const [ themeStatus, setThemeStatus ] = useState( null );

	const { form, setField, setSlider, pickGroup } = useSettingsForm( {
		adminData,
	} );

	const menuItems = [
	{ type: 'section', label: __( 'Firewall', 'rest-api-firewall' ) },
	{ key: 'user-rate-limiting', label: __( 'Auth. & Rate Limit', 'rest-api-firewall' ), breadcrumbPrefix: 'Firewall', panelGroup: 1, icon: SecurityOutlined },
	{ key: 'per-route-settings', label: __( 'Routes', 'rest-api-firewall' ), breadcrumbPrefix: 'Firewall', panelGroup: 3, icon: AccountTreeIcon },
	{ key: 'ip-filtering', label: __( 'IP Filtering', 'rest-api-firewall' ), breadcrumbPrefix: 'Firewall', panelGroup: 2, icon: VpnLockOutlinedIcon },

	{ type: 'section', label: __( 'API Output', 'rest-api-firewall')},
	{ key: 'collections', label: __( 'Collections', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelGroup: 4, icon: ApiIcon },
	{ key: 'models-properties', label: __( 'Properties', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelGroup: 5, icon: RuleOutlinedIcon },
	{ key: 'settings-route', label: __( 'Settings Route', 'rest-api-firewall'),  breadcrumbPrefix: 'API Output', secondary: 'wp/v2/settings', panelGroup: 6, icon: BusinessOutlinedIcon },
	
	{ type: 'section', label: __( 'Integrations', 'rest-api-firewall') },
	{ key: 'webhook', label: __( 'Webhook', 'rest-api-firewall' ), breadcrumbPrefix: 'Integrations', panelGroup: 7, icon: WebhookIcon },
	{ key: 'emails', label: __( 'Emails', 'rest-api-firewall' ), breadcrumbPrefix: 'Integrations', panelGroup: 8, icon: EmailOutlined },
	
	{ type: 'section', label: __( '', 'rest-api-firewall') },
	{ key: 'theme', label: __( 'Theme', 'rest-api-firewall' ), breadcrumbPrefix: 'Modules', panelGroup: 9, icon: PaletteOutlined },
	{ key: 'license', label: __( 'License Management', 'rest-api-firewall' ), breadcrumbPrefix: '', panelGroup: 10, icon: CardMembershipOutlinedIcon },
];

	useEffect( () => {
		const lastTab =
			window.localStorage.getItem( 'rest_api_firewall_last_tab' ) || null;
		if ( lastTab ) {
			setPanelGroup( Number( lastTab ) );
		}
	}, [] );

	useEffect( () => {
		if ( Array.isArray( adminData?.post_types ) ) {
			setPostTypes( adminData.post_types );
		}
	}, [ adminData ] );

	const handleMenuClick = useCallback(
		( newIndex, anchor ) => {
			if(! newIndex && ! anchor) {
				return false;
			}
			const changing = panelGroup !== newIndex;
			if ( changing ) {
				setPanelGroup( newIndex );
				window.localStorage.setItem(
					'rest_api_firewall_last_tab',
					newIndex
				);
			}
		},
		[ panelGroup ]
	);

	const activeMenuItem = menuItems.find( ( m ) => m.panelGroup === panelGroup ) || null;

	const handleSaveFirewall = () => {
		save( pickGroup( 'firewall' ), {
			successTitle: __( 'Firewall Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Firewall settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save firewall settings?', 'rest-api-firewall' ),
		} );
	};

	const handleSaveSchemas = () => {
		save( pickGroup( 'schema' ), {
			successTitle: __( 'API Output Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Schemas settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save API output settings?', 'rest-api-firewall' ),
		} );
	};

	const handleSaveWebhook = () => {
		save( pickGroup( 'webhook' ), {
			successTitle: __( 'Webhook Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Webhook settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save webhook settings?', 'rest-api-firewall' ),
		} );
	};

	const handleSaveEmails = () => {
		save( pickGroup( 'email' ), {
			successTitle: __( 'Emails Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Email settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save email settings?', 'rest-api-firewall' ),
		} );
	};

	const handleSaveTheme = () => {
		save( pickGroup( 'theme' ), {
			successTitle: __( 'Theme Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Theme settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save theme settings?', 'rest-api-firewall' ),
		} );
	};

	if ( ! adminData ) {
		return null;
	}

	return (
		<Box sx={ { display: 'flex' } }>
			
			<Drawer
			variant={ isMobile ? 'temporary' : 'permanent' }
			anchor="left"
			open={ isMobile ? mobileOpen : true }
			onClose={ () => setMobileOpen( false ) }
			sx={{
				'.MuiPaper-root': {
				width: DRAWER_WIDTH,
				top: { xs: WP_ADMIN_BAR_HEIGHT_MOBILE, md: WP_ADMIN_BAR_HEIGHT_DESKTOP },
				left: { xs: 0, md: WP_MENU_WIDTH_MD, lg: WP_MENU_WIDTH_LG },
				minHeight: {
					xs: `calc(100vh - ${ WP_ADMIN_BAR_HEIGHT_MOBILE + APP_FOOTER_HEIGHT }px)`,
					md: `calc(100vh - ${ WP_ADMIN_BAR_HEIGHT_DESKTOP + APP_FOOTER_HEIGHT }px)`,
				},
				overflowY: 'auto',
				}
			}}
			>
				<Box sx={ { p: 2, height:75, display:'flex', gap:1, boxSizing: 'border-box' } }>
					<AppLogo>hT.</AppLogo>
					<Box>
					<Typography variant="subtitle2" fontWeight={ 600 }>
						{ adminData.plugin_name }
					</Typography>
					<Typography variant="caption" color="text.secondary">
						v{ adminData.plugin_version }
					</Typography>
					</Box>
				</Box>
				<Divider />
				
				<List component="nav" disablePadding>
					{menuItems.map((item, index) => {

						if (item.type === 'section') {
							return (
						
								<Stack sx={{ mt: 2 }} key={`section-${index}`}>
									{0 !== index && <Divider  />}

									{item.label ? <Typography
									key={`section-${index}`}
									variant="caption"
									sx={{
										display: 'block', 
										px: 2,
										mb: 1,
										mt: 2,
										textTransform: 'uppercase',
										letterSpacing: 0.5,
										fontSize: '0.7rem',
										color: 'text.secondary',
									}}
									>
										{item.label}
									</Typography> : <Stack py={1} />}
								</Stack>
								
							);
						}

						const isActive = panelGroup === item.panelGroup;
						const Icon = item.icon;

						return (
							<ListItemButton
								sx={{
									px: 3,
									backgroundColor: isActive ? 'grey.100' : '',
								}}
								key={item.key}
								onClick={ () => { handleMenuClick( item.panelGroup ); setMobileOpen( false ); } }
							>
								{Icon && (
									<ListItemIcon
										sx={{
											px: 1,
											minWidth: 32,
											color: isActive ? 'primary.main' : 'text.secondary',
										}}
									>
										<Icon fontSize="small" />
									</ListItemIcon>
								)}
								
								<ListItemText
									sx={{'& .MuiTypography-root': 
										{
											fontSize:'0.9rem',
											lineHeight:'normal',
										}
									}}
									primary={item.label}
									secondary={item.secondary}
								/>

								

							</ListItemButton>
						);
					})}
				</List>


			</Drawer>

			<AppBar
			elevation={0}
			sx={{
				'&.MuiAppBar-positionFixed': {
					top: { xs: WP_ADMIN_BAR_HEIGHT_MOBILE, md: WP_ADMIN_BAR_HEIGHT_DESKTOP },
					left: { xs: 0, md: DRAWER_WIDTH + WP_MENU_WIDTH_MD, lg: DRAWER_WIDTH + WP_MENU_WIDTH_LG },
					width: {
						xs: '100%',
						md: `calc(100% - ${ DRAWER_WIDTH + WP_MENU_WIDTH_MD }px)`,
						lg: `calc(100% - ${ DRAWER_WIDTH + WP_MENU_WIDTH_LG }px)`,
					},
				}
			}}
			>
				<Toolbar
						variant="dense"
						sx={ {
							bgcolor: 'background.paper',
							borderBottom: 1,
							borderColor: 'divider',
							px: 2,
							height: APP_BAR_HEIGHT,
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
					<Box sx={ { flex: 1, minWidth: 0 } }>
						{ activeMenuItem?.breadcrumbPrefix && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={ { display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 } }
							>
								{ activeMenuItem.breadcrumbPrefix }
							</Typography>
						) }
						<Typography variant="h6" fontWeight={ 600 } color="text.primary" sx={ { lineHeight: 1.2 } }>
							{ activeMenuItem?.label || '' }
						</Typography>
					</Box>
					<Stack direction="row" gap={ 2 } alignItems="center">
						<Documentation
							page="getting-started"
							buttonText="Doc."
						/>

						{panelGroup >= 1 && panelGroup <= 3 && (
							<Button
								variant="contained"
								disableElevation
								size="small"
								onClick={ handleSaveFirewall }
								disabled={ saving }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						) }
						
						{ panelGroup >= 4 && panelGroup <= 6 && (
							<Button
								variant="contained"
								disableElevation
								size="small"
								onClick={ handleSaveSchemas }
								disabled={ saving }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						) }

						{ panelGroup === 7 && (
							<Button
								variant="contained"
								disableElevation
								size="small"
								onClick={ handleSaveWebhook }
								disabled={ saving }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						) }

						{ panelGroup === 8 && (
							<Button
								variant="contained"
								disableElevation
								size="small"
								onClick={ handleSaveEmails }
								disabled={ saving }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						) }

						{ panelGroup === 9 && themeStatus?.active && (
							<Button
								variant="contained"
								disableElevation
								size="small"
								onClick={ handleSaveTheme }
								disabled={ saving }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						) }
					</Stack>
						
				</Toolbar>
			</AppBar>

			<Box sx={ { 
				flexGrow: 1, 
				minWidth: 0, 
				pl: { xs: 0, md: DRAWER_WIDTH + 'px' },
				pt: APP_BAR_HEIGHT + 'px',
				minHeight: {
					xs: `calc(100svh - ${ APP_FOOTER_HEIGHT + APP_BAR_HEIGHT + WP_ADMIN_BAR_HEIGHT_MOBILE }px)`,
					md: `calc(100svh - ${ APP_FOOTER_HEIGHT + APP_BAR_HEIGHT + WP_ADMIN_BAR_HEIGHT_DESKTOP }px)`,
				},
				bgcolor: theme.palette.background.paper
				} }>
				
				<Box sx={ { p: 3 } }>
					<Firewall 
						panelGroup={ panelGroup }
						form={ form }
						setField={ setField }
						postTypes={ postTypes }
					 />

					{ panelGroup === 4 && (
					<Stack
						id="section-collections-per-page"
					>
						<Collections
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					</Stack>)}
					
					{ panelGroup === 5 && (
					<Stack
						id="section-models-properties"
					>
						<Properties
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					</Stack>)}

					{ panelGroup === 6 && (
					<Stack
						id="section-settings-route"
					>
						<SiteSettings 
						form={ form } 
						setField={ setField } />
					</Stack>)}

					{ panelGroup === 7 && (
						<Webhook form={ form } setField={ setField } />
					) }


					{ panelGroup === 8 && (
						<Smtp form={ form } setField={ setField } />
					) }

					{ panelGroup === 9 && (
						<ThemeSettings
							form={ form }
							setField={ setField }
							setSlider={ setSlider }
							themeStatus={ themeStatus }
							setThemeStatus={ setThemeStatus }
						/>
					) }

					{ panelGroup === 10 && (
						<LicenseDialog />
					) }

				</Box>
			</Box>
		</Box>
	);
}

export default function App() {
	return (
		<DialogProvider>
			<AppContent />
			<ConfirmDialog />
		</DialogProvider>
	);
}

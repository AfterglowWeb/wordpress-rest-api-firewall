import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

import { DialogProvider } from './contexts/DialogContext';
import useSettingsForm from './contexts/useSettingsForm';
import useSaveOptions from './hooks/useSaveOptions';

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
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';

import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ApiIcon from '@mui/icons-material/Api';

import ConfirmDialog from './components/ConfirmDialog';
import ThemeSettings from './components/ThemeSettings';

import ModelsProperties from './components/ApiOutput/ModelsProperties';
import SiteSettings from './components/ApiOutput/SettingsRoute';
import CollectionSorting from './components/ApiOutput/CollectionSorting';
import PropertiesCleanup from './components/ApiOutput/PropertiesCleanup';
import ModelsEmbed from './components/ApiOutput/ModelsEmbed';
import CollectionsPerPage from './components/ApiOutput/CollectionsPerPage';
import Firewall from './components/Firewall/Firewall';
import Smtp from './components/Emails/Smtp';
import Webhook from './components/Webhook/Webhook';

import Documentation from './components/Documentation';
import LicenseDialog from './components/LicenseDialog';
import AppBar from '@mui/material/AppBar';

const DRAWER_WIDTH = 220;
const APP_BAR_HEIGHT = 75;
const WP_MENU_WIDTH = 160;
const WP_ADMIN_BAR_HEIGHT = 32;
const WP_FOOTER_HEIGHT = 80;

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

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ panelIndex, setPanelIndex ] = useState( 0 );
	const [ activeAnchor, setActiveAnchor ] = useState( null );
	const [ themeStatus, setThemeStatus ] = useState( null );

	const { form, setField, setSlider, pickGroup } = useSettingsForm( {
		adminData,
	} );

	const menuItems = [
	{ type: 'section', label: __( 'Firewall', 'rest-api-firewall' ), icon: SecurityOutlined },
	{ key: 'user-rate-limiting', label: __( 'User & Rate Limiting', 'rest-api-firewall' ), breadcrumbPrefix: 'Firewall', panelIndex: 1 },
	{ key: 'ip-filtering', label: __( 'IP Filtering', 'rest-api-firewall' ), breadcrumbPrefix: 'Firewall', panelIndex: 2 },
	{ key: 'per-route-settings', label: __( 'Per Route Settings', 'rest-api-firewall' ), breadcrumbPrefix: 'Firewall', panelIndex: 3 },

	{ type: 'section', label: __( 'API Output', 'rest-api-firewall'), icon: ApiIcon },
	{ key: 'collections-per-page', label: __( 'Collections Per Page', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelIndex: 4 },
	{ key: 'collection-sorting', label: __( 'Collections Sorting', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelIndex: 5 },
	{ key: 'properties-cleanup', label: __( 'Properties Cleanup', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelIndex: 6 },
	{ key: 'models-embed', label: __( 'Properties Embed', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelIndex: 7 },
	{ key: 'models-properties', label: __( 'Properties Model', 'rest-api-firewall' ), breadcrumbPrefix: 'API Output', panelIndex: 8 },
	
	{ key: 'settings-route', label: __( 'Settings Route', 'rest-api-firewall' ), panelIndex: 9 },
	
	{ type: 'section', label: __( 'Integrations', 'rest-api-firewall'), icon: ApiIcon },
	{ key: 'webhook', label: __( 'Webhook', 'rest-api-firewall' ), breadcrumbPrefix: 'Integrations', panelIndex: 10, icon: SyncOutlined },
	{ key: 'emails', label: __( 'Emails', 'rest-api-firewall' ), breadcrumbPrefix: 'Integrations', panelIndex: 11, icon: EmailOutlined },
	
	{ type: 'section', label: __( 'Modules', 'rest-api-firewall'), icon: ApiIcon },
	{ key: 'theme', label: __( 'Theme', 'rest-api-firewall' ), breadcrumbPrefix: 'Modules', panelIndex: 12, icon: PaletteOutlined },

];

	useEffect( () => {
		const lastTab =
			window.localStorage.getItem( 'rest_api_firewall_last_tab' ) || null;
		if ( lastTab ) {
			setPanelIndex( Number( lastTab ) );
		}
	}, [] );

	useEffect( () => {
		if ( Array.isArray( adminData?.post_types ) ) {
			setPostTypes( adminData.post_types );
		}
	}, [ adminData ] );

	const scrollToAnchor = useCallback( ( anchor ) => {
		setTimeout( () => {
			const el = document.getElementById( anchor );
			if ( el ) {
				el.scrollIntoView( { behavior: 'smooth', block: 'start' } );
			}
		}, 50 );
	}, [] );

	const handleMenuClick = useCallback(
		( newIndex, anchor ) => {
			if(! newIndex && ! anchor) {
				return false;
			}
			const changing = panelIndex !== newIndex;
			if ( changing ) {
				setPanelIndex( newIndex );
				window.localStorage.setItem(
					'rest_api_firewall_last_tab',
					newIndex
				);
			}
			setActiveAnchor( anchor || null );
			if ( anchor ) {
				if ( changing ) {
					scrollToAnchor( anchor );
				} else {
					const el = document.getElementById( anchor );
					if ( el ) {
						el.scrollIntoView( {
							behavior: 'smooth',
							block: 'start',
						} );
					}
				}
			}
		},
		[ panelIndex, scrollToAnchor ]
	);

	const getBreadcrumb = () => {
		const item = menuItems.find( ( m ) => m.panelIndex === panelIndex );
		if ( ! item ) return [];
		const trail = [ item.breadcrumbPrefix ];
		trail.push(item.label);
		if ( ! activeAnchor || ! item.subItems ) return trail;
		for ( const sub of item.subItems ) {
			if ( sub.anchor === activeAnchor ) {
				trail.push( sub.label );
				return trail;
			}
			if ( sub.subItems ) {
				for ( const subsub of sub.subItems ) {
					if ( subsub.anchor === activeAnchor ) {
						trail.push( sub.label );
						trail.push( subsub.label );
						return trail;
					}
				}
			}
		}
		return trail;
	};

	const breadcrumb = getBreadcrumb();

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
			confirmMessage: __( 'Save schemas settings?', 'rest-api-firewall' ),
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
			variant="permanent"
			anchor="left"
			sx={{
				'.MuiPaper-root': {
				width: DRAWER_WIDTH,
				top: WP_ADMIN_BAR_HEIGHT,
				left: WP_MENU_WIDTH,
				maxHeight: `calc(100vh - ${WP_ADMIN_BAR_HEIGHT + WP_FOOTER_HEIGHT}px)`,
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
						const Icon = item.icon;
						return (
							<>
							<Box key={`section-${index}`} sx={{ mt: 3, mb: 1, px: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
								
								<Typography
									variant="caption"
									sx={{
										textTransform: 'uppercase',
										fontWeight: 700,
										letterSpacing: 1,
										fontSize: '0.65rem',
										color: 'text.disabled',
									}}
								>
									{item.label}
								</Typography>
							</Box>
							</>
						);
					}

					if (item.type === 'subsection') {
						const Icon = item.icon;
						return (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
					
							<Typography
								key={`sub-${index}`}
								variant="caption"
								sx={{
									display: 'block',
									px: 3,
									pt: 2,
									pb: 0.5,
									fontWeight: 600,
									fontSize: '0.7rem',
									color: 'text.secondary',
								}}
							>
								{item.label}
							</Typography>
							</Box>
						);
					}

					const isActive = panelIndex === item.panelIndex;
					const Icon = item.icon;

					return (
						<ListItemButton
							key={item.key}
							onClick={() => handleMenuClick(item.panelIndex)}
						>
							{Icon && (
								<ListItemIcon
									sx={{
										minWidth: 32,
										color: isActive ? 'primary.main' : 'text.secondary',
									}}
								>
									<Icon fontSize="small" />
								</ListItemIcon>
							)}

							<ListItemText
								primary={item.label}

							/>
						</ListItemButton>
					);
				})}
			</List>
			<Documentation
				page="getting-started"
				buttonText="Documentation"
			/>
			<LicenseDialog />
			</Drawer>

			<AppBar
			elevation={0}
			sx={{
				'&.MuiAppBar-positionFixed': {
					top: WP_ADMIN_BAR_HEIGHT,
					left: DRAWER_WIDTH + WP_MENU_WIDTH,
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
						<Breadcrumbs
							separator={ <NavigateNextIcon sx={ { fontSize: 16 } } /> }
							sx={ { flex: 1, '& .MuiBreadcrumbs-li': { mb: 0 }} }
						>
							{ breadcrumb.map( ( label, i ) => (
								<Typography
									key={ i }
									variant="h6"
									fontWeight={ i === 0 ? 600 : 400 }
									color={ i === breadcrumb.length - 1 ? 'text.primary' : 'text.secondary' }
								>
									{ label }
								</Typography>
							) ) }
						</Breadcrumbs>

						{ panelIndex >= 1 && panelIndex <= 3 && (
						<Button
							variant="contained"
							disableElevation
							size="small"
							onClick={ handleSaveFirewall }
							disabled={ saving }
						>
							{ __( 'Save', 'rest-api-firewall' ) }
						</Button>) }
						
						{ panelIndex >= 4 && panelIndex <= 10 && (
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

						{ panelIndex === 11 && (
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
						{ panelIndex === 12 && themeStatus?.active && (
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
						{ panelIndex === 13 && (
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
				</Toolbar>
			</AppBar>

			<Box sx={ { 
				flexGrow: 1, 
				minWidth: 0, 
				pl: DRAWER_WIDTH + 'px',
				pt: (APP_BAR_HEIGHT) + 'px',
				minHeight: `calc(100svh - ${(WP_FOOTER_HEIGHT + APP_BAR_HEIGHT + WP_ADMIN_BAR_HEIGHT)}px)`, 
				bgcolor: theme.palette.background.paper
				} }>
				
				<Box sx={ { p: 3 } }>
					<Firewall 
						panelIndex={ panelIndex }
						form={ form }
						setField={ setField }
						postTypes={ postTypes }
					 />

					{ panelIndex === 4 && (
					<Card
						id="section-collections-per-page"
						variant="outlined"
					>
						<CollectionsPerPage
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					</Card>)}
					{ panelIndex === 5 && (
					<Card
						id="section-collection-sorting"
						variant="outlined"
					>
						<CollectionSorting
							form={form}
							setField={setField}
							postTypes={postTypes}
						/>
					</Card>)}
					{ panelIndex === 6 && (
					<Card
						id="section-properties-cleanup"
						variant="outlined"
					>
						<PropertiesCleanup
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					</Card>)}
					{ panelIndex === 7 && (
					<Card
						id="section-models-embed"
						variant="outlined"
					>
						<ModelsEmbed
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					</Card>)}
					{ panelIndex === 8 && (
					<Card
						id="section-models-properties"
						variant="outlined"
					>
						<ModelsProperties
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					</Card>)}
					{ panelIndex === 9 && (
					<Card
						id="section-settings-route"
						variant="outlined"
					>
						<SiteSettings 
						form={ form } 
						setField={ setField } />
					</Card>)}

					{ panelIndex === 10 && (
						<Webhook form={ form } setField={ setField } />
					) }

					{ panelIndex === 11 && (
						<ThemeSettings
							form={ form }
							setField={ setField }
							setSlider={ setSlider }
							themeStatus={ themeStatus }
							setThemeStatus={ setThemeStatus }
						/>
					) }

					{ panelIndex === 12 && (
						<Smtp form={ form } setField={ setField } />
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

import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { DialogProvider } from './contexts/DialogContext';
import { useLicense } from './contexts/LicenseContext';
import { ApplicationProvider, useApplication } from './contexts/ApplicationContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';

import useSettingsForm from './hooks/useSettingsForm';
import useSaveOptions from './hooks/useSaveOptions';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import ConfirmDialog from './components/ConfirmDialog';
import MigrationDialog from './components/Migration/MigrationDialog';
import Navigation, {
	APP_BAR_HEIGHT,
	APP_FOOTER_HEIGHT,
	DRAWER_WIDTH,
	WP_ADMIN_BAR_HEIGHT_DESKTOP,
	WP_ADMIN_BAR_HEIGHT_MOBILE,
} from './components/Navigation';

import ConfigurationPanel from './components/ConfigurationDialog';

import RoutesPanel from './components/Firewall/Routes/RoutesPanel';
import IpFilter from './components/Firewall/IpFilter/IpFilter';
import RateLimit from './components/Firewall/Users/RateLimit';
import RestApiUser from './components/Firewall/Users/RestApiSingleUser';

import Properties from './components/Models/Properties';
import SettingsRoute from './components/Models/SettingsRoute';
import Collections from './components/Models/Collections';
import Models from './components/Models/Models';

import Webhook from './components/Webhooks/Webhook';
import Webhooks from './components/Webhooks/Webhooks';

import MailsPanel from './components/Mails/MailsPanel';

import Logs from './components/Logs/Logs';

import Automations from './components/Automations/Automations';

import ThemeSettings from './components/Theme/ThemeSettings';

import Applications from './components/Applications/Applications';

import License from './components/License/License';

import Users from './components/Firewall/Users/Users';
import GlobalSecurity from './components/GlobalSecurity/GlobalSecurity';

function AppContent() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { save, saving } = useSaveOptions();
	const { hasValidLicense } = useLicense();
	const { dirtyFlag } = useApplication();
	const { panel, navigate } = useNavigation();

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ themeStatus, setThemeStatus ] = useState( null );

	const migrationNeeded = !! window.restApiFirewallPro?.migrationNeeded;
	const schemaUpdateNeeded = !! window.restApiFirewallPro?.schemaUpdateNeeded;

	const [ migrationOpen, setMigrationOpen ] = useState(
		schemaUpdateNeeded || migrationNeeded
	);
	const [ migrationDone, setMigrationDone ] = useState( false );

	const { form, setField, setSlider, pickGroup } = useSettingsForm( {
		adminData,
	} );

	useEffect( () => {
		if ( Array.isArray( adminData?.post_types ) ) {
			setPostTypes( adminData.post_types );
		}
	}, [ adminData ] );

	const SAVE_CONFIG = {
		firewall_auth_rate: {
			successTitle: __( 'Settings Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Auth & rate limit settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __(
				'Save auth & rate limit settings?',
				'rest-api-firewall'
			),
		},
		firewall_routes_policy: {
			successTitle: __( 'Routes Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Routes policy saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save routes policy?', 'rest-api-firewall' ),
		},
		collections: {
			successTitle: __( 'Collections Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Collections settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __(
				'Save collections settings?',
				'rest-api-firewall'
			),
		},
		models_properties: {
			successTitle: __( 'Properties Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Properties settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __(
				'Save properties settings?',
				'rest-api-firewall'
			),
		},
		settings_route: {
			successTitle: __( 'Settings Route Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Settings route saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save settings route?', 'rest-api-firewall' ),
		},
		webhook: {
			successTitle: __( 'Webhook Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Webhook settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save webhook settings?', 'rest-api-firewall' ),
		},
		theme: {
			successTitle: __( 'Theme Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Theme settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __( 'Save theme settings?', 'rest-api-firewall' ),
		},
		global_security: {
			successTitle: __( 'Global Security Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Global security settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __(
				'Save global security settings?',
				'rest-api-firewall'
			),
		},
	};

	const PANEL_SAVE_GROUP = {
		'user-rate-limiting': 'firewall_auth_rate',
		'per-route-settings': 'firewall_routes_policy',
		'collections':        'collections',
		'models-properties':  'models_properties',
		'settings-route':     'settings_route',
		'webhook':            'webhook',
		'theme':              'theme',
		'global_security':    'global_security',
	};
	if ( hasValidLicense ) {
		delete PANEL_SAVE_GROUP[ 'user-rate-limiting' ];
		delete PANEL_SAVE_GROUP[ 'per-route-settings' ];
		delete PANEL_SAVE_GROUP[ 'models-properties' ];
		delete PANEL_SAVE_GROUP[ 'webhook' ];
	}

	const activeSaveGroup = PANEL_SAVE_GROUP[ panel ] ?? null;
	const showSaveButton = activeSaveGroup !== null;

	const handleSave = () => {
		save( pickGroup( activeSaveGroup ), SAVE_CONFIG[ activeSaveGroup ] );
	};

	if ( ! adminData ) {
		return null;
	}

	return (
		<>
			<Box sx={ { display: 'flex' } }>
				<Navigation

					migrationNeeded={ migrationNeeded }
					migrationDone={ migrationDone }
					schemaUpdateNeeded={ schemaUpdateNeeded }
					onOpenMigration={ () => setMigrationOpen( true ) }
					showSaveButton={ showSaveButton }
					onSave={ handleSave }
					saving={ saving }
				/>

				<Stack
					sx={ {
						flexGrow: 1,
						minWidth: 0,
						pl: { xs: 0, md: DRAWER_WIDTH + 'px' },
					pt: dirtyFlag.has ? 0 : APP_BAR_HEIGHT + 'px',
						minHeight: {
							xs: dirtyFlag.has
								? `calc(100svh - ${ APP_FOOTER_HEIGHT + WP_ADMIN_BAR_HEIGHT_MOBILE }px)`
								: `calc(100svh - ${
										APP_FOOTER_HEIGHT +
										APP_BAR_HEIGHT +
										WP_ADMIN_BAR_HEIGHT_MOBILE
								  }px)`,
							md: dirtyFlag.has
								? `calc(100svh - ${ APP_FOOTER_HEIGHT + WP_ADMIN_BAR_HEIGHT_DESKTOP }px)`
								: `calc(100svh - ${
										APP_FOOTER_HEIGHT +
										APP_BAR_HEIGHT +
										WP_ADMIN_BAR_HEIGHT_DESKTOP
								  }px)`,
						},
						bgcolor: 'background.paper',
					} }
				>
{ hasValidLicense && panel === 'applications' && <Applications /> }

							{ panel === 'user-rate-limiting' && (
						<>
							{ hasValidLicense ? (
								<Users />
							) : (
								<Stack
									spacing={ 3 }
									p={ 4 }
									sx={ { maxWidth: 800 } }
								>
									<RestApiUser
										form={ form }
										setField={ setField }
									/>
									<Divider />
									<RateLimit
										form={ form }
										setField={ setField }
									/>
								</Stack>
							) }
						</>
					) }

{ panel === 'per-route-settings' && (
								<RoutesPanel
									form={ form }
									setField={ setField }
									onNavigate={ ( v ) => navigate( { 5: 'models-properties' }[ v ] ?? String( v ) ) }
								/>
							) }

{ panel === 'ip-filtering' && <IpFilter /> }

							{ panel === 'collections' && (
						<Collections
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					) }

							{ panel === 'models-properties' &&
						( hasValidLicense ? (
							<Models />
						) : (
							<Properties
								form={ form }
								setField={ setField }
								postTypes={ postTypes }
							/>
						) ) }

							{ panel === 'settings-route' && (
						<SettingsRoute
							form={ form }
							setField={ setField }
						/>
					) }

					{ panel === 'webhook' &&
						( hasValidLicense ? (
							<Webhooks />
						) : (
							<Webhook form={ form } setField={ setField } />
						) ) }

{ panel === 'emails' && hasValidLicense && <MailsPanel /> }

{ panel === 'logs' && hasValidLicense && <Logs /> }

{ panel === 'automations' && hasValidLicense && <Automations /> }

							{ panel === 'global_security' && (
					<GlobalSecurity form={ form } setField={ setField } />
				) }

					{ panel === 'theme' && (
						<ThemeSettings
							form={ form }
							setField={ setField }
							setSlider={ setSlider }
							themeStatus={ themeStatus }
							setThemeStatus={ setThemeStatus }
						/>
					) }

{ panel === 'license' && <License /> }

							{ panel === 'configuration' && (
						<ConfigurationPanel
							form={ form }
							setField={ setField }
							schemaUpdateNeeded={
								schemaUpdateNeeded && ! migrationDone
							}
							onSchemaUpdated={ () =>
								window.location.reload()
							}
						/>
					) }
					
				</Stack>
			</Box>

			<MigrationDialog
				open={ migrationOpen }
				migrationNeeded={ migrationNeeded }
				schemaUpdateNeeded={ schemaUpdateNeeded }
				migrationDone={ migrationDone }
				onOpenRequest={ () => setMigrationOpen( true ) }
				onClose={ () => setMigrationOpen( false ) }
				onDone={ () => {
					setMigrationDone( true );
					setMigrationOpen( false );
					window.location.reload();
				} }
			/>
		</>
	);
}

export default function App() {
	return (
		<DialogProvider>
			<ApplicationProvider>
						<NavigationProvider>
								<AppContent />
								<ConfirmDialog />
						</NavigationProvider>
			</ApplicationProvider>
		</DialogProvider>
	);
}

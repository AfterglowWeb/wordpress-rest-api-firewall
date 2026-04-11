import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { DialogProvider } from './contexts/DialogContext';
import { useLicense } from './contexts/LicenseContext';
import { ApplicationProvider, useApplication } from './contexts/ApplicationContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { EntryToolbarProvider, useEntryToolbarContext } from './contexts/EntryToolbarContext';

import useSettingsForm from './hooks/useSettingsForm';
import useSaveOptions from './hooks/useSaveOptions';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import ConfirmDialog from './components/ConfirmDialog';
import EntryToolbar from './components/shared/EntryToolbar';
import MigrationDialog from './components/Migration/MigrationDialog';
import ProToFreeDialog from './components/Migration/ProToFreeDialog';
import Navigation, {
	APP_BAR_HEIGHT,
	APP_FOOTER_HEIGHT,
	DRAWER_WIDTH,
	WP_ADMIN_BAR_HEIGHT_DESKTOP,
	WP_ADMIN_BAR_HEIGHT_MOBILE,
} from './components/Navigation';

import ConfigurationPanel from './components/Configuration/ConfigurationDialog';

import RoutesPanel from './components/Firewall/Routes/RoutesPanel';
import IpFilter from './components/IpFilter/IpFilter';
import RestApiSingleUser from './components/Firewall/Users/RestApiSingleUser';

import PropertiesPanel from './components/Models/PropertiesPanel';
import Collections from './components/Models/Collections';
import ModelsPanel from './components/Models/ModelsPanel';

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

function WpSettingsRedirect() {
	const { navigate } = useNavigation();
	useEffect( () => { navigate( 'models-properties', 'settings_route' ); }, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	return null;
}

function AppContent() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { save, saving } = useSaveOptions();
	const { hasValidLicense } = useLicense();
	const { dirtyFlag, setDirtyFlag } = useApplication();
	const { panel, navigate } = useNavigation();
	const { toolbarConfig } = useEntryToolbarContext();
	const editorOpen = toolbarConfig !== null;

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ themeStatus, setThemeStatus ] = useState( null );

	const isMigrated = !! window.restApiFirewallPro?.isMigrated;
	const migrationNeeded = !! window.restApiFirewallPro?.migrationNeeded && ! isMigrated;
	const schemaUpdateNeeded = !! window.restApiFirewallPro?.schemaUpdateNeeded;

	const [ migrationOpen, setMigrationOpen ] = useState(
		schemaUpdateNeeded || migrationNeeded
	);
	const [ migrationDone, setMigrationDone ] = useState( false );

	const [ proFallbackOpen, setProFallbackOpen ] = useState(
		!! window.restApiFirewallPro?.shouldPromptFallback
	);

	const { form, setField, setSlider, syncSavedField, pickGroup, isGroupDirty } = useSettingsForm( {
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
	};

	const PANEL_SAVE_GROUP = {
		'firewall_auth_rate':  'firewall_auth_rate',
		'user-rate-limiting': 'firewall_auth_rate',
		'per-route-settings': 'firewall_routes_policy',
		'models-properties':  'models_properties',
		'webhook':            'webhook',
		'theme':              'theme',
		// collections omitted: component owns its own per-type save (like GlobalSecurity)
	};
	if ( hasValidLicense ) {
		delete PANEL_SAVE_GROUP[ 'user-rate-limiting' ];
		delete PANEL_SAVE_GROUP[ 'per-route-settings' ];
		delete PANEL_SAVE_GROUP[ 'models-properties' ];
		delete PANEL_SAVE_GROUP[ 'webhook' ];
	}

	const activeSaveGroup = PANEL_SAVE_GROUP[ panel ] ?? null;
	const showSaveButton = activeSaveGroup !== null;
	const activeFormDirty = activeSaveGroup ? isGroupDirty( activeSaveGroup ) : false;

	const handleSave = () => {
		save( pickGroup( activeSaveGroup ), SAVE_CONFIG[ activeSaveGroup ] );
	};

	useEffect( () => {
		if ( ! showSaveButton ) {
			return;
		}
		setDirtyFlag( { has: activeFormDirty, message: '' } );
	}, [ activeFormDirty, showSaveButton ] ); // eslint-disable-line react-hooks/exhaustive-deps

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
					formDirty={ activeFormDirty }
				/>

				<Stack
				sx={ {
					flexGrow: 1,
					minWidth: 0,
					//pl: { xs: 0, md: DRAWER_WIDTH + 'px' },
					pt: editorOpen ? 0 : APP_BAR_HEIGHT + 'px',
					minHeight: {
						xs: editorOpen
							? `calc(100svh - ${ APP_FOOTER_HEIGHT + WP_ADMIN_BAR_HEIGHT_MOBILE }px)`
							: `calc(100svh - ${
									APP_FOOTER_HEIGHT +
									APP_BAR_HEIGHT +
									WP_ADMIN_BAR_HEIGHT_MOBILE
								}px)`,
						md: editorOpen
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

					{ editorOpen && <EntryToolbar { ...toolbarConfig } /> }

					{ hasValidLicense && panel === 'applications' && <Applications /> }
					
					{ panel === 'firewall_auth_rate' && (
						<RestApiSingleUser
							form={ form }
							setField={ setField }
						/>
					) }
					
					{ panel === 'user-rate-limiting' && (
						<>
							{ hasValidLicense ? (
								<Users />
							) : (
								<RestApiSingleUser
									form={ form }
									setField={ setField }
								/>
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

					{ panel === 'global-ip-filtering' && <IpFilter scope="global" /> }

					{ panel === 'collections' && (
						<Collections
							form={ form }
							setField={ setField }
							syncSavedField={ syncSavedField }
							postTypes={ postTypes }
						/>
					) }

					{ panel === 'models-properties' &&
						( hasValidLicense ? (
							<ModelsPanel />
						) : (
							<PropertiesPanel form={ form } setField={ setField } />
					) ) }

					{ panel === 'wp-settings' && <WpSettingsRedirect /> }

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
						<GlobalSecurity />
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
				onNavigateToGlobalSettings={ () => {
					setMigrationOpen( false );
					navigate( 'firewall_auth_rate', null, true );
				} }
				onCreateNewApp={ () => {
					setMigrationOpen( false );
					navigate( 'applications', 'new', true );
				} }
			/>

			{ proFallbackOpen && (
				<ProToFreeDialog
					open={ proFallbackOpen }
					onClose={ () => setProFallbackOpen( false ) }
					onExported={ () => {
						setProFallbackOpen( false );
						window.location.reload();
					} }
				/>
			) }
		</>
	);
}

export default function App() {
	return (
		<DialogProvider>
			<ApplicationProvider>
				<EntryToolbarProvider>
					<NavigationProvider>
						<AppContent />
						<ConfirmDialog />
					</NavigationProvider>
				</EntryToolbarProvider>
			</ApplicationProvider>
		</DialogProvider>
	);
}

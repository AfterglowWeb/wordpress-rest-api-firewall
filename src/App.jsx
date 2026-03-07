import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { DialogProvider, useDialog, DIALOG_TYPES } from './contexts/DialogContext';
import { useLicense } from './contexts/LicenseContext';
import { ApplicationProvider, useApplication } from './contexts/ApplicationContext';

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

import RoutesPolicyTree from './components/Firewall/Routes/RoutesPolicyTree';
import GlobalRoutesPolicy from './components/Firewall/Routes/GlobalRoutesPolicy';
import IpFilter from './components/Firewall/IpFilter/IpFilter';
import RateLimit from './components/Firewall/RateLimit';
import RestApiUser from './components/Firewall/RestApiUser';

import Properties from './components/ApiOutput/Properties';
import SettingsRoute from './components/ApiOutput/SettingsRoute';
import Collections from './components/ApiOutput/Collections';
import Models from './components/ApiOutput/Models';

import Webhook from './components/Webhooks/Webhook';
import Webhooks from './components/Webhooks/Webhooks';

import MailsPanel from './components/Mails/MailsPanel';

import Logs from './components/Logs/Logs';

import Automations from './components/Automations/Automations';

import ThemeSettings from './components/Theme/ThemeSettings';

import Applications from './components/Applications/Applications';

import License from './components/License/License';

import Users from './components/Firewall/Users/Users';

function AppContent() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { save, saving } = useSaveOptions();
	const { hasValidLicense } = useLicense();
	const { dirtyFlag } = useApplication();
	const { openDialog } = useDialog();

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ panelGroup, setPanelGroup ] = useState( 1 );
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

	const navigateTo = useCallback( ( newIndex ) => {
		setPanelGroup( newIndex );
		window.localStorage.setItem( 'rest_api_firewall_last_tab', newIndex );
	}, [] );

	const handleMenuClick = useCallback(
		( newIndex ) => {
			if ( newIndex === undefined ) {
				return false;
			}
			if ( panelGroup === newIndex ) {
				return;
			}
			if ( dirtyFlag.has ) {
				openDialog( {
					type: DIALOG_TYPES.CONFIRM,
					title: __( 'Unsaved Changes', 'rest-api-firewall' ),
					content:
						dirtyFlag.message ||
						__(
							'You have unsaved changes. Leave anyway?',
							'rest-api-firewall'
						),
					confirmLabel: __( 'Leave', 'rest-api-firewall' ),
					cancelLabel: __( 'Stay', 'rest-api-firewall' ),
					onConfirm: () => navigateTo( newIndex ),
				} );
				return;
			}
			navigateTo( newIndex );
		},
		[ panelGroup, dirtyFlag, openDialog, navigateTo, __ ]
	);

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
		1: 'firewall_auth_rate',
		2: 'firewall_routes_policy',
		4: 'collections',
		5: 'models_properties',
		6: 'settings_route',
		7: 'webhook',
	};
	if ( hasValidLicense ) {
		delete PANEL_SAVE_GROUP[ 1 ];
		delete PANEL_SAVE_GROUP[ 5 ];
		delete PANEL_SAVE_GROUP[ 7 ];
	}

	const activeSaveGroup = PANEL_SAVE_GROUP[ panelGroup ] ?? null;
	const showSaveButton = activeSaveGroup !== null;
	const needsLicense = panelGroup === 5 && ! hasValidLicense;

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
					panelGroup={ panelGroup }
					onPanelChange={ handleMenuClick }
					migrationNeeded={ migrationNeeded }
					migrationDone={ migrationDone }
					schemaUpdateNeeded={ schemaUpdateNeeded }
					onOpenMigration={ () => setMigrationOpen( true ) }
					showSaveButton={ showSaveButton }
					onSave={ handleSave }
					saving={ saving }
					needsLicense={ needsLicense }
				/>

				<Stack
					sx={ {
						flexGrow: 1,
						minWidth: 0,
						pl: { xs: 0, md: DRAWER_WIDTH + 'px' },
						pt: APP_BAR_HEIGHT + 'px',
						minHeight: {
							xs: `calc(100svh - ${
								APP_FOOTER_HEIGHT +
								APP_BAR_HEIGHT +
								WP_ADMIN_BAR_HEIGHT_MOBILE
							}px)`,
							md: `calc(100svh - ${
								APP_FOOTER_HEIGHT +
								APP_BAR_HEIGHT +
								WP_ADMIN_BAR_HEIGHT_DESKTOP
							}px)`,
						},
						bgcolor: 'background.paper',
					} }
				>
					{ hasValidLicense && panelGroup === 0 && <Applications /> }

					{ panelGroup === 1 && (
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

					{ panelGroup === 2 && (
						<Stack 
							spacing={ 3 } 
							sx={ { p: 4, flexGrow: 1 } }
						>
							<GlobalRoutesPolicy
								form={ form }
								setField={ setField }
							/>
							<Divider />
							<RoutesPolicyTree
								form={ form }
								setField={ setField }
							/>
						</Stack>
					) }

					{ panelGroup === 3 && <IpFilter /> }

					{ panelGroup === 4 && (
						<Collections
							form={ form }
							setField={ setField }
							postTypes={ postTypes }
						/>
					) }

					{ panelGroup === 5 &&
						( hasValidLicense ? (
							<Models />
						) : (
							<Properties
								form={ form }
								setField={ setField }
								postTypes={ postTypes }
							/>
						) ) }

					{ panelGroup === 6 && (
						<SettingsRoute
							form={ form }
							setField={ setField }
						/>
					) }

					{ panelGroup === 7 &&
						( hasValidLicense ? (
							<Webhooks />
						) : (
							<Webhook form={ form } setField={ setField } />
						) ) }

					{ panelGroup === 8 && hasValidLicense && <MailsPanel /> }

					{ panelGroup === 12 && hasValidLicense && <Logs /> }

					{ panelGroup === 13 && hasValidLicense && <Automations /> }

					{ panelGroup === 9 && (
						<ThemeSettings
							form={ form }
							setField={ setField }
							setSlider={ setSlider }
							themeStatus={ themeStatus }
							setThemeStatus={ setThemeStatus }
						/>
					) }

					{ panelGroup === 10 && <License /> }

					{ panelGroup === 11 && (
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
				<AppContent />
				<ConfirmDialog />
			</ApplicationProvider>
		</DialogProvider>
	);
}

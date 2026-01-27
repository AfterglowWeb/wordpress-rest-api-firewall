import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { DialogProvider, useDialog, DIALOG_TYPES } from './contexts/DialogContext';
import useSettingsForm from './contexts/useSettingsForm';

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

import ConfirmDialog from './components/ConfirmDialog';
import Webhook from './components/Webhook';
import RestContentSettings from './components/RestContentSettings';
import ThemeSettings from './components/ThemeSettings';
import Firewall from './components/Firewall/Firewall';
import DeployTheme from './components/DeployTheme';

function TabPanel({ value, index, children }) {
	return (
		<div role="tabpanel" hidden={value !== index}>
			{value === index && <Box maxWidth="xl" minHeight={'calc(100vh - 340px)'} py={2}>{children}</Box>}
		</div>
	);
}

function AppContent() {
	const { adminData, updateAdminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { openDialog, updateDialog } = useDialog();

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ tabIndex, setTabIndex ] = useState(0);
	const [ themeStatus, setThemeStatus] = useState(null);
	
	const {
		form,
		setField,
		setSlider,
		submit,
	} = useSettingsForm( {
		adminData,
		updateAdminData,
		action: 'rest_api_firewall_update_options',
	} );

	const handleTabChange = (_, newValue) => {
		setTabIndex(newValue);
	};

	const minDelay = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

	useEffect( () => {
		if ( Array.isArray( adminData?.post_types ) ) {
			setPostTypes( adminData.post_types );
		}
	}, [ adminData ] );

	const handleSubmit = ( e ) => {
		e.preventDefault();

		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: __( 'Confirm Save', 'rest-api-firewall' ),
			content: __( 'Are you sure you want to save these settings?', 'rest-api-firewall' ),
			onConfirm: async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Saving...', 'rest-api-firewall' ),
				} );

				try {
					await Promise.all( [
						submit(),
						minDelay( 400 ),
					] );
					updateDialog( {
						type: DIALOG_TYPES.SUCCESS,
						title: __( 'Success', 'rest-api-firewall' ),
						content: __( 'Settings saved successfully!', 'rest-api-firewall' ),
						autoClose: 2000,
					} );
				} catch ( err ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: err.message,
					} );
				}
			},
		} );
	};

	if ( ! adminData ) {
		return null;
	}

	return (
		<Paper
			sx={ { maxWidth: '100%', mx: 'auto', px: 3, pb:3 } }
			elevation={ 2 }
		>
			<form onSubmit={ handleSubmit }>
				<Tabs
					value={tabIndex}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					aria-label="REST API settings tabs"
				>
					<Tab label={__('REST API Firewall', 'rest-api-firewall')} />
					<Tab label={__('REST API Content', 'rest-api-firewall')} />
					<Tab label={__('Application Webhook', 'rest-api-firewall')} />
					<Tab label={__('Theme Options', 'rest-api-firewall')} />
				</Tabs>

				<TabPanel value={tabIndex} index={0}>
					<Firewall />
				</TabPanel>

				<TabPanel value={tabIndex} index={1}>
					<Stack direction={"row"} justifyContent={"space-between"} gap={2} py={3} flexWrap={"wrap"} alignItems={"center"}>
						<Typography variant="h6" fontWeight={600}>
							{ __( 'REST API Content', 'rest-api-firewall' ) }
						</Typography>
						<Button
							type="submit"
							variant="contained"
							>
							{ __( 'Save Content Settings', 'rest-api-firewall' ) }
						</Button>
					</Stack>
					<RestContentSettings
						form={ form }
						setField={ setField }
						postTypes={ postTypes }
					/>
				</TabPanel>

				<TabPanel value={tabIndex} index={2}>
					<Stack direction={"row"} justifyContent={"space-between"} gap={2} py={3} flexWrap={"wrap"} alignItems={"center"}>
						<Typography variant="h6" fontWeight={600}>
							{ __( 'Application Webhook', 'rest-api-firewall' ) }
						</Typography>
					</Stack>
					<Webhook
					form={ form }
					setField={ setField } />
				</TabPanel>

				<TabPanel value={tabIndex} index={3}>
					<Box py={3}>
						<DeployTheme 
						status={ themeStatus } 
						setStatus={ setThemeStatus } />
					</Box>

					{themeStatus && themeStatus?.deployed ? (
					<>
					<Stack direction={"row"} justifyContent={"space-between"} gap={2} py={3} flexWrap={"wrap"} alignItems={"center"}>
						<Typography variant="h6" fontWeight={600}>
							{ __( 'Theme Options', 'rest-api-firewall' ) }
						</Typography>


						<Button
							type="submit"
							variant="contained"
							sx={{ml:3}}
							disabled={!themeStatus?.active}
							>
							{ __( 'Save Theme Options', 'rest-api-firewall' ) }
						</Button>
					</Stack>
					{themeStatus && !themeStatus?.active && (
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							{ __( 'Activate the theme to enable these options.', 'rest-api-firewall' ) }
						</Typography>
					)}
					<ThemeSettings
					form={ form }
					setField={ setField }
					setSlider={setSlider}
					disabled={!themeStatus?.active} />
					</>) :
					(
						<Stack spacing={1} maxWidth="sm">
							<Typography component="p" >
							{ __( 'REST API Firewall Theme is bundled with the plugin.', 'rest-api-firewall' ) }<br/>
							{ __( 'You need to deploy and activate it to access theme options.', 'rest-api-firewall' ) }
							</Typography>
						</Stack>
					)}

					

				</TabPanel>


			</form>
		</Paper>
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

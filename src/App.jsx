import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import { DialogProvider } from './contexts/DialogContext';
import useSettingsForm from './contexts/useSettingsForm';
import useSaveOptions from './hooks/useSaveOptions';

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

import ConfirmDialog from './components/ConfirmDialog';
import Webhook from './components/Webhook';

import ThemeSettings from './components/ThemeSettings';
import Models from './components/Models/Models';
import Firewall from './components/Firewall/Firewall';

// Option groups for partial saves
const SCHEMA_OPTIONS = [
	'rest_models_enabled',
	'rest_models_embed_featured_attachment_enabled',
	'rest_models_embed_post_attachments_enabled',
	'rest_models_resolve_rendered_props',
	'rest_models_embed_terms_enabled',
	'rest_models_embed_author_enabled',
	'rest_models_with_acf_enabled',
	'rest_models_remove_empty_props',
	'rest_firewall_remove_links_prop',
	'rest_models_relative_url_enabled',
	'rest_models_relative_attachment_url_enabled',
	'rest_api_posts_per_page',
	'rest_api_attachments_per_page',
	'rest_api_restrict_post_types_enabled',
	'rest_api_allowed_post_types',
];

const THEME_OPTIONS = [
	'theme_redirect_templates_enabled',
	'theme_redirect_templates_preset_url',
	'theme_redirect_templates_free_url_enabled',
	'theme_redirect_templates_free_url',
	'theme_disable_gutenberg',
	'theme_disable_comments',
	'theme_remove_empty_p_tags_enabled',
	'theme_svg_webp_support_enabled',
	'theme_max_upload_weight',
	'theme_max_upload_weight_enabled',
	'theme_json_acf_fields_enabled',
];

const WEBHOOK_OPTIONS = [
	'application_host',
	'application_webhook_endpoint',
];

function TabPanel({ value, index, children }) {
	return (
		<div role="tabpanel" hidden={value !== index}>
			{value === index && <Box maxWidth="xl" minHeight={'calc(100vh - 340px)'} py={4}>{children}</Box>}
		</div>
	);
}

/**
 * Pick only specified keys from form object.
 */
function pickOptions( form, keys ) {
	const result = {};
	for ( const key of keys ) {
		if ( key in form ) {
			result[ key ] = form[ key ];
		}
	}
	return result;
}

function AppContent() {
	const { adminData, updateAdminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { save, saving } = useSaveOptions();

	const [ postTypes, setPostTypes ] = useState( [] );
	const [ tabIndex, setTabIndex ] = useState(0);
	const [ themeStatus, setThemeStatus] = useState(null);

	const {
		form,
		setField,
		setSlider,
	} = useSettingsForm( {
		adminData,
		updateAdminData,
		action: 'rest_api_firewall_update_options',
	} );

	const handleTabChange = (_, newValue) => {
		setTabIndex(newValue);
		window.localStorage.setItem('rest_api_firewall_last_tab', newValue );
	};

	useEffect( () => {
		const lastTab = window.localStorage.getItem('rest_api_firewall_last_tab') || null;
		if ( lastTab ) {
			setTabIndex( Number( lastTab ) );
		}
	}, [setTabIndex] );

	useEffect( () => {
		if ( Array.isArray( adminData?.post_types ) ) {
			setPostTypes( adminData.post_types );
		}
	}, [ adminData ] );

	const handleSaveSchemas = () => {
		save( pickOptions( form, SCHEMA_OPTIONS ), {
			successTitle: __( 'Schemas Saved', 'rest-api-firewall' ),
			successMessage: __( 'Schemas settings saved successfully.', 'rest-api-firewall' ),
			confirmMessage: __( 'Save schemas settings?', 'rest-api-firewall' ),
		} );
	};

	const handleSaveTheme = () => {
		save( pickOptions( form, THEME_OPTIONS ), {
			successTitle: __( 'Theme Saved', 'rest-api-firewall' ),
			successMessage: __( 'Theme settings saved successfully.', 'rest-api-firewall' ),
			confirmMessage: __( 'Save theme settings?', 'rest-api-firewall' ),
		} );
	};

	const handleSaveWebhook = () => {
		save( pickOptions( form, WEBHOOK_OPTIONS ), {
			successTitle: __( 'Webhook Saved', 'rest-api-firewall' ),
			successMessage: __( 'Webhook settings saved successfully.', 'rest-api-firewall' ),
			confirmMessage: __( 'Save webhook settings?', 'rest-api-firewall' ),
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
			<Tabs
				value={tabIndex}
				onChange={handleTabChange}
				variant="scrollable"
				scrollButtons="auto"
				aria-label="REST API settings tabs"
			>
				<Tab label={__('Firewall', 'rest-api-firewall')} />
				<Tab label={__('Schemas', 'rest-api-firewall')} />
				<Tab label={__('Webhook', 'rest-api-firewall')} />
				<Tab label={__('Theme', 'rest-api-firewall')} />
			</Tabs>

			<TabPanel value={tabIndex} index={0}>
				<Firewall />
			</TabPanel>

			<TabPanel value={tabIndex} index={1}>
				<Stack
				direction={"row"}
				justifyContent={"space-between"}
				gap={2} py={3}
				flexWrap={"wrap"} alignItems={"center"}>
					<Typography variant="h6" fontWeight={600}>
						{ __( 'Schemas Settings', 'rest-api-firewall' ) }
					</Typography>
					<Button
						variant="contained"
						size="small"
						onClick={ handleSaveSchemas }
						disabled={ saving }
						>
						{ __( 'Save', 'rest-api-firewall' ) }
					</Button>
				</Stack>

				<Models
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
					<Button
						variant="contained"
						onClick={ handleSaveWebhook }
						disabled={ saving }
						>
						{ __( 'Save Webhook Settings', 'rest-api-firewall' ) }
					</Button>
				</Stack>

				<Webhook
					form={ form }
					setField={ setField }
				/>

			</TabPanel>

			<TabPanel value={tabIndex} index={3}>

				{themeStatus && themeStatus?.active &&
				<Stack direction={"row"} justifyContent={"space-between"} gap={2} py={3} flexWrap={"wrap"} alignItems={"center"}>
					<Typography variant="h6" fontWeight={600}>
						{ __( 'Theme Options', 'rest-api-firewall' ) }
					</Typography>

					<Button
						variant="contained"
						onClick={ handleSaveTheme }
						disabled={ saving }
						sx={{ml:3}}
						>
						{ __( 'Save Theme Options', 'rest-api-firewall' ) }
					</Button>
				</Stack>}

				<ThemeSettings
					form={ form }
					setField={ setField }
					setSlider={setSlider}
					themeStatus={ themeStatus }
					setThemeStatus={ setThemeStatus }
				/>

			</TabPanel>

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

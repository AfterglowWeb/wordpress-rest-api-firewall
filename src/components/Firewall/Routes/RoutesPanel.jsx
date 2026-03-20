import { useState, useEffect, useCallback } from '@wordpress/element';
import { useLicense } from '../../../contexts/LicenseContext';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useApplication } from '../../../contexts/ApplicationContext';
import { useNavigation } from '../../../contexts/NavigationContext';
import useProActions from '../../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import GlobalRoutesPolicy from './GlobalRoutesPolicy';
import RoutesPolicyTree from './RoutesPolicyTree';

export default function RoutesPanel( { form, setField, onNavigate } ) {
	const { hasValidLicense, proNonce } = useLicense();
	const { adminData } = useAdminData();
	const { selectedApplicationId } = useApplication();
	const { save } = useProActions();
	const nonce = proNonce || adminData?.nonce;
	const { __ } = wp.i18n || {};
	const { subKey, navigate: navCtx } = useNavigation();
	const currentTab = subKey === 'routes' ? 1 : 0;
	const isModuleEnabled = !! adminData?.admin_options?.firewall_routes_policy_enabled;
	const [ appEntry, setAppEntry ] = useState( null );
	const [ proSettings, setProSettings ] = useState( {
		enforce_auth:             false,
		enforce_rate_limit:       false,
		hide_user_routes:         false,
		hide_batch_routes:        false,
		hide_oembed_routes:       false,
		disable_behavior:         '404',
		disable_redirect_url:     '',
		disable_redirect_page_id: '',
		disabled_methods:         [],
		disabled_post_types:      [],
	} );

	const handleProChange = useCallback( ( e ) => {
		const { name, value, checked, type } = e.target;
		setProSettings( ( prev ) => ( { ...prev, [ name ]: type === 'checkbox' ? checked : value } ) );
	}, [] );

	const handleMethodToggle = ( method ) => ( e ) => {
		const lower = method.toLowerCase();
		const current = proSettings.disabled_methods || [];
		const next = e.target.checked
			? [ ...new Set( [ ...current, lower ] ) ]
			: current.filter( ( m ) => m !== lower );
		setProSettings( ( prev ) => ( { ...prev, disabled_methods: next } ) );
	};

	const loadAppSettings = useCallback( async () => {
		if ( ! selectedApplicationId ) return;
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: selectedApplicationId,
				} ),
			} );
			const result = await response.json();
			if ( result?.success && result.data?.entry ) {
				const entry = result.data.entry;
				setAppEntry( entry );
				const s = entry.settings || {};
				setProSettings( {
					enforce_auth:             !! s.enforce_auth,
					enforce_rate_limit:       !! s.enforce_rate_limit,
					hide_user_routes:         !! s.hide_user_routes,
					hide_batch_routes:        !! s.hide_batch_routes,
					hide_oembed_routes:       !! s.hide_oembed_routes,
					disable_behavior:         s.disable_behavior         || '404',
					disable_redirect_url:     s.disable_redirect_url     || '',
					disable_redirect_page_id: s.disable_redirect_page_id || '',
					disabled_methods:         s.disabled_methods         || [],
					disabled_post_types:      s.disabled_post_types      || [],
				} );
			}
		} catch {}
	}, [ adminData, nonce, selectedApplicationId ] );

	const saveRoutesPolicy = useCallback( () => {
		if ( ! selectedApplicationId || ! appEntry ) return;
		const existingSettings = appEntry.settings || {};
		save(
			{
				action:   'update_application_entry',
				id:       selectedApplicationId,
				title:    appEntry.title || '',
				settings: JSON.stringify( { ...existingSettings, ...proSettings } ),
			},
			{
				confirmTitle:   __( 'Save Routes Policy', 'rest-api-firewall' ),
				confirmMessage: __( 'Save routes policy settings for this application?', 'rest-api-firewall' ),
				successTitle:   __( 'Routes Policy Saved', 'rest-api-firewall' ),
				successMessage: __( 'Routes policy saved successfully.', 'rest-api-firewall' ),
				onSuccess: loadAppSettings,
			}
		);
	}, [ selectedApplicationId, appEntry, proSettings, save, loadAppSettings, __ ] );

	useEffect( () => {
		loadAppSettings();
	}, [ loadAppSettings ] );

	/**
	 * Effective global values for the route tree.
	 * In pro mode these come from per-application proSettings; in free mode from wp_options form.
	 * Rate-limit thresholds (rate_limit, rate_limit_time) are always global (wp_options).
	 */
	const effectiveForm = hasValidLicense ? {
		...form,
		enforce_auth:        proSettings.enforce_auth,
		enforce_rate_limit:  proSettings.enforce_rate_limit,
		hide_user_routes:   proSettings.hide_user_routes,
		hide_batch_routes:  proSettings.hide_batch_routes,
		hide_oembed_routes: proSettings.hide_oembed_routes,
		disabled_methods:   proSettings.disabled_methods,
		disabled_post_types: proSettings.disabled_post_types,
	} : form;

	return (
		<Stack p={4} flexGrow={ 1 } spacing={ 3 }>
			<Tabs
            value={ currentTab }
            onChange={ ( e, v ) => navCtx( 'per-route-settings', v === 1 ? 'routes' : 'global' ) }
            sx={ {
                mb: 2,
                borderBottom: 1,
                borderColor: 'divider',
            } }
			>
				<Tab
					icon={ <AccountTreeOutlinedIcon /> }
					iconPosition="start"
					label={ __( 'Global Options', 'rest-api-firewall' ) }
				/>
				<Tab
					icon={ <FormatListBulletedIcon /> }
					iconPosition="start"
					label={ __( 'Per Route Settings', 'rest-api-firewall' ) }
				/>
			</Tabs>

			{ currentTab === 0 && (
				<Stack spacing={ 3 }>
					<Alert severity="info" sx={ { maxWidth: 640 } }>
						{ __( 'These settings apply globally to all routes. They can be overridden on a per-route basis in the "Per Route Settings" tab.', 'rest-api-firewall' ) }
					</Alert>
					<GlobalRoutesPolicy
						form={ form }
						setField={ setField }
						proSettings={ proSettings }
						onProChange={ handleProChange }
						onMethodToggle={ handleMethodToggle }
						onSave={ saveRoutesPolicy }
						canSave={ !! selectedApplicationId && !! appEntry }
						isModuleEnabled={ isModuleEnabled }
					/>
				</Stack>
			) }

			{ currentTab === 1 && (
				<Stack sx={ { flexGrow: 1 } }>
					<RoutesPolicyTree
						form={ effectiveForm }
						setField={ setField }
						selectedApplicationId={ selectedApplicationId }
						onNavigate={ onNavigate }
					/>
				</Stack>
			) }
		</Stack>
	);
}

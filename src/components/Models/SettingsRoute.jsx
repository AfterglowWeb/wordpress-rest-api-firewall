import { useState, useEffect } from '@wordpress/element';
import { useLicense } from '../../contexts/LicenseContext';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { PropertyRow } from './Properties';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

export default function SettingsRoute( { form, setField } ) {
	const { hasValidLicense } = useLicense();

	if ( hasValidLicense ) {
		return <SettingsRoutePro />;
	}

	return <SettingsRouteFree form={ form } setField={ setField } />;
}

function SettingsRouteFree( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	return (
		<Stack spacing={ 3 } p={ 4 } flexGrow={ 1 }>
			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_models_embed_menus_enabled }
							onChange={ setField }
							size="small"
							name="rest_models_embed_menus_enabled"
						/>
					}
					label={ __( 'Embed Flattened Menus', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __( 'Resolve and embed navigation menus in a `menus` property.', 'rest-api-firewall' ) }
				</FormHelperText>
			</FormControl>

			<Tooltip
				followCursor
				title={ ! hasValidLicense ? __( 'Licence required', 'rest-api-firewall' ) : '' }
			>
				<Stack maxWidth={ 320 } pl={ 3.5 }>
					<TextField
						label={ __( 'Custom Menus Route', 'rest-api-firewall' ) }
						helperText={ __( 'Register a custom route for the menus endpoint.', 'rest-api-firewall' ) }
						size="small"
						fullWidth
						name="rest_models_embed_menus_endpoint"
						value={ form.rest_models_embed_menus_endpoint || '' }
						onChange={ setField }
						disabled={ ! hasValidLicense || ! form.rest_models_embed_menus_enabled }
					/>
				</Stack>
			</Tooltip>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_models_acf_options_page_enabled }
							onChange={ setField }
							size="small"
							name="rest_models_acf_options_page_enabled"
						/>
					}
					label={ __( 'Add ACF Options Pages', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __( 'Embed ACF options pages fields in a `acf_options_page` property.', 'rest-api-firewall' ) }
				</FormHelperText>
			</FormControl>

			<Tooltip
				followCursor
				title={ ! hasValidLicense ? __( 'Licence required', 'rest-api-firewall' ) : '' }
			>
				<Stack maxWidth={ 320 } pl={ 3.5 }>
					<TextField
						label={ __( 'Custom ACF Options Pages Route', 'rest-api-firewall' ) }
						helperText={ __( 'Register a custom ACF options pages route.', 'rest-api-firewall' ) }
						size="small"
						fullWidth
						name="rest_models_acf_options_page_endpoint"
						value={ form.rest_models_acf_options_page_endpoint || '' }
						onChange={ setField }
						disabled={ ! hasValidLicense || ! form.rest_models_acf_options_page_enabled }
					/>
				</Stack>
			</Tooltip>

			<Divider />

			<Typography
				variant="caption"
				sx={ {
					display: 'block',
					textTransform: 'uppercase',
					letterSpacing: 0.5,
					fontSize: '0.75rem',
					color: 'text.secondary',
				} }
			>
				{ __( 'Per-Property Settings', 'rest-api-firewall' ) }
			</Typography>

			<SettingsRouteProperties setField={ setField } disabled={ true } />
		</Stack>
	);
}

function SettingsRoutePro() {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const { selectedApplication, selectedApplicationId } = useApplication();
	const nonce = proNonce || adminData?.nonce;

	const getInitialForm = ( app ) =>
		app?.settings?.settings_route || {};

	const [ localForm, setLocalForm ] = useState( () => getInitialForm( selectedApplication ) );
	const [ saving, setSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState( '' );

	useEffect( () => {
		setLocalForm( getInitialForm( selectedApplication ) );
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ selectedApplicationId ] );

	const localSetField = ( e ) => {
		const { name, value, type, checked } = e.target;
		setLocalForm( ( prev ) => ( {
			...prev,
			[ name ]: type === 'checkbox' ? Boolean( checked ) : value,
		} ) );
	};

	const handleSave = () => {
		if ( ! selectedApplicationId ) {
			return;
		}
		setSaving( true );
		setSaveError( '' );
		const existingSettings = selectedApplication?.settings || {};
		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( {
				action: 'update_application_entry',
				id: selectedApplicationId,
				title: selectedApplication?.title || '',
				enabled: selectedApplication?.enabled ? '1' : '0',
				settings: JSON.stringify( { ...existingSettings, settings_route: localForm } ),
				nonce,
			} ),
		} )
			.then( ( r ) => r.json() )
			.then( ( result ) => {
				if ( ! result?.success ) {
					setSaveError( result?.data?.message || __( 'Save failed.', 'rest-api-firewall' ) );
				}
			} )
			.catch( () => setSaveError( __( 'Network error.', 'rest-api-firewall' ) ) )
			.finally( () => setSaving( false ) );
	};

	return (
		<Stack spacing={ 3 } p={ 4 } flexGrow={ 1 }>
			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! localForm.rest_models_embed_menus_enabled }
							onChange={ localSetField }
							size="small"
							name="rest_models_embed_menus_enabled"
						/>
					}
					label={ __( 'Embed Flattened Menus', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __( 'Resolve and embed navigation menus in a `menus` property.', 'rest-api-firewall' ) }
				</FormHelperText>
			</FormControl>

			<Stack maxWidth={ 320 } pl={ 3.5 }>
				<TextField
					label={ __( 'Custom Menus Route', 'rest-api-firewall' ) }
					helperText={ __( 'Register a custom route for the menus endpoint.', 'rest-api-firewall' ) }
					size="small"
					fullWidth
					name="rest_models_embed_menus_endpoint"
					value={ localForm.rest_models_embed_menus_endpoint || '' }
					onChange={ localSetField }
					disabled={ ! localForm.rest_models_embed_menus_enabled }
				/>
			</Stack>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! localForm.rest_models_acf_options_page_enabled }
							onChange={ localSetField }
							size="small"
							name="rest_models_acf_options_page_enabled"
						/>
					}
					label={ __( 'Add ACF Options Pages', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __( 'Embed ACF options pages fields in a `acf_options_page` property.', 'rest-api-firewall' ) }
				</FormHelperText>
			</FormControl>

			<Stack maxWidth={ 320 } pl={ 3.5 }>
				<TextField
					label={ __( 'Custom ACF Options Pages Route', 'rest-api-firewall' ) }
					helperText={ __( 'Register a custom ACF options pages route.', 'rest-api-firewall' ) }
					size="small"
					fullWidth
					name="rest_models_acf_options_page_endpoint"
					value={ localForm.rest_models_acf_options_page_endpoint || '' }
					onChange={ localSetField }
					disabled={ ! localForm.rest_models_acf_options_page_enabled }
				/>
			</Stack>

			<Divider />

			<Typography
				variant="caption"
				sx={ {
					display: 'block',
					textTransform: 'uppercase',
					letterSpacing: 0.5,
					fontSize: '0.75rem',
					color: 'text.secondary',
				} }
			>
				{ __( 'Per-Property Settings', 'rest-api-firewall' ) }
			</Typography>

			<SettingsRouteProperties
				setField={ localSetField }
				disabled={ false }
				localForm={ localForm }
			/>

			{ saveError && <Alert severity="error">{ saveError }</Alert> }

			<Stack direction="row" justifyContent="flex-end">
				<Button
					variant="contained"
					disableElevation
					size="small"
					disabled={ saving || ! selectedApplicationId }
					onClick={ handleSave }
					startIcon={ saving ? <CircularProgress size={ 14 } color="inherit" /> : null }
				>
					{ saving
						? __( 'Saving…', 'rest-api-firewall' )
						: __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

function SettingsRouteProperties( { setField, disabled = false, localForm } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();

	const schemaProps = adminData?.models_properties?.settings_route?.props || {};
	const entries = Object.entries( schemaProps );

	if ( entries.length === 0 ) {
		return null;
	}

	return (
		<Stack spacing={ 0 }>
			{ entries.map( ( [ propName, propConfig ] ) => {
				const mergedConfig = localForm
					? {
						...propConfig,
						settings: {
							...( propConfig.settings || {} ),
							...( localForm[ `postProperties.settings_route.props.${ propName }.settings.disable` ] !== undefined
								? { disable: localForm[ `postProperties.settings_route.props.${ propName }.settings.disable` ] }
								: {} ),
						},
					  }
					: propConfig;

				return (
					<PropertyRow
						key={ propName }
						propName={ propName }
						propConfig={ mergedConfig }
						selectedPostType="settings_route"
						setField={ setField }
						hasValidLicense={ hasValidLicense }
						disabled={ disabled }
						__={ __ }
						basePath={ `postProperties.settings_route.props.${ propName }` }
					/>
				);
			} ) }
		</Stack>
	);
}


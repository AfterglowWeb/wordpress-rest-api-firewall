import { useLicense } from '../../contexts/LicenseContext';
import { useAdminData } from '../../contexts/AdminDataContext';
import { PropertyRow } from './Properties';

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
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	return (
		<Stack spacing={ 3 }>
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
					{ __(
						'Resolve and embed navigation menus in a `menus` property.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={
								!! form.rest_models_acf_options_page_enabled
							}
							onChange={ setField }
							size="small"
							name="rest_models_acf_options_page_enabled"
						/>
					}
					label={ __( 'Add ACF Options Pages', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Embed ACF options pages fields in a `acf_options_page` property.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<Tooltip
				followCursor
				title={
					! hasValidLicense
						? __( 'Licence required', 'rest-api-firewall' )
						: ''
				}
			>
				<Stack spacing={ 3 }>
					<Stack maxWidth={ 320 } pl={ 3.5 }>
						<TextField
							label={ __(
								'Custom ACF Options Pages Route',
								'rest-api-firewall'
							) }
							helperText={ __(
								'Register a custom ACF options pages route.',
								'rest-api-firewall'
							) }
							name="rest_models_acf_options_page_endpoint"
							value={ form.rest_models_acf_options_page_endpoint }
							onChange={ setField }
							disabled={
								! hasValidLicense ||
								! form.rest_models_acf_options_page_enabled
							}
						/>
					</Stack>
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

			<SettingsRouteProperties setField={ setField } />
		</Stack>
	);
}

function SettingsRouteProperties( { setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();

	const routeProps =
		adminData?.models_properties?.settings_route?.props || {};
	const entries = Object.entries( routeProps );

	if ( entries.length === 0 ) {
		return null;
	}

	return (
		<Stack spacing={ 0 }>
			{ entries.map( ( [ propName, propConfig ] ) => (
				<PropertyRow
					key={ propName }
					propName={ propName }
					propConfig={ propConfig }
					selectedPostType="settings_route"
					setField={ setField }
					hasValidLicense={ hasValidLicense }
					__={ __ }
					basePath={ `postProperties.settings_route.props.${ propName }` }
				/>
			) ) }
		</Stack>
	);
}

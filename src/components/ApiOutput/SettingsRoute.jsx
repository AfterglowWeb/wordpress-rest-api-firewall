import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

export default function SettingsRoute( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	return (
		<Stack spacing={ 3 }>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={
								!! form.rest_models_embed_menus_enabled
							}
							onChange={ setField }
							size="small"
							name="rest_models_embed_menus_enabled"
						/>
					}
					label={ __(
						'Embed Flattened Menus',
						'rest-api-firewall'
					) }
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
					label={ __(
						'Add ACF Options Pages',
						'rest-api-firewall'
					) }
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
			title={ ! hasValidLicense ? __( 'Licence required', 'rest-api-firewall' ) : '' }
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
							disabled={ ! hasValidLicense || ! form.rest_models_acf_options_page_enabled }
						/>
					</Stack>

					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									checked={ !! form.rest_models_remove_site_url }
									onChange={ setField }
									size="small"
									name="rest_models_remove_site_url"
								/>
							}
							label={ __(
								'Remove Site URL',
								'rest-api-firewall'
							) }
						/>
					</FormControl>

					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									checked={ !! form.rest_models_remove_site_email }
									onChange={ setField }
									size="small"
									name="rest_models_remove_site_email"
								/>
							}
							label={ __(
								'Remove Site Email',
								'rest-api-firewall'
							) }
						/>
					</FormControl>
				</Stack>
			</Tooltip>
		</Stack>
	);
}

function RouteProperties( { route } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();
	const postProperties = adminData?.models_properties || {};

	return (
		<Stack spacing={ 1 }>
			{ selectedPostType &&
				postProperties?.[ selectedPostType ]?.props && (
					<Stack spacing={ 0 }>
						{ Object.entries(
							postProperties[ selectedPostType ].props
						).map( ( [ propName, propConfig ] ) => (
							<PropertyRow
								key={ propName }
								propName={ propName }
								propConfig={ propConfig }
								selectedPostType={ selectedPostType }
								setField={ setField }
								hasValidLicense={ hasValidLicense }
								__={ __ }
								basePath={ `postProperties.${ selectedPostType }.props.${ propName }` }
							/>
						) ) }
					</Stack>
				) }
		</Stack>
	);
}

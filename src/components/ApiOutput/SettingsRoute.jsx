import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export default function SettingsRoute( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const isProDisabled =
		! hasValidLicense || ! form.rest_models_acf_options_page_enabled;

	return (
		<Stack spacing={ 3 }>
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
						'Remove Site URL in wp/v2/settings',
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
						'Remove Site Email in wp/v2/settings',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<FormControl disabled={ ! hasValidLicense }>
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
						'Add ACF Options Pages fields to wp/v2/settings',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<Stack maxWidth={ 320 } pl={ 3.5 }>
				<TextField
					label={ __(
						'Custom ACF Options Pages Route',
						'rest-api-firewall'
					) }
					helperText={ __(
						'Serve ACF options pages fields through a custom route instead of wp/v2/settings.',
						'rest-api-firewall'
					) }
					name="rest_models_acf_options_page_endpoint"
					value={ form.rest_models_acf_options_page_endpoint }
					onChange={ setField }
					disabled={ isProDisabled }
				/>
			</Stack>

			<FormControl disabled={ ! hasValidLicense }>
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
						'Embed Menus',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					{ __(
						'Embed menus and menu items in wp/v2/settings',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			
		</Stack>
	);
}

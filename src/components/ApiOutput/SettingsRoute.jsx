import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ProBadge from '../ProBadge';

export default function SettingsRoute( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const isDisabled = ! form.rest_models_acf_options_page_enabled;
	const isProDisabled = ! hasValidLicense || isDisabled;

	return (
		<Stack spacing={ 3 }>
			<Typography variant="subtitle1" fontWeight={ 600 }>
				{ __( 'Settings Route (wp/v2/settings)', 'rest-api-firewall' ) }
			</Typography>
			<Stack
				spacing={ 3 }
				direction={ { xs: 'column', xl: 'row' } }
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
				<FormControl sx={ { flex: 1 } }>
					<FormControlLabel
						control={
							<Switch
								checked={ !! form.rest_models_remove_site_url }
								onChange={ setField }
								size="small"
								name="rest_models_remove_site_url"
							/>
						}
						label={ __( 'Remove Site URL', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							'Remove the site URL from wp/v2/settings responses.',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>
				<FormControl sx={ { flex: 1 } }>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.rest_models_remove_site_email
								}
								onChange={ setField }
								size="small"
								name="rest_models_remove_site_email"
							/>
						}
						label={ __( 'Remove Site Email', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							'Remove the site email from wp/v2/settings responses.',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>
			</Stack>

			<Stack
				spacing={ 3 }
				direction={ { xs: 'column', xl: 'row' } }
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
				<FormControl sx={ { flex: 1 } }>
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
							'Expose ACF options page fields via wp/v2/settings.',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>

				<Stack
					sx={ { position: 'relative', flex: 1 } }
					spacing={ 3 }
					direction={ 'row' }
					justifyContent={ 'space-between' }
					alignItems={ 'flex-start' }
				>
					<TextField
						sx={ { flex: 1 } }
						label={ __(
							'Custom ACF Options Pages Route',
							'rest-api-firewall'
						) }
						helperText={ __(
							'Serve ACF options page fields at a custom route instead of wp/v2/settings.',
							'rest-api-firewall'
						) }
						name="rest_models_acf_options_page_endpoint"
						value={ form.rest_models_acf_options_page_endpoint }
						onChange={ setField }
						disabled={ isProDisabled }
						fullWidth
					/>
					<ProBadge position={ 'bottom-right' } />
				</Stack>
			</Stack>
		</Stack>
	);
}

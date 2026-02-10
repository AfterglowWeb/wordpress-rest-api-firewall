import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ProBadge from '../ProBadge';

export default function SiteSettingsFilters( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const isDisabled = ! form.rest_models_acf_options_page_enabled;
	const isProDisabled = ! hasValidLicense || isDisabled;

	return (
		<Stack spacing={ 3 }>
			<Typography variant="subtitle1" fontWeight={ 600 }>
				{ __( 'Route wp/v2/settings filters', 'rest-api-firewall' ) }
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
						label={ __( 'Remove site url', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							'Remove site url from wp/v2/settings',
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
						label={ __( 'Remove site email', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							'Remove site email from wp/v2/settings',
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
							'Add ACF options pages fields to wp/v2/settings',
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
							'Use wp/v2/my-route for ACF options pages fields',
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

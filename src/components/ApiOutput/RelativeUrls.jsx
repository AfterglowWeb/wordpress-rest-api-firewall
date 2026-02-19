import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ProBadge from '../ProBadge';

export default function RelativeUrls( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const isPropertiesDisabled = ! form.rest_models_enabled;
	const isProDisabled = ! hasValidLicense || isPropertiesDisabled;

	return (
		<Stack spacing={ 3 }>
			
			<ProBadge position={ 'top-right' } />

			<Typography
				variant="subtitle1"
				fontWeight={ 600 }
				sx={ { mb: 2 } }
			>
				{ __( 'URLs Filtering', 'rest-api-firewall' ) }
			</Typography>

			<FormControl disabled={ isProDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={
								!! form.rest_models_relative_url_enabled
							}
							name="rest_models_relative_url_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Relative URLs', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Remove the host from post and term URLs.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>


			<FormControl disabled={ isProDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={
								!! form.rest_models_relative_attachment_url_enabled
							}
							name="rest_models_relative_attachment_url_enabled"
							onChange={ setField }
						/>
					}
					label={ __(
						'Relative Attachment URLs',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					<Typography variant="caption">
						{ __(
							'Remove the host and upload path from attachment URLs.',
							'rest-api-firewall'
						) }
					</Typography>
				</FormHelperText>
			</FormControl>
		

		</Stack>
	);
}

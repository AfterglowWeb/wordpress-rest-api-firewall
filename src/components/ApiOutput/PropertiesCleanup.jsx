import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ProBadge from '../ProBadge';
import Checkbox from '@mui/material/Checkbox';

export default function PropertiesCleanup( { form, setField } ) {
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
					{ __( 'Properties Cleanup', 'rest-api-firewall' ) }
			</Typography>

			<FormControl disabled={ isProDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={
								!! form.rest_models_resolve_rendered_props
							}
							name="rest_models_resolve_rendered_props"
							onChange={ setField }
						/>
					}
					label={ __(
						'Resolve `rendered`',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					{ __(
						'Move `rendered` value up in its parent if not protected.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<Stack
				spacing={ 3 }
				direction={ 'row' }
				justifyContent={ 'space-between' }
				alignItems={ 'center' }
			>
				<FormControl disabled={ isProDisabled }>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={
									!! form.rest_models_remove_empty_props
								}
								name="rest_models_remove_empty_props"
								onChange={ setField }
							/>
						}
						label={ __(
							'Remove Empty Properties',
							'rest-api-firewall'
						) }
					/>
				</FormControl>

				<FormControl disabled={ isProDisabled }>
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={
									!! form.rest_models_remove_empty_props
								}
								name="rest_models_remove_empty_props_recursively"
								onChange={ setField }
							/>
						}
						label={ __(
							'Apply Recursively',
							'rest-api-firewall'
						) }
					/>
				</FormControl>
			</Stack>

		</Stack>
	);
}

import { useLicense } from '../../contexts/LicenseContext';
import { useAdminData } from '../../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ProBadge from '../ProBadge';
import MultipleSelect from '../MultipleSelect';

export default function AllowedTypes( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();

	return (
		<Stack spacing={ 3 } >

			<Stack
				sx={ { position: 'relative' } }
				spacing={ 3 }
				direction={ 'row' }
				maxWidth={600}
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
				<Box sx={ { flex: 1 } }>
					{ adminData?.post_types && (
						<MultipleSelect
							disabled={ ! hasValidLicense }
							name="rest_collections_allowed_post_types"
							label={ __(
								'Restrict to Post Types',
								'rest-api-firewall'
							) }
							value={ form.rest_collections_allowed_post_types }
							helperText={
								__( 'Only the selected post types will be exposed via the REST API. Leave empty to use default visibility settings.', 'rest-api-firewall' )
							}
							options={ adminData.post_types }
							onChange={ setField }
						/>
					) }
				</Box>

				<FormControl disabled={ ! hasValidLicense }>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={
									!! form.rest_collections_allowed_post_types_enabled
								}
								name="rest_collections_allowed_post_types_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Enable', 'rest-api-firewall' ) }
					/>
				</FormControl>
			</Stack>


		</Stack>
	);
}

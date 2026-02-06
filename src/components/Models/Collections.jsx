import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ProBadge from '../ProBadge';

import MultipleSelect from '../MultipleSelect';

export default function Collections( { form, setField, postTypes } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	return (
		<Stack spacing={ 3 }>
			<Typography variant="subtitle1" fontWeight={ 600 }>
				{ __( 'Collections', 'rest-api-firewall' ) }
			</Typography>
			<Stack
				spacing={ 3 }
				direction={'row'}
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
				<Stack
					sx={ { flex: 1 } }
					spacing={ 3 }
					direction={{ xs: 'column', sm:'row' }}
					justifyContent={ 'space-between' }
					alignItems={{ xs: 'stretch', sm: 'flex-start'} }
				>
					<TextField
					sx={ { flex: 1 } }
						label={ __( 'Posts Per Page', 'rest-api-firewall' ) }
						type="number"
						min="0"
						max="10000"
						helperText={ __(
							'Applies to posts collections',
							'rest-api-firewall'
						) }
						name="rest_collections_posts_per_page"
						value={ form.rest_collections_posts_per_page }
						onChange={ setField }
						fullWidth
					/>

					<TextField
					sx={ { flex: 1 } }
						label={ __( 'Attachments Per Page', 'rest-api-firewall' ) }
						type="number"
						min="0"
						max="10000"
						helperText={ __(
							'Applies to attachment collections',
							'rest-api-firewall'
						) }
						name="rest_collections_attachments_per_page"
						value={ form.rest_collections_attachments_per_page }
						onChange={ setField }
						fullWidth
					/>
				</Stack>
					
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={ !! form.rest_collections_posts_per_page }
								onChange={ setField }
								size="small"
								name="rest_collections_per_page_enabled"
							/>
						}
						label={ __(
							'Enable',
							'rest-api-firewall'
						) }
					/>
				</FormControl>
			</Stack>

			<Stack
				sx={ { position: 'relative' } }
				spacing={ 3 }
				direction={ 'row' }
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
				<Box sx={ { flex: 1 } }>
					{ postTypes && (
						<MultipleSelect
							disabled={ ! hasValidLicense }
							name="rest_collections_allowed_post_types"
							label={ __(
								'Restict to Posts Types',
								'rest-api-firewall'
							) }
							value={ form.rest_collections_allowed_post_types }
							helperText={
								'The selected Posts Types only will be visible in the REST API. If empty, default visibilty settings are applied'
							}
							options={ postTypes }
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
									!! form.rest_collections_restrict_post_types_enabled
								}
								name="rest_collections_restrict_post_types_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Enable', 'rest-api-firewall' ) }
					/>
				</FormControl>
				<ProBadge position={ 'right' } />
			</Stack>
		</Stack>
	);
}

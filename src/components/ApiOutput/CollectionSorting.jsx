import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ProBadge from '../ProBadge';

import MultipleSelect from '../MultipleSelect';
import Alert from '@mui/material/Alert';

export default function CollectionSorting( { form, setField, postTypes } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const isEnabled = form?.rest_collections_sortable_enabled;
	const isProActive = hasValidLicense && isEnabled;				

	return (
		<Stack position={"relative"} spacing={ 3 }>									
			<ProBadge position={ 'top-right' } />
			<Stack
				spacing={ 3 }
				direction={ 'row' }
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
				
			>
				<Typography 
				variant="subtitle1" 
				fontWeight={ 600 } 
				color={hasValidLicense ? 'textPrimary' : 'textSecondary'}
				sx={{opacity:hasValidLicense ? 1 : .7}}
				>
					{ __( 'Collection Sorting', 'rest-api-firewall' ) }
				</Typography>

				<FormControl disabled={!hasValidLicense}>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.rest_collections_sortable_enabled
								}
								onChange={ setField }
								size="small"
								name="rest_collections_sortable_enabled"
							/>
						}
						label={ __( 'Enable', 'rest-api-firewall' ) }
					/>
				</FormControl>

			</Stack>

			<Alert severity='info'>
				{ __("Add a drag-and-drop sorting column to post admin screens. Sorted posts can be queried via REST using the orderby parameter set to 'menu_order'.",
					'rest-api-firewall'
				) }
			</Alert>

			<Stack spacing={ 3 }>

				<FormControl disabled={!isProActive}>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.rest_collections_sortable_rest_enforce
								}
								onChange={ setField }
								size="small"
								name="rest_collections_sortable_rest_enforce"
							/>
						}
						label={ __( 'Apply Sort Order in REST Requests', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							"Fall back to manual sort order when no orderby parameter is specified.",
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>

				<FormControl disabled={!isProActive}>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.rest_collections_sortable_wp_query_enforce
								}
								onChange={ setField }
								size="small"
								name="rest_collections_sortable_wp_query_enforce"
							/>
						}
						label={ __( 'Apply Sort Order in WordPress Queries', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							"Fall back to manual sort order when no orderby argument is specified.",
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>

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
								name="rest_collections_sortable_post_types"
								label={ __(
									'Enable On Post Types',
									'rest-api-firewall'
								) }
								value={ form.rest_collections_sortable_post_types }
								helperText={
									__( 'Enable sorting for the selected post types.', 'rest-api-firewall' )
								}
								disabled={ ! isProActive }
								options={ postTypes }
								onChange={ setField }
							/>
						) }
					</Box>
				</Stack>
			</Stack>

		</Stack>
	);
}

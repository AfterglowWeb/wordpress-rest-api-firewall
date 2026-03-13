import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';

import MultipleSelect from '../MultipleSelect';
import Divider from '@mui/material/Divider';

export default function Collections( { form, setField, postTypes } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const isProActive =
		hasValidLicense && form.rest_collections_sortable_enabled;

	const postTypeOptions = postTypes ? postTypes.filter( ( pt ) => pt.type === 'post_type' ) : [];
	const taxonomyOptions = postTypes ? postTypes.filter( ( pt ) => pt.type === 'taxonomy' ) : [];

	return (
		<Stack spacing={ 3 } maxWidth={ 600 } sx={{ p: 4, pt: 6}}>
			<Stack
				spacing={ 3 }
				direction={ 'row' }
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.rest_collections_per_page_enabled
								}
								onChange={ setField }
								size="small"
								name="rest_collections_per_page_enabled"
							/>
						}
						label={ __(
							'Enforce Per Page Parameter',
							'rest-api-firewall'
						) }
					/>
				</FormControl>
				<Stack
					sx={ { flex: 1 } }
					spacing={ 3 }
					direction={ { xs: 'column', sm: 'row' } }
					justifyContent={ 'space-between' }
					alignItems={ { xs: 'stretch', sm: 'flex-start' } }
				>
					<TextField
						sx={ { flex: 1 } }
						label={ __( 'Posts Per Page', 'rest-api-firewall' ) }
						type="number"
						min="0"
						max="10000"
						name="rest_collections_posts_per_page"
						value={ form.rest_collections_posts_per_page }
						onChange={ setField }
						fullWidth
					/>

					<TextField
						sx={ { flex: 1 } }
						label={ __(
							'Attachments Per Page',
							'rest-api-firewall'
						) }
						type="number"
						min="0"
						max="10000"
						name="rest_collections_attachments_per_page"
						value={ form.rest_collections_attachments_per_page }
						onChange={ setField }
						fullWidth
					/>
				</Stack>
			</Stack>

			<Divider />

			<Stack spacing={ 3 }>
				<Stack
					spacing={ 3 }
					direction={ 'row' }
					justifyContent={ 'flex-start' }
					alignItems={ 'flex-start' }
				>
					<FormControl
						sx={ { flex: 1 } }
						disabled={ ! hasValidLicense }
					>
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
							label={ __(
								'Enable Drag-And-Drop Sorting',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Add a drag-and-drop sorting column to post admin screens. Sorted posts can be queried via REST using the orderby parameter set to "menu_order".',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<Box sx={ { flex: 1 } }>
						<MultipleSelect
							name="rest_collections_sortable_post_types"
							label={ __(
								'Choose Post Types',
								'rest-api-firewall'
							) }
							value={
								form.rest_collections_sortable_post_types
							}
							helperText={ __(
								'Enable sorting on the selected post types.',
								'rest-api-firewall'
							) }
							disabled={ ! isProActive }
							options={ postTypeOptions }
							onChange={ setField }
						/>
						<MultipleSelect
							name="rest_collections_sortable_taxonomies"
							label={ __(
								'Choose Taxonomies',
								'rest-api-firewall'
							) }
							value={
								form.rest_collections_sortable_taxonomies
							}
							helperText={ __(
								'Enable term ordering via REST for the selected taxonomies.',
								'rest-api-firewall'
							) }
							disabled={ ! isProActive }
							options={ taxonomyOptions }
							onChange={ setField }
						/>
					</Box>
				</Stack>

				<Stack spacing={ 3 }>
					<FormControl disabled={ ! isProActive }>
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
							label={ __(
								'Apply Sort Order in REST Requests',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Applies in requests with no orderby parameter.',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<FormControl disabled={ ! isProActive }>
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
							label={ __(
								'Apply Sort Order in WordPress Queries',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Applies in queries with no orderby argument.',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>
				</Stack>
			</Stack>
		</Stack>
	);
}

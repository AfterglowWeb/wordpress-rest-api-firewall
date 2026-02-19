import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

export default function CollectionsPerPage( { form, setField, postTypes } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack spacing={ 3 } >
			<Typography variant="subtitle1" fontWeight={ 600 }>
				{ __( 'Collections Per Page', 'rest-api-firewall' ) }
			</Typography>
			<Stack
				spacing={ 3 }
				direction={ 'row' }
				justifyContent={ 'space-between' }
				alignItems={ 'flex-start' }
			>
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
						label={ __( 'Enable', 'rest-api-firewall' ) }
					/>
				</FormControl>
			</Stack>
		</Stack>
	);
}

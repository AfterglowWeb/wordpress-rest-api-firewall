import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

export default function ModelsEmbed( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const isPropertiesDisabled = ! form.rest_models_enabled;
	const isProDisabled = ! hasValidLicense || isPropertiesDisabled;

	return (
		<Stack spacing={ 3 }>
			<Stack
				spacing={ 3 }
				direction={ 'row' }
				justifyContent={ 'space-between' }
				alignItems={ 'center' }
			>
				<Typography
					variant="subtitle1"
					fontWeight={ 600 }
					sx={ { mb: 2 } }
				>
					{ __( 'Embed ', 'rest-api-firewall' ) }
				</Typography>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ !! form.rest_models_enabled }
								name="rest_models_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Enable', 'rest-api-firewall' ) }
					/>
				</FormControl>
			</Stack>

			<FormControl disabled={ isPropertiesDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_remove_links_prop }
							name="rest_models_remove_links_prop"
							onChange={ setField }
						/>
					}
					label={ __(
						'Remove _links property',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					{ __(
						'Remove the `_links` property from REST responses.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>
			
			
						<FormControl disabled={ isPropertiesDisabled }>
							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={ !! form.rest_models_remove_embed_prop }
										name="rest_models_remove_embed_prop"
										onChange={ setField }
									/>
								}
								label={ __(
									'Remove _embed property',
									'rest-api-firewall'
								) }
							/>
							<FormHelperText>
								{ __(
									'Remove the `_embed` property from REST responses.',
									'rest-api-firewall'
								) }
							</FormHelperText>
						</FormControl>

			<FormControl disabled={ isPropertiesDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={
								!! form.rest_models_embed_post_attachments_enabled
							}
							name="rest_models_embed_post_attachments_enabled"
							onChange={ setField }
						/>
					}
					label={ __(
						'Embed Post Attachments',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					<Typography variant="caption">
						{ __(
							'Add an array of the attachments related to the post with your model.',
							'rest-api-firewall'
						) }
					</Typography>
					<br />
					<Typography variant="caption">
						{ __(
							'Includes featured attachment, post content attachments and ACF fields according to their type.',
							'rest-api-firewall'
						) }
					</Typography>
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isPropertiesDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_with_acf_enabled }
							name="rest_models_with_acf_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed ACF Fields', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __( 'Enable the `acf` property on REST responses.', 'rest-api-firewall' ) }
				</FormHelperText>
			</FormControl>
			
			<FormControl disabled={ ! hasValidLicense }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={
								!! form.rest_models_embed_featured_attachment_enabled
							}
							name="rest_models_embed_featured_attachment_enabled"
							onChange={ setField }
						/>
					}
					label={ __(
						'Embed Featured Attachments',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					{ __(
						'Replace featured attachment IDs with your model.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ ! hasValidLicense }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_embed_terms_enabled }
							name="rest_models_embed_terms_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed Terms', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Replace term IDs with your model.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ ! hasValidLicense }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_embed_author_enabled }
							name="rest_models_embed_author_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed Author', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Replace the author ID with your model.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>
			
		</Stack>
	);
}

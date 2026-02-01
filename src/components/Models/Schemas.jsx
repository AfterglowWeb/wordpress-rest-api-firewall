import { useLicense } from '../../contexts/LicenseContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

export default function Models( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const isSchemaDisabled = ! form.rest_models_enabled;
	const isProDisabled = ! hasValidLicense || isSchemaDisabled;

	return (
		<Stack spacing={ 3 }>
			<Stack spacing={ 3 } direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
				<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
					{ __( 'Bulk Schemas Filtering', 'rest-api-firewall' ) }
				</Typography>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={ !! form.rest_models_enabled }
								name="rest_models_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Enable', 'rest-api-firewall' ) }
					/>
				</FormControl>
			</Stack>
			<Divider />

			<FormControl disabled={ isProDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_relative_url_enabled }
							name="rest_models_relative_url_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Relative urls', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Remove host from post and term urls (http[s]://www.domain-example.com).',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isSchemaDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_embed_featured_attachment_enabled }
							name="rest_models_embed_featured_attachment_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed featured attachments', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Replace featured attachment ids by simple objects.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isSchemaDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_embed_post_attachments_enabled }
							name="rest_models_embed_post_attachments_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed attachments on posts', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					<Typography variant="caption">{ __(
						'Add a simplified array of attachments on posts',
						'rest-api-firewall'
					) }</Typography><br/>
					<Typography variant="caption">{ __(
						'Includes featured attachment and ACF fields according to their type.',
						'rest-api-firewall'
					) }</Typography>
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isProDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_relative_attachment_url_enabled }
							name="rest_models_relative_attachment_url_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Relative attachment urls', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					<Typography variant="caption">{ __(
						'Remove host and upload path from attachment urls',
						'rest-api-firewall'
					) }</Typography><br/>
					<Typography variant="caption">https://www.domain-example.com/wp-content/uploads</Typography>
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isSchemaDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_models_embed_terms_enabled }
							name="rest_models_embed_terms_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed terms', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Replace terms ids by simplified term objects',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isSchemaDisabled }>
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
						'Replace author id by a simplified author object',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isSchemaDisabled }>
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
					{ __( 'Activate the `acf` property', 'rest-api-firewall' ) }
				</FormHelperText>
			</FormControl>

			<FormControl disabled={ isSchemaDisabled }>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.rest_firewall_remove_links_prop }
							name="rest_firewall_remove_links_prop"
							onChange={ setField }
						/>
					}
					label={ __( 'Remove _links property', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Remove the `_links` property from REST responses',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

		</Stack>
	);
}

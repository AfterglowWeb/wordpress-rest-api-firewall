/**
 * GlobalProperties — the global output-transformation toggles for the Properties panel.
 *
 * Extracted so it can be embedded inside the Pro ApplicationEditor as a per-application
 * configuration section while still being used in Properties.jsx for free users.
 *
 * Props: form, setField
 */
import { useLicense } from '../../contexts/LicenseContext';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';

export default function GlobalProperties( { form, setField } ) {
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	return (
		<Stack spacing={ 3 }>
			<Tooltip
				followCursor
				title={
					! hasValidLicense
						? __( 'Licence required', 'rest-api-firewall' )
						: ''
				}
			>
				<FormControl disabled={ ! hasValidLicense }>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ !! form.rest_models_enabled }
								name="rest_models_enabled"
								onChange={ setField }
							/>
						}
						label={ __(
							'Enable Properties Filtering',
							'rest-api-firewall'
						) }
					/>
				</FormControl>
			</Tooltip>

			<Divider />

			<Typography
				variant="caption"
				sx={ {
					display: 'block',
					mt: 1,
					textTransform: 'uppercase',
					letterSpacing: 0.5,
					fontSize: '0.75rem',
					color: ! hasValidLicense
						? 'text.disabled'
						: 'text.secondary',
				} }
			>
				{ __( 'Global Settings', 'rest-api-firewall' ) }
			</Typography>

			<Stack direction="row" gap={ 2 }>
				<Stack spacing={ 2 }>
					<FormControl disabled={ ! hasValidLicense }>
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

					<FormControl disabled={ ! hasValidLicense }>
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

					<FormControl disabled={ ! hasValidLicense }>
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
								'Flatten `rendered`',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Move the `rendered` value up to its parent.',
								'rest-api-firewall'
							) }
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
								'Resolve Featured Attachments',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Replace the featured attachment ID with its configured properties.',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<FormControl disabled={ ! hasValidLicense }>
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
								'Resolve Attachments',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							<Typography variant="caption">
								{ __(
									'Collect featured, content, and ACF image/gallery attachments into a single `attachments` property.',
									'rest-api-firewall'
								) }
							</Typography>
						</FormHelperText>
					</FormControl>
				</Stack>

				<Stack spacing={ 2 }>
					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.rest_models_embed_terms_enabled
									}
									name="rest_models_embed_terms_enabled"
									onChange={ setField }
								/>
							}
							label={ __( 'Resolve Terms', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __(
								'Replace term IDs with their configured properties.',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.rest_models_embed_author_enabled
									}
									name="rest_models_embed_author_enabled"
									onChange={ setField }
								/>
							}
							label={ __(
								'Resolve Authors',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Replace the author ID with its configured properties.',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.rest_models_remove_links_prop
									}
									name="rest_models_remove_links_prop"
									onChange={ setField }
								/>
							}
							label={ __(
								'Remove `_links` property',
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

					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.rest_models_remove_embed_prop
									}
									name="rest_models_remove_embed_prop"
									onChange={ setField }
								/>
							}
							label={ __(
								'Remove `_embed` property',
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

					<Stack spacing={ 0 }>
						<FormControl disabled={ ! hasValidLicense }>
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

						<FormControl
							sx={ { pl: 2 } }
							disabled={ ! hasValidLicense }
						>
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
								label={
									<Typography
										variant="caption"
										sx={ {
											color: ! hasValidLicense
												? 'text.disabled'
												: 'text.secondary',
										} }
									>
										{ __(
											'Apply to Sub Properties',
											'rest-api-firewall'
										) }
									</Typography>
								}
							/>
						</FormControl>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
}

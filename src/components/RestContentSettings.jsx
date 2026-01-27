import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function RestContentSettings( { form, setField, postTypes } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack spacing={ 3 } maxWidth="sm">

			<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
				{ __( 'Collections', 'rest-api-firewall' ) }
			</Typography>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={
								!! form.rest_api_restrict_post_types_enabled
							}
							name="rest_api_restrict_post_types_enabled"
							onChange={ setField }
						/>
					}
					label={ __(
						'Restict to Posts Types',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<Box sx={ { minWidth: 120 } }>
				{ postTypes && (
					<MultipleSelect
						name="rest_api_allowed_post_types"
						label={ __( 'Expose Post Types', 'rest-api-firewall' ) }
						value={ form.rest_api_allowed_post_types }
						helperText={
							'If empty, default REST settings are applied'
						}
						options={ postTypes }
						onChange={ setField }
					/>
				) }
			</Box>

			<Stack direction="row" gap={2}>
				<TextField
					label={ __( 'Posts Per Page', 'rest-api-firewall' ) }
					type="number"
					min="0"
					max="1000"
					helperText={ __(
						'Applies to REST collections only',
						'rest-api-firewall'
					) }
					name="rest_api_posts_per_page"
					value={ form.rest_api_posts_per_page }
					onChange={ setField }
					fullWidth
				/>

				<TextField
					label={ __( 'Attachments Per Page', 'rest-api-firewall' ) }
					type="number"
					min="0"
					max="1000"
					helperText={ __(
						'Applies to Blank REST attachment endpoints',
						'rest-api-firewall'
					) }
					name="rest_api_attachments_per_page"
					value={ form.rest_api_attachments_per_page }
					onChange={ setField }
					fullWidth
				/>
			</Stack>

			<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
				{ __( 'Posts and Terms', 'rest-api-firewall' ) }
			</Typography>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_firewall_relative_url_enabled }
							name="rest_firewall_relative_url_enabled"
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

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={
								!! form.rest_firewall_embed_featured_attachment_enabled
							}
							name="rest_firewall_embed_featured_attachment_enabled"
							onChange={ setField }
						/>
					}
					label={ __(
						'Embed featured attachments',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					{ __(
						'Replace featured attachment ids by simple objects.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={
								!! form.rest_firewall_embed_post_attachments_enabled
							}
							name="rest_firewall_embed_post_attachments_enabled"
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

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={
								!! form.rest_firewall_relative_attachment_url_enabled
							}
							name="rest_firewall_relative_attachment_url_enabled"
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

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_firewall_embed_terms_enabled }
							name="rest_firewall_embed_terms_enabled"
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

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_firewall_embed_terms_enabled }
							name="rest_firewall_embed_author_enabled"
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

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_firewall_with_acf_enabled }
							name="rest_firewall_with_acf_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Embed ACF Fields', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Activate the `acf` property',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_firewall_json_acf_fields_enabled }
							name="rest_firewall_json_acf_fields_enabled"
							onChange={ setField }
						/>
					}
					label={ __( 'Sync ACF Fields to JSON', 'rest-api-firewall' ) }
				/>
				<FormHelperText>
					{ __(
						'Write JSON files in config directory',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.rest_firewall_use_rest_models_enabled }
							name="rest_firewall_use_rest_models_enabled"
							onChange={ setField }
						/>
					}
					label={ __(
						'Disable REST API Firewall REST Models',
						'rest-api-firewall'
					) }
				/>
				<FormHelperText>
					{ __(
						'Use standard WordPress REST models.',
						'rest-api-firewall'
					) }
				</FormHelperText>
			</FormControl>

		</Stack>
	);
}


function MultipleSelect( {
	label,
	helperText,
	name,
	value,
	options,
	onChange,
} ) {
	const MenuProps = {
		PaperProps: {
			style: {
				maxHeight: 48 * 4.5 + 8,
				width: 250,
			},
		},
	};

	const safeValue = Array.isArray( value ) ? value : [];

	return (
		<FormControl fullWidth>
			<InputLabel id={ `${ name }-label` }>{ label }</InputLabel>

			<Select
				labelId={ `${ name }-label` }
				id={ name }
				name={ name }
				multiple
				value={ safeValue }
				onChange={ ( e ) => {
					onChange( e );
				} }
				input={ <OutlinedInput label={ label } /> }
				renderValue={ ( selected ) => (
					<Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 0.5 } }>
						{ Array.isArray( selected )
							? selected.map( ( val ) => {
									const option = options.find(
										( o ) => o.value === val
									);
									return option ? (
										<Chip
											key={ val }
											label={ option.label }
										/>
									) : null;
							  } )
							: null }
					</Box>
				) }
				MenuProps={ MenuProps }
			>
				{ options.map( ( option ) =>
					option?.value != null && option?.label ? (
						<MenuItem key={ option.value } value={ option.value }>
							{ option.label }
						</MenuItem>
					) : null
				) }
			</Select>
			{ helperText && <FormHelperText>{ helperText }</FormHelperText> }
		</FormControl>
	);
}

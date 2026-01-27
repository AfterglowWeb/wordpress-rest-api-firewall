import { useTheme } from '@mui/material/styles';
import { useAdminData } from '../contexts/AdminDataContext';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function CoreSettings( { form, setField, setSlider } ) {
	const { __ } = wp.i18n || {};
	const theme = useTheme();
	const { adminData } = useAdminData();
	const redirectPresetUrlOptions = adminData?.redirect_preset_url_options || {};

	const valueLabelFormat = ( value ) =>
		value >= 1024 ? `${ value / 1024 } MB` : `${ value } KB`;

	return (
		<Stack spacing={ 3 } maxWidth="sm">

			<Stack spacing={3}>
				<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
					{ __( 'Redirect Templates', 'rest-api-firewall' ) }
				</Typography>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.core_redirect_templates_enabled
								}
								name="core_redirect_templates_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Enable Redirect Templates', 'rest-api-firewall' ) }
					/>
					<FormHelperText>{ __( 'Redirect theme templates to front page, blog page, login page or a custom URL', 'rest-api-firewall' ) }</FormHelperText>
				</FormControl>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.core_redirect_templates_free_url_enabled
								}
								name="core_redirect_templates_free_url_enabled"
								onChange={ setField }
								disabled={ ! form.core_redirect_templates_enabled }
							/>
						}
						label={ __( 'Custom URL', 'rest-api-firewall' ) }
					/>
					<FormHelperText>{ __( 'Redirect theme templates to a custom url', 'rest-api-firewall' ) }</FormHelperText>
				</FormControl>

				<FormControl>
					<InputLabel id="redirect-templates-preset-url-label">
						{ __( 'WordPress Pages', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						labelId="redirect-templates-preset-url-label"
						id="core_redirect_templates_preset_url"
						name="core_redirect_templates_preset_url"
						value={ form.core_redirect_templates_preset_url }
						label={ __( 'Redirect Page', 'rest-api-firewall' ) }
						onChange={ setField }
						disabled={ ! form.core_redirect_templates_enabled || form.core_redirect_templates_free_url_enabled }
					>
						<MenuItem value={ 0 }>
							<em>{ __( 'Select a Page', 'rest-api-firewall' ) }</em>
						</MenuItem>
						{ redirectPresetUrlOptions && redirectPresetUrlOptions.map( ( presetUrl ) =>
							presetUrl.value && presetUrl.label ? (
								<MenuItem key={ presetUrl.value } value={ presetUrl.value }>
									{ presetUrl.label }
								</MenuItem>
							) : null
						) }
					</Select>
				</FormControl>

				<TextField
					label={ __( 'Custom URL', 'rest-api-firewall' ) }
					type="url"
					helperText={ __(
						'Full url with protocol and domain (https://www.example.com)',
						'rest-api-firewall'
					) }
					name="core_redirect_templates_free_url"
					value={ form.core_redirect_templates_free_url }
					onChange={ setField }
					disabled={ ! form.core_redirect_templates_enabled || ! form.core_redirect_templates_free_url_enabled }
					fullWidth
				/>
			</Stack>
			
			

			<Stack spacing={3}>
				<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
						{ __( 'Post Content', 'rest-api-firewall' ) }
				</Typography>
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.core_disable_gutenberg_enabled
								}
								name="core_disable_gutenberg_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Disable Gutenberg', 'rest-api-firewall' ) }
					/>
					<FormHelperText>{ __( 'Use WordPress legacy editor as post editor', 'rest-api-firewall' ) }</FormHelperText>
				</FormControl>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.core_remove_empty_p_tags_enabled
								}
								name="core_remove_empty_p_tags_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Remove empty p tags', 'rest-api-firewall' ) }
					/>
					<FormHelperText>{ __( 'Remove empty paragraphs added by content filtering', 'rest-api-firewall' ) }</FormHelperText>
				</FormControl>

			</Stack>
			
			<Stack spacing={3}>
				<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
						{ __( 'Comments', 'rest-api-firewall' ) }
				</Typography>
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.core_disable_comments_enabled
								}
								name="core_disable_comments_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Disable Comments', 'rest-api-firewall' ) }
					/>
					<FormHelperText>{ __( 'Deactivate comments site wide', 'rest-api-firewall' ) }</FormHelperText>
				</FormControl>
			</Stack>

			<Stack spacing={3}>
			<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
					{ __( 'Image Files', 'rest-api-firewall' ) }
			</Typography>

			<Box>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={
									!! form.core_svg_webp_support_enabled
								}
								name="core_svg_webp_support_enabled"
								onChange={ setField }
							/>
						}
						label={ __( 'Enable SVG and Webp Support', 'rest-api-firewall' ) }
					/>
					<FormHelperText>{ __( 'Enable .svg and .webp image files format support', 'rest-api-firewall' ) }</FormHelperText>
				</FormControl>

				<FormControl>

					<Stack direction={ { xs: 'column', sm: 'row' } }>
						<FormControlLabel
							control={
								<Switch
									checked={
										!! form.core_max_upload_weight_enabled
									}
									name="core_max_upload_weight_enabled"
									onChange={ setField }
								/>
							}
							label={ __(
								'Limit Images Weight',
								'rest-api-firewall'
							) }
						/>
						<Typography
							sx={ {
								display: 'flex',
								alignItems: 'center',
								mb: 0,
							} }
							color={
								form.core_max_upload_weight_enabled
									? theme.palette.primary.main
									: theme.palette.text.disabled
							}
							id="max-upload-weight-slider"
							gutterBottom
						>
							{ __( 'Max Images Upload Weight', 'rest-api-firewall' ) } :{ ' ' }
							{ valueLabelFormat(
								form.core_max_upload_weight
							) }
						</Typography>
					</Stack>

					<Slider
						value={ form.core_max_upload_weight }
						min={ 1 }
						max={ 1024 }
						step={ 1 }
						disabled={ ! form.core_max_upload_weight_enabled }
						getAriaValueText={ valueLabelFormat }
						valueLabelFormat={ valueLabelFormat }
						onChange={ ( _, value ) =>
							setSlider( 'core_max_upload_weight', value )
						}
						valueLabelDisplay="auto"
						aria-labelledby="max-upload-weight-slider"
					/>

					<FormHelperText>
						{ __(
							'Limit the images weight users can upload.',
							'rest-api-firewall'
						) }
					</FormHelperText>

				</FormControl>
			</Box>
			</Stack>

		</Stack>
	);
}

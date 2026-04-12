import { useTheme } from '@mui/material/styles';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';

import DeployTheme from './DeployTheme';

export default function ThemeSettings( {
	form,
	setField,
	setSlider,
	themeStatus,
	setThemeStatus,
} ) {
	const { __ } = wp.i18n || {};
	const theme = useTheme();
	const disabled = ! themeStatus?.active;

	const valueLabelFormat = ( value ) =>
		value >= 1024 ? `${ value / 1024 } MB` : `${ value } KB`;

	return (
		<Stack p={ 4 } flexGrow={ 1 } direction={ { xs: 'column', xl: 'row' } } gap={ 4 }>
			<Stack flex={ 1 } spacing={ 3 }>
				<DeployTheme
					status={ themeStatus }
					setStatus={ setThemeStatus }
				/>

				<Stack spacing={ 3 }>
					<Typography
						variant="subtitle1"
						fontWeight={ 600 }
						sx={ { mb: 2 } }
					>
						{ __( 'ACF', 'rest-api-firewall' ) }
					</Typography>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.theme_json_acf_fields_enabled
									}
									name="theme_json_acf_fields_enabled"
									onChange={ setField }
								/>
							}
							label={ __(
								'Sync ACF Fields to JSON',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Write JSON files in theme config directory',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>
				</Stack>

			</Stack>

			<Stack flex={ 1 } spacing={ 3 }>

				<Stack spacing={ 3 }>
					<Typography
						variant="subtitle1"
						fontWeight={ 600 }
						sx={ { mb: 2 } }
					>
						{ __( 'Content', 'rest-api-firewall' ) }
					</Typography>
					<FormControl disabled={ disabled }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_gutenberg }
									name="theme_disable_gutenberg"
									onChange={ setField }
									disabled={ disabled }
								/>
							}
							label={ __(
								'Disable Gutenberg',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Use WordPress legacy editor as post editor',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<FormControl disabled={ disabled }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.theme_remove_empty_p_tags_enabled
									}
									name="theme_remove_empty_p_tags_enabled"
									onChange={ setField }
									disabled={ disabled }
								/>
							}
							label={ __(
								'Remove empty p tags',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Remove empty paragraphs added by content filtering',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>

					<FormControl disabled={ disabled }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.theme_remove_emoji_scripts
									}
									name="theme_remove_emoji_scripts"
									onChange={ setField }
									disabled={ disabled }
								/>
							}
							label={ __(
								'Remove emoji scripts',
								'rest-api-firewall'
							) }
						/>
						<FormHelperText>
							{ __(
								'Remove emoji scripts from front and backend',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>
				</Stack>

				<Stack spacing={ 3 }>
					<Typography
						variant="subtitle1"
						fontWeight={ 600 }
						sx={ { mb: 2 } }
					>
						{ __( 'Image Files', 'rest-api-firewall' ) }
					</Typography>

					<Stack spacing={ 3 }>
						<FormControl disabled={ disabled }>
							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={
											!! form.theme_svg_webp_support_enabled
										}
										name="theme_svg_webp_support_enabled"
										onChange={ setField }
										disabled={ disabled }
									/>
								}
								label={ __(
									'Enable SVG and Webp Support',
									'rest-api-firewall'
								) }
							/>
							<FormHelperText>
								{ __(
									'Enable .svg and .webp image files format support',
									'rest-api-firewall'
								) }
							</FormHelperText>
						</FormControl>

						<FormControl disabled={ disabled }>
							<Stack>
								<FormControlLabel
									control={
										<Switch
											size="small"
											checked={
												!! form.theme_max_upload_weight_enabled
											}
											name="theme_max_upload_weight_enabled"
											onChange={ setField }
											disabled={ disabled }
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
										disabled ||
										! form.theme_max_upload_weight_enabled
											? theme.palette.text.disabled
											: theme.palette.primary.main
									}
									id="max-upload-weight-slider"
									gutterBottom
								>
									{ __(
										'Max Images Upload Weight',
										'rest-api-firewall'
									) }{ ' ' }
									:{ ' ' }
									{ valueLabelFormat(
										form.theme_max_upload_weight
									) }
								</Typography>
							</Stack>
							<Stack pt={ 1 } px={ 1 }>
								<Slider
									value={ form.theme_max_upload_weight }
									min={ 1 }
									max={ 1024 }
									step={ 1 }
									disabled={
										disabled ||
										! form.theme_max_upload_weight_enabled
									}
									getAriaValueText={ valueLabelFormat }
									valueLabelFormat={ valueLabelFormat }
									onChange={ ( _, value ) =>
										setSlider(
											'theme_max_upload_weight',
											value
										)
									}
									valueLabelDisplay="auto"
									aria-labelledby="max-upload-weight-slider"
								/>
							</Stack>
							<FormHelperText>
								{ __(
									'Limit the images weight users can upload',
									'rest-api-firewall'
								) }
							</FormHelperText>
						</FormControl>
					</Stack>
				</Stack>

				
			</Stack>
		</Stack>
	);
}

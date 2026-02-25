import { useState, useEffect } from '@wordpress/element';
import { useLicense } from '../../contexts/LicenseContext';
import { useAdminData } from '../../contexts/AdminDataContext';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

import Switch from '@mui/material/Switch';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';

import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import CopyButton from '../CopyButton';
import Divider from '@mui/material/Divider';

const TYPE_COLORS = {
	string: 'default',
	integer: 'primary',
	number: 'primary',
	boolean: 'info',
	object: 'secondary',
	array: 'warning',
};

export default function Properties( { setField, postTypes, form } ) {
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};
	const [ selectedPostType, setSelectedPostType ] = useState( 'post' );

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

			<Stack spacing={ 3 }>
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
								label={ __(
									'Relative URLs',
									'rest-api-firewall'
								) }
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
								label={ __(
									'Resolve Terms',
									'rest-api-firewall'
								) }
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
					{ __( 'Per Property Settings', 'rest-api-firewall' ) }
				</Typography>

				<FormControl fullWidth sx={ { maxWidth: 270 } }>
					<InputLabel>
						{ __( 'Select Post Type', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						value={ selectedPostType }
						defaultValue={ postTypes[ 0 ].value || '' }
						label={ __( 'Select Post Type', 'rest-api-firewall' ) }
						onChange={ ( e ) =>
							setSelectedPostType( e.target.value )
						}
					>
						{ postTypes &&
							postTypes.map( ( postType ) => (
								<MenuItem
									key={ postType.value }
									value={ postType.value }
								>
									{ postType.label }
								</MenuItem>
							) ) }
					</Select>
				</FormControl>

				<ModelProperties
					selectedPostType={ selectedPostType }
					setField={ setField }
				/>
			</Stack>
		</Stack>
	);
}

export function PropertyRow( {
	propName,
	propConfig,
	selectedPostType,
	setField,
	hasValidLicense,
	__,
	depth = 0,
	basePath = '',
} ) {
	const [ expanded, setExpanded ] = useState( false );
	const [ detailsOpen, setDetailsOpen ] = useState( false );

	const readOnly = propConfig.readonly || false;
	const propContext = propConfig.context || [];
	const argsOptions = propConfig.args_options || [];
	const propType = propConfig.type || '';
	const subProperties = propConfig.properties || {};
	const isDisabled =
		propContext.length > 0 &&
		! propContext.includes( 'view' ) &&
		! propContext.includes( 'embed' );
	const settings = propConfig.settings || {};

	const [ localDisable, setLocalDisable ] = useState(
		settings.disable ?? false
	);

	useEffect( () => {
		setLocalDisable( settings.disable ?? false );
	}, [ settings.disable ] );

	const hasFilters =
		Array.isArray( settings.filters ) && settings.filters.length > 0;
	const hasSubProperties =
		subProperties &&
		typeof subProperties === 'object' &&
		! Array.isArray( subProperties ) &&
		Object.keys( subProperties ).length > 0;

	const typeLabel = Array.isArray( propType )
		? propType.join( '|' )
		: propType;
	const typeColor =
		TYPE_COLORS[ Array.isArray( propType ) ? propType[ 0 ] : propType ] ||
		'default';

	const hasDetails =
		propContext.length > 0 || readOnly || argsOptions.length > 0;

	return (
		<Box
			sx={ {
				opacity: isDisabled ? 0.45 : 1,
				'&:hover': { bgcolor: 'action.hover' },
				borderRadius: 0.5,
				px: 1,
				py: 0.25,
				...( depth > 0 && {
					ml: 2,
					borderLeft: '2px solid',
					borderColor: 'divider',
					pl: 1.5,
				} ),
			} }
		>
			<Box
				sx={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 1,
					minHeight: 36,
				} }
			>
				<Stack
					direction="row"
					spacing={ 0.75 }
					alignItems="center"
					sx={ { minWidth: 0, flex: 1 } }
				>
					{ hasSubProperties ? (
						<IconButton
							size="small"
							onClick={ () => setExpanded( ! expanded ) }
							sx={ {
								p: 0.25,
								transform: expanded
									? 'rotate(0deg)'
									: 'rotate(-90deg)',
								transition: 'transform 0.2s',
							} }
						>
							<ExpandMoreIcon
								fontSize="small"
								sx={ { fontSize: 18 } }
							/>
						</IconButton>
					) : (
						<Box sx={ { width: 26, flexShrink: 0 } } />
					) }

					<Stack
						direction={ 'row' }
						alignItems={ 'center' }
						gap={ 1 }
					>
						<Typography
							sx={ {
								flex: 1,
								textOverflow: 'ellipsis',
								overflow: 'hidden',
								whiteSpace: 'nowrap',
								fontSize: depth > 0 ? '0.9rem' : '1rem',
							} }
							fontWeight={ depth > 0 ? 400 : 500 }
						>
							{ propName }
						</Typography>
						<CopyButton sx={ { flex: 0 } } toCopy={ propName } />
					</Stack>

					{ typeLabel && (
						<Chip
							label={ typeLabel }
							size="small"
							color={ typeColor }
							variant="outlined"
							sx={ {
								height: 20,
								fontSize: '0.7rem',
								'& .MuiChip-label': { px: 0.75 },
							} }
						/>
					) }

					{ hasDetails && (
						<Link
							component="button"
							variant="caption"
							underline="always"
							color="text.secondary"
							onClick={ () => setDetailsOpen( ! detailsOpen ) }
							sx={ { fontSize: '0.7rem' } }
						>
							{ __( 'details', 'rest-api-firewall' ) }
						</Link>
					) }
				</Stack>

				{ ( depth === 0 || 'disable' in settings ) && (
					<Tooltip
						followCursor
						title={
							! hasValidLicense
								? __( 'Licence required', 'rest-api-firewall' )
								: ''
						}
					>
						<Stack
							direction="row"
							gap={ 1 }
							alignItems="center"
							justifyContent="flex-end"
							sx={ { flexShrink: 0 } }
						>
							{ depth === 0 &&
								hasFilters &&
								settings.filters.map( ( filter ) => (
									<FormControlLabel
										key={ filter.key }
										sx={ { flex: 0 } }
										disabled={ ! hasValidLicense }
										control={
											<Checkbox
												size="small"
												checked={ !! filter.value }
											/>
										}
										label={
											<Typography
												sx={ {
													width: 55,
													whiteSpace: 'nowrap',
												} }
												fontSize="0.75rem"
												color={
													! hasValidLicense
														? 'text.disabled'
														: 'text.primary'
												}
											>
												{ filter.label }
											</Typography>
										}
									/>
								) ) }

							<FormControlLabel
								disabled={ ! hasValidLicense }
								control={
									<Switch
										size="small"
										checked={ localDisable }
										onChange={ ( e ) => {
											const next = ! e.target.checked;
											setLocalDisable( next );
											setField( {
												target: {
													name: `${ basePath }.settings.disable`,
													value: next,
												},
											} );
										} }
									/>
								}
								label={
									<Typography
										sx={ {
											width: 55,
											whiteSpace: 'nowrap',
										} }
										fontSize="0.75rem"
										color={
											! hasValidLicense
												? 'text.disabled'
												: 'text.primary'
										}
									>
										{ __( 'Disable', 'rest-api-firewall' ) }
									</Typography>
								}
							/>
						</Stack>
					</Tooltip>
				) }
			</Box>

			<Collapse in={ detailsOpen }>
				{ propConfig.description && depth === 0 && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={ {
							display: 'block',
							pl: 4.25,
						} }
					>
						{ propConfig.description }
					</Typography>
				) }
				<Box
					sx={ {
						pl: 4.25,
						pb: 0.75,
						display: 'flex',
						flexWrap: 'wrap',
						gap: 1,
						alignItems: 'center',
					} }
				>
					{ propContext.length > 0 && (
						<Typography variant="caption" color="text.secondary">
							{ __( 'context:', 'rest-api-firewall' ) }{ ' ' }
							{ propContext.join( ', ' ) }
						</Typography>
					) }
					{ readOnly && (
						<Chip
							label={ __( 'read-only', 'rest-api-firewall' ) }
							size="small"
							sx={ {
								height: 18,
								fontSize: '0.65rem',
								'& .MuiChip-label': { px: 0.5 },
							} }
						/>
					) }
					{ argsOptions.map( ( opt ) => (
						<Chip
							key={ opt }
							label={ opt }
							size="small"
							variant="outlined"
							color="info"
							sx={ {
								height: 18,
								fontSize: '0.65rem',
								'& .MuiChip-label': { px: 0.5 },
							} }
						/>
					) ) }
				</Box>
			</Collapse>

			{ hasSubProperties && (
				<Collapse in={ expanded }>
					<Stack spacing={ 0 } sx={ { mt: 0.25, mb: 0.5 } }>
						{ Object.entries( subProperties ).map(
							( [ subName, subConfig ] ) => (
								<PropertyRow
									key={ subName }
									propName={ subName }
									propConfig={
										typeof subConfig === 'object' &&
										subConfig !== null
											? subConfig
											: { type: String( subConfig ) }
									}
									selectedPostType={ selectedPostType }
									setField={ setField }
									hasValidLicense={ hasValidLicense }
									__={ __ }
									depth={ depth + 1 }
									basePath={ `${ basePath }.properties.${ subName }` }
								/>
							)
						) }
					</Stack>
				</Collapse>
			) }
		</Box>
	);
}

function ModelProperties( { selectedPostType, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();
	const postProperties = adminData?.models_properties || {};

	return (
		<Stack spacing={ 1 }>
			{ selectedPostType &&
				postProperties?.[ selectedPostType ]?.props && (
					<Stack spacing={ 0 }>
						{ Object.entries(
							postProperties[ selectedPostType ].props
						).map( ( [ propName, propConfig ] ) => (
							<PropertyRow
								key={ propName }
								propName={ propName }
								propConfig={ propConfig }
								selectedPostType={ selectedPostType }
								setField={ setField }
								hasValidLicense={ hasValidLicense }
								__={ __ }
								basePath={ `postProperties.${ selectedPostType }.props.${ propName }` }
							/>
						) ) }
					</Stack>
				) }
		</Stack>
	);
}

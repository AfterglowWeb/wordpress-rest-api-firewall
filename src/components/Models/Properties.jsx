import { useState, useEffect } from '@wordpress/element';
import { useLicense } from '../../contexts/LicenseContext';
import { useAdminData } from '../../contexts/AdminDataContext';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';

import CopyButton from '../CopyButton';
import ObjectTypeSelect from '../ObjectTypeSelect';
import GlobalProperties from './GlobalProperties';

const TYPE_COLORS = {
	string: 'default',
	integer: 'primary',
	number: 'primary',
	boolean: 'info',
	object: 'secondary',
	array: 'warning',
};

const TYPE_LABELS = {
	post_type: 'Post Type',
	taxonomy: 'Taxonomy',
	author: 'User',
};

/**
 * Resolve the effective global value for a given filter key + property name.
 * Used to show inherited (read-only) filter state in the Filters menu.
 */
function resolveGlobalFilterValue( filterKey, propName, globalForm ) {
	if ( ! globalForm ) return false;
	switch ( filterKey ) {
		case 'relative_url':
			return !! globalForm.rest_models_relative_url_enabled;
		case 'rendered':
			return !! globalForm.rest_models_resolve_rendered_props;
		case 'embed':
			if ( 'featured_media' === propName ) return !! globalForm.rest_models_embed_featured_attachment_enabled;
			if ( 'author' === propName )         return !! globalForm.rest_models_embed_author_enabled;
			return !! globalForm.rest_models_embed_terms_enabled;
		default:
			return false;
	}
}

/**
 * Filters menu button + MUI Menu for a single PropertyRow.
 * Shows filter checkboxes (and the Search & Replace form) in a dropdown.
 * When isInherit=true, values are read-only with a "global" tag and an
 * "Apply local overrides" action to unlock editing.
 */
function FiltersMenu( {
	filters,
	propName,
	isInherit,
	globalForm,
	onToggleInherit,
	setField,
	basePath,
	disabled,
	hasValidLicense,
	__,
} ) {
	const [ anchorEl, setAnchorEl ] = useState( null );
	const open = Boolean( anchorEl );

	const handleOpen = ( e ) => setAnchorEl( e.currentTarget );
	const handleClose = () => setAnchorEl( null );

	const activeCount = filters.filter( ( f ) => {
		if ( f.type === 'search_replace' ) {
			return !! ( f.value?.search );
		}
		return isInherit
			? !! resolveGlobalFilterValue( f.key, propName, globalForm )
			: !! f.value;
	} ).length;

	const renderBooleanFilter = ( filter ) => {
		const displayValue = isInherit
			? resolveGlobalFilterValue( filter.key, propName, globalForm )
			: !! filter.value;

		return (
			<MenuItem
				key={ filter.key }
				dense
				disableRipple={ isInherit }
				sx={ { gap: 1, cursor: isInherit ? 'default' : 'pointer' } }
				onClick={
					isInherit
						? undefined
						: () =>
							setField( {
								target: {
									name: `${ basePath }.settings.filters.${ filter.key }`,
									value: ! filter.value,
								},
							} )
				}
			>
				<Checkbox
					size="small"
					checked={ displayValue }
					disabled={ isInherit || disabled || ! hasValidLicense }
					tabIndex={ -1 }
					disableRipple
					sx={ { p: 0.25 } }
				/>
				<Typography
					variant="body2"
					sx={ { flex: 1 } }
					color={
						( isInherit || disabled || ! hasValidLicense )
							? 'text.disabled'
							: 'text.primary'
					}
				>
					{ filter.tooltip || filter.label }
				</Typography>
				{ isInherit && (
					<Typography
						variant="caption"
						color="text.disabled"
						sx={ { fontStyle: 'italic', ml: 0.5 } }
					>
						{ __( 'global', 'rest-api-firewall' ) }
					</Typography>
				) }
			</MenuItem>
		);
	};

	const renderSearchReplaceFilter = ( filter ) => {
		const val = ( filter.value && typeof filter.value === 'object' ) ? filter.value : {};
		const isDisabled = isInherit || disabled || ! hasValidLicense;

		const patch = ( changes ) =>
			setField( {
				target: {
					name: `${ basePath }.settings.filters.${ filter.key }`,
					value: { ...val, ...changes },
				},
			} );

		return (
			<Box key={ filter.key } sx={ { px: 2, py: 1 } }>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={ { display: 'block', mb: 0.75, fontWeight: 500 } }
				>
					{ filter.tooltip || filter.label }
				</Typography>
				<Stack spacing={ 0.75 }>
					<TextField
						size="small"
						placeholder={ __( 'Search', 'rest-api-firewall' ) }
						value={ val.search || '' }
						disabled={ isDisabled }
						onChange={ ( e ) => patch( { search: e.target.value } ) }
						inputProps={ { style: { fontSize: '0.8rem' } } }
						fullWidth
					/>
					<TextField
						size="small"
						placeholder={ __( 'Replace with', 'rest-api-firewall' ) }
						value={ val.replace || '' }
						disabled={ isDisabled }
						onChange={ ( e ) => patch( { replace: e.target.value } ) }
						inputProps={ { style: { fontSize: '0.8rem' } } }
						fullWidth
					/>
					<Stack direction="row" flexWrap="wrap">
						{ [
							{ key: 'case_sensitive', label: __( 'Case sensitive', 'rest-api-firewall' ) },
							{ key: 'whole_word',     label: __( 'Whole word',     'rest-api-firewall' ) },
							{ key: 'regex',          label: __( 'Regex',          'rest-api-firewall' ) },
						].map( ( opt ) => (
							<FormControlLabel
								key={ opt.key }
								disabled={ isDisabled }
								control={
									<Checkbox
										size="small"
										checked={ !! val[ opt.key ] }
										onChange={ ( e ) => patch( { [ opt.key ]: e.target.checked } ) }
									/>
								}
								label={
									<Typography variant="caption">{ opt.label }</Typography>
								}
								sx={ { mr: 1 } }
							/>
						) ) }
					</Stack>
				</Stack>
			</Box>
		);
	};

	return (
		<>
			<Button
				size="small"
				variant={ activeCount > 0 ? 'contained' : 'outlined' }
				disableElevation
				startIcon={ <FilterListIcon sx={ { fontSize: 14 } } /> }
				onClick={ handleOpen }
				disabled={ disabled || ! hasValidLicense }
				sx={ {
					fontSize: '0.7rem',
					py: 0.25,
					px: 1,
					minWidth: 0,
					textTransform: 'none',
					lineHeight: 1.5,
				} }
			>
				{ __( 'Filters', 'rest-api-firewall' ) }
				{ activeCount > 0 && ` (${ activeCount })` }
			</Button>

			<Menu
				anchorEl={ anchorEl }
				open={ open }
				onClose={ handleClose }
				PaperProps={ { sx: { minWidth: 300, maxWidth: 380 } } }
				transformOrigin={ { horizontal: 'right', vertical: 'top' } }
				anchorOrigin={ { horizontal: 'right', vertical: 'bottom' } }
			>
				{ filters.map( ( filter ) =>
					filter.type === 'search_replace'
						? renderSearchReplaceFilter( filter )
						: renderBooleanFilter( filter )
				) }

				{ onToggleInherit && (
					<>
						<Divider sx={ { my: 0.5 } } />
						{ isInherit ? (
							<MenuItem
								dense
								onClick={ () => { onToggleInherit(); handleClose(); } }
							>
								<Typography
									variant="body2"
									color="primary.main"
									fontWeight={ 500 }
								>
									{ __( 'Apply local overrides', 'rest-api-firewall' ) }
								</Typography>
							</MenuItem>
						) : (
							<MenuItem
								dense
								onClick={ () => { onToggleInherit(); handleClose(); } }
							>
								<Typography variant="body2" color="text.secondary">
									{ __( 'Revert to inherited', 'rest-api-firewall' ) }
								</Typography>
							</MenuItem>
						) }
					</>
				) }
			</Menu>
		</>
	);
}

export default function Properties( { setField, postTypes, form } ) {
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const [ selectedObjectType, setSelectedObjectType ] = useState( 'post' );

	const selectedObjectData =
		adminData?.post_types?.find(
			( t ) => t.value === selectedObjectType
		) ?? null;

	return (
		<Stack spacing={ 3 } p={4} flexGrow={ 1 }>
			<GlobalProperties form={ form } setField={ setField } />

			<Divider />

			<Stack spacing={ 3 }>
				<Stack gap={ 3 } direction="row">
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
							{ __(
								'Per Property Settings',
								'rest-api-firewall'
							) }
						</Typography>
						<ObjectTypeSelect
							types={ [ 'post_type', 'taxonomy', 'author' ] }
							disabled={ ! hasValidLicense }
							value={ selectedObjectType || '' }
							defaultValue={ postTypes[ 0 ]?.value || '' }
							label={ __(
								'Select Object Type',
								'rest-api-firewall'
							) }
							onChange={ ( e ) =>
								setSelectedObjectType( e.target.value )
							}
							sx={ { width: 270, maxWidth: 270 } }
							isSingle={ true }
						/>
					</Stack>
					{ selectedObjectData && (
						<Stack spacing={ 0 } justifyContent="flex-end">
							<Typography variant="h6" fontWeight={ 600 }>
								{ selectedObjectData.label }
							</Typography>
							<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
								<Typography
									color="text.secondary"
									sx={ { textTransform: 'lowercase' } }
									variant="caption"
								>
									{ TYPE_LABELS[ selectedObjectData.type ] ??
										selectedObjectData.type }{ ' ' }
									/
								</Typography>
								<Typography
									color="text.secondary"
									variant="caption"
								>
									{ selectedObjectData.public
										? __( 'public', 'rest-api-firewall' )
										: __(
												'private',
												'rest-api-firewall'
										  ) }{ ' ' }
									/
								</Typography>
								<Typography
									color="text.secondary"
									variant="caption"
								>
									{ selectedObjectData._builtin
										? __( 'builtin', 'rest-api-firewall' )
										: __( 'custom', 'rest-api-firewall' ) }
								</Typography>
							</Stack>
						</Stack>
					) }
				</Stack>

				<ModelProperties
					selectedObjectType={ selectedObjectType }
					setField={ setField }
				/>
			</Stack>
		</Stack>
	);
}

export function PropertyRow( {
	propName,
	propConfig,
	selectedObjectType,
	setField,
	hasValidLicense,
	__,
	depth = 0,
	basePath = '',
	alwaysExpanded = false,
	disabled = false,
	isInherit = undefined,
	onToggleInherit = null,
	globalForm = null,
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
					{ hasSubProperties && ! alwaysExpanded ? (
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
					<Stack
						direction="row"
						gap={ 0.5 }
						alignItems="center"
						justifyContent="flex-end"
						sx={ { flexShrink: 0 } }
					>
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
							>
								{ depth === 0 && hasFilters && (
									<FiltersMenu
										filters={ settings.filters }
										propName={ propName }
										isInherit={ isInherit }
										globalForm={ globalForm }
										onToggleInherit={ onToggleInherit }
										setField={ setField }
										basePath={ basePath }
										disabled={ disabled }
										hasValidLicense={ hasValidLicense }
										__={ __ }
									/>
								) }

								<FormControlLabel
									disabled={ disabled || ! hasValidLicense }
									control={
										<Switch
											size="small"
											checked={ localDisable }
											onChange={ ( e ) => {
												const next = e.target.checked;
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
												( disabled || ! hasValidLicense )
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
					</Stack>
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
				alwaysExpanded ? (
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
									selectedObjectType={ selectedObjectType }
									setField={ setField }
									hasValidLicense={ hasValidLicense }
									__={ __ }
									depth={ depth + 1 }
									basePath={ `${ basePath }.properties.${ subName }` }
									alwaysExpanded={ true }
									disabled={ disabled }
								/>
							)
						) }
					</Stack>
				) : (
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
										selectedObjectType={ selectedObjectType }
										setField={ setField }
										hasValidLicense={ hasValidLicense }
										__={ __ }
										depth={ depth + 1 }
										basePath={ `${ basePath }.properties.${ subName }` }
										disabled={ disabled }
									/>
								)
							) }
						</Stack>
					</Collapse>
				)
			) }
		</Box>
	);
}

function ModelProperties( { selectedObjectType, setField } ) {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();
	const postProperties = adminData?.models_properties || {};

	return (
		<Stack spacing={ 1 }>
			{ selectedObjectType &&
				postProperties?.[ selectedObjectType ]?.props && (
					<Stack spacing={ 0 }>
						{ Object.entries(
							postProperties[ selectedObjectType ].props
						).map( ( [ propName, propConfig ] ) => (
							<PropertyRow
								key={ propName }
								propName={ propName }
								propConfig={ propConfig }
								selectedObjectType={ selectedObjectType }
								setField={ setField }
								hasValidLicense={ hasValidLicense }
								__={ __ }
								basePath={ `postProperties.${ selectedObjectType }.props.${ propName }` }
							/>
						) ) }
					</Stack>
				) }
		</Stack>
	);
}

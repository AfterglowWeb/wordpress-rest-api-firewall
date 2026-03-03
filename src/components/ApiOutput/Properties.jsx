import { useState, useEffect } from '@wordpress/element';
import { useLicense } from '../../contexts/LicenseContext';
import { useAdminData } from '../../contexts/AdminDataContext';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
												onChange={ ( e ) =>
													setField( {
														target: {
															name: `${ basePath }.settings.filters.${ filter.key }`,
															value: e.target.checked,
														},
													} )
												}
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

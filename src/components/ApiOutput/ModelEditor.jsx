import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SchemaOutlinedIcon from '@mui/icons-material/SchemaOutlined';

import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import { PropertyRow } from './Properties';
import JsonSchemaBuilder from '../shared/JsonSchemaBuilder';
import ObjectTypeSelect from '../ObjectTypeSelect';

// Fallback bindings when no WP REST schema is available for the object type.
const FALLBACK_BINDINGS = [
	{ key: 'id', label: 'ID', type: 'integer' },
	{ key: 'slug', label: 'Slug', type: 'string' },
	{ key: 'title', label: 'Title', type: 'string' },
	{ key: 'content', label: 'Content', type: 'string' },
	{ key: 'excerpt', label: 'Excerpt', type: 'string' },
	{ key: 'status', label: 'Status', type: 'string' },
	{ key: 'date', label: 'Date', type: 'string' },
	{ key: 'modified', label: 'Modified', type: 'string' },
	{ key: 'link', label: 'Link (URL)', type: 'string' },
	{ key: 'author', label: 'Author ID', type: 'integer' },
	{ key: 'featured_media', label: 'Featured Media ID', type: 'integer' },
	{ key: 'categories', label: 'Categories', type: 'array' },
	{ key: 'tags', label: 'Tags', type: 'array' },
	{ key: 'meta', label: 'Meta', type: 'object' },
];

export default function ModelEditor( { model, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId, setDirtyFlag } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! model.id;

	const [ label, setLabel ] = useState( model.label || '' );
	const [ objectType, setObjectType ] = useState( model.object_type || '' );
	const [ isCustom, setIsCustom ] = useState( model.is_custom || false );
	const [ enabled, setEnabled ] = useState( model.enabled || false );

	// Separate states per mode so switching WP ↔ Custom doesn't destroy work.
	const [ wpProperties, setWpProperties ] = useState(
		! model.is_custom ? model.properties || {} : {}
	);
	const [ customProperties, setCustomProperties ] = useState(
		model.is_custom ? model.properties || {} : {}
	);

	const [ loaded, setLoaded ] = useState( isNew );

	// Active properties + setter derived from current mode.
	const properties = isCustom ? customProperties : wpProperties;
	const setProperties = isCustom ? setCustomProperties : setWpProperties;

	// Register dirty flag when editor is open; clear on unmount.
	useEffect( () => {
		setDirtyFlag( {
			has: true,
			message: __(
				'You are editing a model. Unsaved changes will be lost.',
				'rest-api-firewall'
			),
		} );
		return () => setDirtyFlag( { has: false, message: '' } );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		( async () => {
			try {
				const res = await fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'get_model_entry',
						nonce,
						id: model.id,
					} ),
				} );
				const json = await res.json();
				if ( json.success ) {
					const e = json.data.entry;
					setLabel( e.label || '' );
					setObjectType( e.object_type || '' );
					setIsCustom( e.is_custom || false );
					setEnabled( e.enabled || false );
					if ( e.is_custom ) {
						setCustomProperties( e.properties || {} );
					} else {
						setWpProperties( e.properties || {} );
					}
				}
			} finally {
				setLoaded( true );
			}
		} )();
	}, [ isNew, model.id, adminData, nonce ] );

	const buildPayload = () => ( {
		nonce,
		label,
		object_type: objectType,
		is_custom: isCustom ? '1' : '0',
		enabled: enabled ? '1' : '0',
		properties: JSON.stringify( properties ),
		application_id: selectedApplicationId || model.application_id || '',
	} );

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	const handleBack = useCallback( () => {
		clearDirty();
		onBack();
	}, [ clearDirty, onBack ] );

	const handleSave = useCallback( () => {
		if ( isNew ) {
			save(
				{ action: 'add_model_entry', ...buildPayload() },
				{
					onSuccess: ( data ) => {
						if ( data?.entry ) {
							clearDirty();
							onBack();
						}
					},
				}
			);
		} else {
			save(
				{
					action: 'update_model_entry',
					id: model.id,
					...buildPayload(),
				},
				{ onSuccess: clearDirty }
			);
		}
	}, [
		isNew,
		model.id,
		label,
		objectType,
		isCustom,
		enabled,
		properties,
		nonce,
		selectedApplicationId,
		clearDirty,
		onBack,
	] );

	const handleDelete = useCallback( () => {
		remove(
			{ action: 'delete_model_entry', nonce, id: model.id },
			{
				confirmTitle: __( 'Delete Model', 'rest-api-firewall' ),
				confirmMessage: `${ __(
					'Permanently delete',
					'rest-api-firewall'
				) } "${ label }"? ${ __(
					'This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					clearDirty();
					onBack();
				},
			}
		);
	}, [ remove, model.id, label, nonce, onBack, clearDirty, __ ] );

	// Changing object type makes all existing properties irrelevant — reset both.
	const handleObjectTypeChange = ( e ) => {
		setObjectType( e.target.value );
		setWpProperties( {} );
		setCustomProperties( {} );
	};

	// Switching mode keeps each mode's work intact.
	const handleModeChange = ( _, newMode ) => {
		if ( newMode === null ) {
			return;
		}
		setIsCustom( newMode === 'custom' );
	};

	if ( ! loaded ) {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				sx={ { height: 200 } }
			>
				<CircularProgress size={ 32 } />
			</Stack>
		);
	}

	const schemaProps =
		adminData?.models_properties?.[ objectType ]?.props || null;

	// Derive bindings for the custom schema builder from the WP REST schema when
	// available; fall back to the static list when the object type has no schema.
	// Sub-properties are included with dot notation (e.g. title.raw, title.rendered).
	const availableBindings = schemaProps
		? Object.entries( schemaProps ).flatMap( ( [ key, cfg ] ) => {
				const type = Array.isArray( cfg.type ) ? cfg.type[ 0 ] : cfg.type;
				const bindings = [
					{ key, label: cfg.description || key, type },
				];
				if (
					cfg.properties &&
					typeof cfg.properties === 'object' &&
					! Array.isArray( cfg.properties )
				) {
					Object.entries( cfg.properties ).forEach(
						( [ subKey, subCfg ] ) => {
							if (
								typeof subCfg === 'object' &&
								subCfg !== null
							) {
								bindings.push( {
									key: `${ key }.${ subKey }`,
									label:
										subCfg.description ||
										`${ key }.${ subKey }`,
									type: Array.isArray( subCfg.type )
										? subCfg.type[ 0 ]
										: subCfg.type,
								} );
							}
						}
					);
				}
				return bindings;
		  } )
		: FALLBACK_BINDINGS;

	return (
		<Stack spacing={ 0 } sx={ { height: '100%' } }>
			{ /* Toolbar */ }
			<Toolbar
				variant="dense"
				sx={ { gap: 1, px: 2, minHeight: 56, flexWrap: 'wrap' } }
				disableGutters
			>
				<IconButton size="small" onClick={ handleBack }>
					<ArrowBackIcon />
				</IconButton>

				<Typography variant="h6" fontWeight={ 600 } sx={ { flex: 1 } }>
					{ isNew
						? __( 'New Model', 'rest-api-firewall' )
						: label || __( 'Edit Model', 'rest-api-firewall' ) }
				</Typography>

				{ ! isNew && (
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ enabled }
								onChange={ ( e ) =>
									setEnabled( e.target.checked )
								}
							/>
						}
						label={
							<Typography variant="body2">
								{ __( 'Active', 'rest-api-firewall' ) }
							</Typography>
						}
					/>
				) }

				{ model.date_modified && (
					<Typography variant="caption" color="text.secondary">
						{ __( 'Modified', 'rest-api-firewall' ) }{ ' ' }
						{ formatDate( model.date_modified ) }
					</Typography>
				) }

				{ ! isNew && (
					<IconButton
						size="small"
						color="error"
						onClick={ handleDelete }
					>
						<DeleteOutlineIcon />
					</IconButton>
				) }

				<Button
					size="small"
					variant="contained"
					onClick={ handleSave }
					disabled={ saving || ! label || ! objectType }
				>
					{ isNew
						? __( 'Create', 'rest-api-firewall' )
						: __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Toolbar>

			<Stack spacing={ 3 } sx={ { overflowY: 'auto', flex: 1, p: 3 } }>
				{ /* Label */ }
				<TextField
					label={ __( 'Model Name', 'rest-api-firewall' ) }
					value={ label }
					onChange={ ( e ) => setLabel( e.target.value ) }
					size="small"
					fullWidth
					required
					helperText={ __(
						'Internal name for this model',
						'rest-api-firewall'
					) }
				/>

				<Divider />

				{ /* Object Type + Schema Mode */ }
				<Stack
					direction="row"
					spacing={ 2 }
					alignItems="flex-start"
					flexWrap="wrap"
				>
					<ObjectTypeSelect
						types={ [ 'post_type', 'taxonomy', 'author' ] }
						value={ objectType }
						defaultValue=""
						label={ __(
							'WordPress Object Type',
							'rest-api-firewall'
						) }
						onChange={ handleObjectTypeChange }
						sx={ { width: 270 } }
						isSingle
					/>

					<Stack spacing={ 0.5 }>
						<Typography variant="caption" color="text.secondary">
							{ __( 'Schema mode', 'rest-api-firewall' ) }
						</Typography>
						<ToggleButtonGroup
							value={ isCustom ? 'custom' : 'wp' }
							exclusive
							onChange={ handleModeChange }
							size="small"
						>
							<ToggleButton
								value="wp"
								sx={ { gap: 0.5, px: 1.5 } }
							>
								<SchemaOutlinedIcon fontSize="small" />
								<Typography variant="caption">
									{ __( 'WP Schema', 'rest-api-firewall' ) }
								</Typography>
							</ToggleButton>
							<ToggleButton
								value="custom"
								sx={ { gap: 0.5, px: 1.5 } }
							>
								<BuildOutlinedIcon fontSize="small" />
								<Typography variant="caption">
									{ __( 'Custom', 'rest-api-firewall' ) }
								</Typography>
							</ToggleButton>
						</ToggleButtonGroup>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={ { maxWidth: 260 } }
						>
							{ isCustom
								? __(
										'Define a fully custom JSON shape using the schema builder.',
										'rest-api-firewall'
								  )
								: __(
										'Toggle visibility of each standard WordPress REST property.',
										'rest-api-firewall'
								  ) }
						</Typography>
					</Stack>
				</Stack>

				{ ! objectType && (
					<Alert severity="info">
						{ __(
							'Select an object type above to configure the model properties.',
							'rest-api-firewall'
						) }
					</Alert>
				) }

				{ objectType && (
					<>
						<Divider />

						{ /* Property editor */ }
						{ isCustom ? (
							<Stack spacing={ 1 }>
								<Typography
									variant="subtitle2"
									fontWeight={ 600 }
								>
									{ __(
										'Custom Schema',
										'rest-api-firewall'
									) }
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									{ __(
										'Define the exact JSON shape your REST endpoint will return for this object type.',
										'rest-api-firewall'
									) }
								</Typography>
								<Box
									sx={ {
										border: 1,
										borderColor: 'divider',
										borderRadius: 1,
										p: 1.5,
									} }
								>
									<JsonSchemaBuilder
										value={ properties }
										onChange={ setProperties }
										availableBindings={ availableBindings }
									/>
								</Box>
							</Stack>
						) : (
							<Stack spacing={ 1 }>
								<Typography
									variant="subtitle2"
									fontWeight={ 600 }
								>
									{ __(
										'Property Visibility',
										'rest-api-firewall'
									) }
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									{ __(
										'Toggle each property on or off for the REST response.',
										'rest-api-firewall'
									) }
								</Typography>

								{ schemaProps ? (
									<Stack spacing={ 0 }>
										{ Object.entries( schemaProps ).map(
											( [ propName, propConfig ] ) => (
												<PropertyRow
													key={ propName }
													propName={ propName }
													propConfig={ {
														...propConfig,
														settings:
															properties[ propName ]?.settings ||
															propConfig.settings ||
															{},
														properties: propConfig.properties
															? Object.fromEntries(
																Object.entries( propConfig.properties ).map(
																	( [ subName, subConfig ] ) => [
																		subName,
																		typeof subConfig === 'object' &&
																		subConfig !== null
																			? {
																				...subConfig,
																				settings:
																					properties[ propName ]?.properties?.[ subName ]?.settings ||
																					subConfig.settings ||
																					{},
																			  }
																			: subConfig,
																	]
																)
															)
															: propConfig.properties,
													} }
													selectedObjectType={
														objectType
													}
													setField={ ( e ) => {
														const path = e.target.name;
														const parts = path.split( '.' );
														const propsIdx = parts.indexOf( 'props' );
														const propKey =
															parts[ propsIdx + 1 ] || propName;
														// Sub-property path: ...props.title.properties.raw.settings.disable
														const subPropsIdx = parts.indexOf(
															'properties',
															propsIdx + 2
														);
														const isSubProp = subPropsIdx > -1;
														const subPropKey = isSubProp
															? parts[ subPropsIdx + 1 ]
															: null;
														const setting = parts[ parts.length - 2 ];
														const key = parts[ parts.length - 1 ];
														setProperties( ( prev ) => {
															const next = { ...prev };
															if ( ! next[ propKey ] ) {
																next[ propKey ] = {
																	settings: { disable: false, filters: [] },
																};
															}
															if ( isSubProp ) {
																if ( ! next[ propKey ].properties ) {
																	next[ propKey ] = {
																		...next[ propKey ],
																		properties: {},
																	};
																}
																if ( ! next[ propKey ].properties[ subPropKey ] ) {
																	next[ propKey ].properties[ subPropKey ] = {
																		settings: { disable: false, filters: [] },
																	};
																}
																if ( setting === 'settings' ) {
																	next[ propKey ].properties[ subPropKey ].settings = {
																		...next[ propKey ].properties[ subPropKey ].settings,
																		[ key ]: e.target.value,
																	};
																} else if ( setting === 'filters' ) {
																	const subCfg =
																		schemaProps?.[ propKey ]?.properties?.[ subPropKey ];
																	const currentFilters =
																		next[ propKey ].properties[
																			subPropKey
																		].settings?.filters ||
																		subCfg?.filters ||
																		[];
																	next[ propKey ].properties[ subPropKey ].settings = {
																		...next[ propKey ].properties[ subPropKey ].settings,
																		filters: currentFilters.map(
																			( f ) =>
																				f.key === key
																					? { ...f, value: e.target.value }
																					: f
																			),
																		};
																}
															} else {
																if ( setting === 'settings' ) {
																	next[ propKey ].settings = {
																		...next[ propKey ].settings,
																		[ key ]: e.target.value,
																	};
																} else if ( setting === 'filters' ) {
																	const currentFilters =
																		next[ propKey ].settings?.filters ||
																		propConfig.filters ||
																		[];
																	next[ propKey ].settings = {
																		...next[ propKey ].settings,
																		filters: currentFilters.map(
																			( f ) =>
																				f.key === key
																					? { ...f, value: e.target.value }
																					: f
																			),
																		};
																}
															}
															return next;
														} );
													} }
													hasValidLicense={ true }
													__={ __ }
													basePath={ `postProperties.${ objectType }.props.${ propName }` }
												/>
											)
										) }
									</Stack>
								) : (
									<Alert severity="warning">
										{ __(
											'No WP REST schema found for this object type. Try switching to Custom mode.',
											'rest-api-firewall'
										) }
									</Alert>
								) }
							</Stack>
						) }
					</>
				) }
			</Stack>
		</Stack>
	);
}

import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { useNavigation } from '../../contexts/NavigationContext';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';

import formatDate from '../../utils/formatDate';
import { PropertyRow } from './Properties';
import JsonSchemaBuilder from '../shared/JsonSchemaBuilder';
import useRegisterToolbar from '../../hooks/useRegisterToolbar';
import LoadingMessage from '../LoadingMessage';
import DataPanel from '../shared/DataPanel';
import FormControl from '@mui/material/FormControl';

function mergeFilterSettings( schemaSettings, storedSettings ) {
	if ( ! storedSettings ) return schemaSettings || {};
	const schemaFilters = schemaSettings?.filters || [];
	const storedFilters = Array.isArray( storedSettings.filters ) ? storedSettings.filters : [];
	return {
		...storedSettings,
		filters: schemaFilters.map( ( sf ) => {
			const s = storedFilters.find( ( f ) => f.key === sf.key );
			return s !== undefined ? { ...sf, value: s.value } : sf;
		} ),
	};
}

function mergePropertiesRecursively( schemaPropMap, storedPropMap ) {
	if ( ! schemaPropMap ) return schemaPropMap;
	return Object.fromEntries(
		Object.entries( schemaPropMap ).map( ( [ name, cfg ] ) => [
			name,
			typeof cfg === 'object' && cfg !== null
				? {
					...cfg,
					settings: mergeFilterSettings( cfg.settings, storedPropMap?.[ name ]?.settings ),
					properties: mergePropertiesRecursively( cfg.properties, storedPropMap?.[ name ]?.properties ),
				}
				: cfg,
		] )
	);
}

function applySettingToNode( node, setting, key, value, schemaFilters ) {
	if ( setting === 'settings' ) {
		return { ...node, settings: { ...( node.settings || {} ), [ key ]: value } };
	}
	if ( setting === 'filters' ) {
		const currentFilters = node.settings?.filters || schemaFilters || [];
		return {
			...node,
			settings: {
				...( node.settings || {} ),
				filters: currentFilters.map( ( f ) => ( f.key === key ? { ...f, value } : f ) ),
			},
		};
	}
	return node;
}

function deepSetSubPropSetting( node, subPath, setting, key, value, schemaCfg ) {
	const [ head, ...rest ] = subPath;
	const subSchema = schemaCfg?.properties?.[ head ];
	const currentChild = node.properties?.[ head ] || {
		settings: {
			disable: false,
			filters: ( subSchema?.settings?.filters || [] ).map( ( f ) => ( { ...f } ) ),
		},
	};
	return {
		...node,
		properties: {
			...( node.properties || {} ),
			[ head ]:
				rest.length === 0
					? applySettingToNode( currentChild, setting, key, value, subSchema?.settings?.filters )
					: deepSetSubPropSetting( currentChild, rest, setting, key, value, subSchema ),
		},
	};
}

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

export default function ModelEditor( { model, globalForm = null, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId, setDirtyFlag } = useApplication();
	const { navigate: navigateTo } = useNavigation();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();
	const { openDialog } = useDialog();

	const isNew = ! model.id;

	const [ title, setTitle ] = useState( model.title || '' );
	const [ description, setDescription ] = useState( model.description || '' );
	const [ objectType, setObjectType ] = useState( model.object_type || 'post' );
	const [ isCustom, setIsCustom ] = useState( model.is_custom || false );
	const [ enabled, setEnabled ] = useState( model.enabled || false );

	const [ author, setAuthor ] = useState( '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ wpProperties, setWpProperties ] = useState(
		! model.is_custom ? model.properties || {} : {}
	);
	const [ customProperties, setCustomProperties ] = useState(
		model.is_custom ? model.properties || {} : {}
	);

	const [ loaded, setLoaded ] = useState( isNew );

	const [ testMode, setTestMode ] = useState( false );
	const [ testStatus, setTestStatus ] = useState( 'idle' ); // 'idle' | 'running' | 'done' | 'error'
	const [ testResult, setTestResult ] = useState( null );
	const testAbortRef = useRef( null );

	const properties = isCustom ? customProperties : wpProperties;
	const setProperties = isCustom ? setCustomProperties : setWpProperties;

	const handleSaveRef = useRef( null );
	const handleDeleteRef = useRef( null );
	const [ savedSnapshot, setSavedSnapshot ] = useState( null );

	const isDirty = useMemo( () => {
		if ( isNew ) {
			return !! title.trim();
		}
		if ( ! savedSnapshot ) {
			return false;
		}
		const s = savedSnapshot;
		return (
			title !== s.title ||
			description !== s.description ||
			objectType !== s.objectType ||
			isCustom !== s.isCustom ||
			enabled !== s.enabled ||
			JSON.stringify( properties ) !== s.propertiesJson
		);
	}, [ isNew, title, description, objectType, isCustom, enabled, properties, savedSnapshot ] );

	useEffect( () => {
		setDirtyFlag(
			isDirty
				? { has: true, message: __( 'You are editing a model. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: { has: false, message: '' }
		);
	}, [ isDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

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
					const loadedTitle       = e.title || '';
					const loadedDescription = e.description || '';
					const loadedObjectType  = e.object_type || '';
					const loadedIsCustom    = e.is_custom || false;
					const loadedEnabled     = e.enabled ?? true;
					const loadedProperties  = e.properties || {};
					setTitle( loadedTitle );
					setDescription( loadedDescription );
					setEnabled( loadedEnabled );
					setAuthor( e.author_name || '' );
					setDateCreated(
						formatDate(
							e.date_created,
							adminData.date_format,
							adminData.time_format
						)
					);
					setDateModified(
						formatDate(
							e.date_modified,
							adminData.date_format,
							adminData.time_format
						)
					);
					setObjectType( loadedObjectType );
					setIsCustom( loadedIsCustom );
					if ( loadedIsCustom ) {
						setCustomProperties( loadedProperties );
					} else {
						setWpProperties( loadedProperties );
					}
					setSavedSnapshot( {
						title:          loadedTitle,
						description:    loadedDescription,
						objectType:     loadedObjectType,
						isCustom:       loadedIsCustom,
						enabled:        loadedEnabled,
						propertiesJson: JSON.stringify( loadedProperties ),
					} );
				}
			} finally {
				setLoaded( true );
			}
		} )();
	}, [ isNew, model.id, adminData, nonce ] );

	const buildPayload = () => ( {
		nonce,
		title: title.trim(),
		description,
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
			const snapshotAtSave = {
				title:          title.trim(),
				description,
				objectType,
				isCustom,
				enabled,
				propertiesJson: JSON.stringify( properties ),
			};
			save(
				{
					action: 'update_model_entry',
					id: model.id,
					...buildPayload(),
				},
				{ onSuccess: () => { setSavedSnapshot( snapshotAtSave ); } }
			);
		}
	}, [
		isNew,
		model.id,
		title,
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
				) } "${ title }"? ${ __(
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
	}, [ remove, model.id, title, nonce, onBack, clearDirty, __ ] );

	const runTest = useCallback( async () => {
		if ( isNew || ! model.id ) {
			return;
		}
		setTestStatus( 'running' );
		setTestResult( null );
		const controller = new AbortController();
		testAbortRef.current = controller;
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				signal: controller.signal,
				body: new URLSearchParams( {
					action: 'test_model_entry',
					nonce,
					id: model.id,
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setTestResult( json.data );
				setTestStatus( 'done' );
			} else {
				setTestResult( { error: json.data?.message || __( 'Test failed.', 'rest-api-firewall' ) } );
				setTestStatus( 'error' );
			}
		} catch ( err ) {
			if ( err.name !== 'AbortError' ) {
				setTestResult( { error: __( 'Network error.', 'rest-api-firewall' ) } );
				setTestStatus( 'error' );
			}
		}
	}, [ isNew, model.id, adminData, nonce, __ ] );

	const handleModeChange = ( _, newMode ) => {
		if ( newMode === null ) {
			return;
		}
		setTestMode( false );
		if ( ! isNew && enabled ) {
			openDialog( {
				type: DIALOG_TYPES.CONFIRM,
				title: __( 'Change Schema Mode', 'rest-api-firewall' ),
				content: __(
					'This model is currently active. Changing the schema mode may affect the REST API output. Are you sure?',
					'rest-api-firewall'
				),
				confirmLabel: __( 'Change Mode', 'rest-api-firewall' ),
				onConfirm: () => setIsCustom( newMode === 'custom' ),
			} );
		} else {
			setIsCustom( newMode === 'custom' );
		}
	};
	handleSaveRef.current = handleSave;
	handleDeleteRef.current = handleDelete;

	const updateToolbar = useRegisterToolbar( {
		isNew,
		breadcrumb: __( 'Properties', 'rest-api-firewall' ),
		newEntryLabel: __( 'New Model', 'rest-api-firewall' ),
		docPage: 'models',
		handleBack,
		handleSave: () => handleSaveRef.current?.(),
		handleDelete: () => handleDeleteRef.current?.(),
		setEnabled,
	} );

	useEffect( () => {
		updateToolbar( {
			title,
			author,
			dateCreated,
			dateModified,
			saving,
			enabled,
			canSave: isDirty,
			dirtyFlag: isDirty
				? { has: true, message: __( 'You are editing a model. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: null,
		} );
	}, [ title, author, dateCreated, dateModified, saving, enabled, isDirty, objectType, isCustom ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const [ schemaPropsRaw, setSchemaPropsRaw ] = useState( null );

	useEffect( () => {
		if ( ! objectType ) {
			setSchemaPropsRaw( null );
			return;
		}
		let cancelled = false;
		( async () => {
			try {
				const res = await fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'rest_api_firewall_model_properties',
						nonce:  adminData.nonce,
						object_type: objectType,
					} ),
				} );
				const json = await res.json();
				if ( ! cancelled ) {
					setSchemaPropsRaw( json.success ? ( json.data?.props || null ) : null );
				}
			} catch {
				if ( ! cancelled ) {
					setSchemaPropsRaw( null );
				}
			}
		} )();
		return () => { cancelled = true; };
	}, [ objectType ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const schemaProps = useMemo( () => {
		if ( objectType !== 'settings_route' || ! schemaPropsRaw ) return schemaPropsRaw;
		const result = {};
		for ( const [ key, cfg ] of Object.entries( schemaPropsRaw ) ) {
			if ( key === 'menus' && ! properties._embed_menus ) continue;
			if ( key === 'acf_options' && ! properties._acf_options_page ) continue;
			result[ key ] = cfg;
		}
		return result;
	}, [ schemaPropsRaw, objectType, properties._embed_menus, properties._acf_options_page ] );

	if ( ! loaded ) {
		return (
			<LoadingMessage message={ __( 'Loading model…', 'rest-api-firewall' ) } />
		);
	}

	const availableBindings = schemaProps
		? Object.entries( schemaProps ).flatMap( ( [ key, cfg ] ) => {
				const type = Array.isArray( cfg.type ) ? cfg.type[ 0 ] : cfg.type;
				const topFilters = ( cfg.settings?.filters || [] ).filter(
					( f ) => f.key !== 'rendered'
				);
				const bindings = [
					{ key, label: cfg.description || key, type, filters: topFilters },
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
								const subFilters = (
									subCfg.settings?.filters || []
								).filter( ( f ) => f.key !== 'rendered' );
								bindings.push( {
									key: `${ key }.${ subKey }`,
									label:
										subCfg.description ||
										`${ key }.${ subKey }`,
									type: Array.isArray( subCfg.type )
										? subCfg.type[ 0 ]
										: subCfg.type,
									filters: subFilters,
								} );
							}
						}
					);
				}
				return bindings;
		  } )
		: FALLBACK_BINDINGS;

	return (
		<Stack spacing={ 3 } flexGrow={ 1 }>
			{ objectType && (
				<Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" maxWidth={ 800 }>
					<Stack direction="row" gap={2} alignItems="center">
						<Typography variant="subtitle1" fontWeight="600">
							{ __('Object Type', 'rest-api-firewall') }
						</Typography>
						<Chip
							size="large"
							label={ objectType }
							variant="outlined"
							color="primary"
							sx={ { fontFamily: 'monospace' } }
						/>
						<Tooltip disableInteractive title={ __( 'View routes', 'rest-api-firewall' ) }>
							<IconButton size="small" onClick={ () => {
								const pt = ( adminData?.post_types || [] ).find( ( p ) => p.value === objectType );
								const restPath = pt ? `/wp/v2/${ pt.rest_base || pt.value }` : null;
								navigateTo( 'per-route-settings', restPath ? `routes|${ restPath }` : 'routes' );
							} } sx={ { opacity: 0.5 } }>
								<AccountTreeOutlinedIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Tooltip disableInteractive title={ __( 'View collection', 'rest-api-firewall' ) }>
							<IconButton size="small" onClick={ () => navigateTo( 'collections', objectType ) } sx={ { opacity: 0.5 } }>
								<ListAltOutlinedIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Stack>
					{ ! isNew && (
						testMode ? (
							<Button
								variant="outlined"
								size="small"
								onClick={ () => {
									if ( testAbortRef.current ) {
										testAbortRef.current.abort();
									}
									setTestMode( false );
									setTestStatus( 'idle' );
									setTestResult( null );
								} }
							>
								<Typography variant="caption">
									{ __( 'Close Test', 'rest-api-firewall' ) }
								</Typography>
							</Button>
						) : (
							<Button
								variant="contained"
								size="small"
								disableElevation
								disabled={ testStatus === 'running' }
								onClick={ () => {
									setTestMode( true );
									setTestStatus( 'idle' );
									setTestResult( null );
									runTest();
								} }
							>
								<Typography variant="caption">
									{ testStatus === 'running'
										? __( 'Testing…', 'rest-api-firewall' )
										: __( 'Test', 'rest-api-firewall' ) }
								</Typography>
							</Button>
						)
					) }
				</Stack>
			) }
			{ ! testMode && (
				<Stack spacing={3} maxWidth={600}>
				<TextField
					label={ __( 'Model Name', 'rest-api-firewall' ) }
					value={ title }
					onChange={ ( e ) => setTitle( e.target.value ) }
					size="small"
					fullWidth
					required
					inputProps={ { maxLength: 100 } }
					helperText={ __( 'Internal name for this model.', 'rest-api-firewall' ) }
				/>
				<TextField
					label={ __( 'Description', 'rest-api-firewall' ) }
					value={ description }
					onChange={ ( e ) => setDescription( e.target.value ) }
					size="small"
					multiline
					rows={ 3 }
					inputProps={ { maxLength: 300 } }
					helperText={ __( 'Internal note for this model.', 'rest-api-firewall' ) }

				/>

				{ objectType === 'settings_route' && (
					<Stack spacing={ 3 }>

						<FormControl disabled={ testMode }>
							<FormControlLabel
								label={ __( 'Embed Flattened Menus', 'rest-api-firewall' ) }
								control={
									<Switch
										checked={ !! properties._embed_menus }
										onChange={ ( e ) => setProperties( ( p ) => ( { ...p, _embed_menus: e.target.checked } ) ) }
										size="small"
									/>
								}
							/>
						</FormControl>

						<FormControl disabled={ ! adminData?.acf_active || testMode }>
							<FormControlLabel
								label={ __( 'Add ACF Options Pages', 'rest-api-firewall' ) }
								control={
									<Switch
										checked={ !! properties._acf_options_page }
										onChange={ ( e ) => setProperties( ( p ) => ( { ...p, _acf_options_page: e.target.checked } ) ) }
										size="small"
									/>
								}
							/>
						</FormControl>
					</Stack>
				) }
			</Stack>
			) }

			{ objectType && (
				<Stack spacing={ 3 } maxWidth={ 800 }>
					{ ! testMode && (
						<Stack direction="row" alignItems="center" gap={ 1 } flexWrap="wrap">
							<ToggleButtonGroup
								value={ isCustom ? 'custom' : 'wp' }
								exclusive
								onChange={ handleModeChange }
								size="small"
							>
								<ToggleButton value="wp">
									<Typography variant="caption">
										{ __( 'WordPress Schema', 'rest-api-firewall' ) }
									</Typography>
								</ToggleButton>
								<ToggleButton value="custom">
									<Typography variant="caption">
										{ __( 'Custom Schema', 'rest-api-firewall' ) }
									</Typography>
								</ToggleButton>
							</ToggleButtonGroup>
						</Stack>
					) }
					{ testMode ? (
						<Stack spacing={ 2 }>
							{ testStatus === 'running' && (
								<Stack direction="row" alignItems="center" gap={ 1 }>
									<CircularProgress size={ 16 } />
									<Typography variant="body2" color="text.secondary">{ __( 'Fetching live data and applying model…', 'rest-api-firewall' ) }</Typography>
								</Stack>
							) }
							{ testStatus === 'error' && testResult?.error && (
								<Alert severity="warning">{ testResult.error }</Alert>
							) }
							{ testStatus === 'done' && testResult && (
								<Stack direction={ { xs: 'column', md: 'row' } } spacing={ 2 } alignItems="flex-start">
									<DataPanel
										label={ __( 'Raw', 'rest-api-firewall' ) }
										data={ testResult.raw }
										labelColor="text.secondary"
										bgcolor="grey.50"
									/>
									<DataPanel
										label={ __( 'Transformed', 'rest-api-firewall' ) }
										data={ testResult.transformed }
										labelColor="primary.main"
										bgcolor={ ( theme ) =>
											theme.palette.mode === 'dark'
												? 'rgba(99, 132, 255, 0.08)'
												: 'rgba(25, 118, 210, 0.04)'
										}
									/>
								</Stack>
							) }
						</Stack>
						) : isCustom ? (
							<Stack spacing={ 1 }>
								<Typography variant="subtitle2" fontWeight={ 600 }>
									{ __( 'Custom Schema', 'rest-api-firewall' ) }
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{ __( 'Define the exact JSON shape your REST endpoint will return for this object type.', 'rest-api-firewall' ) }
								</Typography>
								<JsonSchemaBuilder
									value={ properties }
									onChange={ setProperties }
									availableBindings={ availableBindings }
								/>
							</Stack>
						) : (
						<Stack>
							{ schemaProps ? (
								<Stack spacing={ 0 }>
									{ Object.entries( schemaProps ).map(
										( [ propName, propConfig ] ) => (
											<PropertyRow
											key={ propName }
											propName={ propName }
											isInherit={ ! properties[ propName ] || ! Array.isArray( properties[ propName ]?.settings?.filters ) }
											onToggleInherit={ () => {
												const current = properties[ propName ];
												const hasLocalFilters = Array.isArray( current?.settings?.filters );
												if ( hasLocalFilters ) {
													if ( current?.settings?.disable === true ) {
														setProperties( ( prev ) => ( {
															...prev,
															[ propName ]: { settings: { disable: true } },
														} ) );
													} else {
														setProperties( ( prev ) => {
															const next = { ...prev };
															delete next[ propName ];
															return next;
														} );
													}
												} else {
													setProperties( ( prev ) => ( {
														...prev,
														[ propName ]: {
															...( prev[ propName ] || {} ),
															settings: {
																disable: prev[ propName ]?.settings?.disable ?? propConfig.settings?.disable ?? false,
																filters: ( propConfig.settings?.filters || [] ).map( ( f ) => ( { ...f } ) ),
															},
														},
													} ) );
												}
											} }
											propConfig={ {
												...propConfig,
												settings: mergeFilterSettings( propConfig.settings, properties[ propName ]?.settings ),
												properties: mergePropertiesRecursively( propConfig.properties, properties[ propName ]?.properties ),
											} }
											selectedObjectType={ objectType }
											setField={ ( e ) => {
												const path = e.target.name;
												const parts = path.split( '.' );
												const propsIdx = parts.indexOf( 'props' );
												const propKey = parts[ propsIdx + 1 ] || propName;

												const subPath = [];
												let i = propsIdx + 2;
												while ( i < parts.length && parts[ i ] === 'properties' ) {
													subPath.push( parts[ i + 1 ] );
													i += 2;
												}
												// Handle settings.filters.{filterKey} → re-route to the 'filters' branch.
												let setting = parts[ i ];
												let key = parts[ i + 1 ];
												if ( setting === 'settings' && key === 'filters' && parts[ i + 2 ] !== undefined ) {
													setting = 'filters';
													key     = parts[ i + 2 ];
												}

												setProperties( ( prev ) => {
													const next = { ...prev };
													if ( ! next[ propKey ] ) {
														if ( setting === 'settings' && key === 'disable' ) {
															next[ propKey ] = { settings: { disable: false } };
														} else {
															next[ propKey ] = {
																settings: {
																	disable: false,
																	filters: ( propConfig.settings?.filters || [] ).map( ( f ) => ( { ...f } ) ),
																},
															};
														}
													}
													if ( subPath.length === 0 ) {
														next[ propKey ] = applySettingToNode(
															next[ propKey ],
															setting,
															key,
															e.target.value,
															propConfig.settings?.filters
														);
													} else {
														next[ propKey ] = deepSetSubPropSetting(
															next[ propKey ],
															subPath,
															setting,
															key,
															e.target.value,
															schemaProps?.[ propKey ]
														);
													}
													return next;
												} );
											} }
											hasValidLicense={ true }
											globalForm={ globalForm }
											__={ __ }
											basePath={ `postProperties.${ objectType }.props.${ propName }` }
										/>
										)
									) }
								</Stack>
							) : (
								<Alert severity="warning">
									{ __( 'No WP REST schema found for this object type. Try switching to Custom mode.', 'rest-api-firewall' ) }
								</Alert>
							) }
						</Stack>
					) }
				</Stack>
			) }
		</Stack>
	);
}

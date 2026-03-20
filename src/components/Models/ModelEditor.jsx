import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import formatDate from '../../utils/formatDate';
import { PropertyRow } from './Properties';
import JsonSchemaBuilder from '../shared/JsonSchemaBuilder';
import useRegisterToolbar from '../../hooks/useRegisterToolbar';
import LoadingMessage from '../LoadingMessage';

function mergeFilterSettings( schemaSettings, storedSettings ) {
	if ( ! storedSettings ) return schemaSettings || {};
	const schemaFilters = schemaSettings?.filters || [];
	return {
		...storedSettings,
		filters: schemaFilters.map( ( sf ) => {
			const s = ( storedSettings.filters || [] ).find( ( f ) => f.key === sf.key );
			return s !== undefined ? { ...sf, value: s.value } : sf;
		} ),
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
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();
	const { openDialog } = useDialog();

	const isNew = ! model.id;

	const [ title, setTitle ] = useState( model.title || '' );
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

	const [ customRoute, setCustomRoute ] = useState(
		objectType === 'custom_route' ? ( model.properties?._route || '' ) : ''
	);
	const [ fetchedCustomRouteProps, setFetchedCustomRouteProps ] = useState( null );

	const [ testMode, setTestMode ] = useState( false );
	const [ testStatus, setTestStatus ] = useState( 'idle' ); // 'idle' | 'running' | 'done' | 'error'
	const [ testResult, setTestResult ] = useState( null );
	const testAbortRef = useRef( null );

	const properties = isCustom ? customProperties : wpProperties;
	const setProperties = isCustom ? setCustomProperties : setWpProperties;

	const handleSaveRef = useRef( null );
	const handleDeleteRef = useRef( null );

	useEffect( () => {
		setDirtyFlag( {
			has: true,
			message: __(
				'You are editing a model. Unsaved changes will be lost.',
				'rest-api-firewall'
			),
		} );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps — cleanup handled by useRegisterToolbar

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
					setTitle( e.title || '' );
					setEnabled( e.enabled ?? true );
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
					
					setObjectType( e.object_type || '' );
					setIsCustom( e.is_custom || false );
					if ( e.object_type === 'custom_route' ) {
						setCustomRoute( e.properties?._route || '' );
					}
					if ( e.is_custom ) {
						setCustomProperties( e.properties || {} );
					} else {
						const { _route: _r, ...restProps } = e.properties || {};
						setWpProperties( restProps );
					}
				}
			} finally {
				setLoaded( true );
			}
		} )();
	}, [ isNew, model.id, adminData, nonce ] );

	const buildPayload = () => ( {
		nonce,
		title: title.trim(),
		object_type: objectType,
		is_custom: isCustom ? '1' : '0',
		enabled: enabled ? '1' : '0',
		properties: JSON.stringify( objectType === 'custom_route' ? { _route: customRoute, ...properties } : properties ),
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
		title,
		objectType,
		isCustom,
		enabled,
		properties,
		customRoute,
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

	useEffect( () => {
		if ( objectType !== 'custom_route' || isCustom || ! customRoute ) {
			return;
		}
		const params = new URLSearchParams( {
			action: 'get_custom_route_schema',
			nonce,
			route: customRoute,
		} );
		fetch( adminData.ajaxurl, { method: 'POST', body: params } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				if ( res?.success && res.data?.props ) {
					setFetchedCustomRouteProps( res.data.props );
				}
			} )
			.catch( () => {} );
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ objectType, isCustom, customRoute ] );

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
			dirtyFlag: { has: true, message: __( 'You are editing a model. Unsaved changes will be lost.', 'rest-api-firewall' ) },
			titleSuffix: (
				<Stack direction="row" gap={ 0.75 } alignItems="center">
					{ objectType && (
						<Chip label={ objectType } size="small" variant="outlined" sx={ { fontFamily: 'monospace', fontSize: '0.7rem' } } />
					) }
					<Chip
						label={ isCustom ? __( 'Custom', 'rest-api-firewall' ) : __( 'WP Schema', 'rest-api-firewall' ) }
						size="small"
						color={ isCustom ? 'secondary' : 'primary' }
						variant="outlined"
						sx={ { fontSize: '0.7rem' } }
					/>
				</Stack>
			),
		} );
	}, [ title, author, dateCreated, dateModified, saving, enabled, objectType, isCustom ] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( ! loaded ) {
		return (
			<LoadingMessage message={ __( 'Loading model…', 'rest-api-firewall' ) } />
		);
	}

	const schemaProps = objectType === 'custom_route'
		? fetchedCustomRouteProps
		: ( adminData?.models_properties?.[ objectType ]?.props || null );

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
		<Stack spacing={ 0 } sx={ { height: '100%' } }>

			<Stack p={ 4 } spacing={ 3 } sx={ { overflowY: 'auto', flex: 1 } }>

				<Stack direction="row" spacing={ 4 } alignItems="flex-start" flexWrap="wrap">
					<TextField
						label={ __( 'Model Name', 'rest-api-firewall' ) }
						value={ title }
						onChange={ ( e ) => setTitle( e.target.value ) }
						size="small"
						fullWidth
						required
						helperText={ __( 'Internal name for this model', 'rest-api-firewall' ) }
						sx={ { maxWidth: 320 } }
					/>

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

						{ ! isNew && (
							<Button
								variant={ testMode ? 'contained' : 'outlined' }
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
						) }
					</Stack>
				</Stack>

				{ objectType === 'custom_route' && (
					<TextField
						label={ __( 'Route', 'rest-api-firewall' ) }
						value={ customRoute }
						onChange={ ( e ) => setCustomRoute( e.target.value ) }
						size="small"
						helperText={ __( 'Full REST API path, e.g. /my-plugin/v1/jobs', 'rest-api-firewall' ) }
						slotProps={ { input: { pattern: '(\/[a-z0-9_\/-]+)+' } } }
						sx={ { maxWidth: 360 } }
					/>
				) }

				{ objectType && (
					<>
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
										<Stack flex={ 1 } spacing={ 1 } sx={ { minWidth: 0 } }>
											<Typography variant="subtitle2" fontWeight={ 600 } color="text.secondary">{ __( 'Raw', 'rest-api-firewall' ) }</Typography>
											<Box
												component="pre"
												sx={ { p: 2, bgcolor: 'grey.50', borderRadius: 1, overflowX: 'auto', fontSize: '0.72rem', lineHeight: 1.5, m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }
											>
												{ JSON.stringify( testResult.raw, null, 2 ) }
											</Box>
										</Stack>
										<Stack flex={ 1 } spacing={ 1 } sx={ { minWidth: 0 } }>
											<Typography variant="subtitle2" fontWeight={ 600 } color="primary.main">{ __( 'Transformed', 'rest-api-firewall' ) }</Typography>
											<Box
												component="pre"
												sx={ { p: 2, bgcolor: 'primary.50', borderRadius: 1, overflowX: 'auto', fontSize: '0.72rem', lineHeight: 1.5, m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }
											>
												{ JSON.stringify( testResult.transformed, null, 2 ) }
											</Box>
										</Stack>
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
						properties: propConfig.properties
							? Object.fromEntries(
								Object.entries( propConfig.properties ).map(
									( [ subName, subConfig ] ) => [
										subName,
										typeof subConfig === 'object' &&
										subConfig !== null
											? {
												...subConfig,
												settings: mergeFilterSettings( subConfig.settings, properties[ propName ]?.properties?.[ subName ]?.settings ),
												}
											: subConfig,
									]
								)
								)
							: propConfig.properties,
					} }
					selectedObjectType={ objectType }
					setField={ ( e ) => {
						const path = e.target.name;
						const parts = path.split( '.' );
						const propsIdx = parts.indexOf( 'props' );
						const propKey = parts[ propsIdx + 1 ] || propName;
						const subPropsIdx = parts.indexOf( 'properties', propsIdx + 2 );
						const isSubProp = subPropsIdx > -1;
						const subPropKey = isSubProp ? parts[ subPropsIdx + 1 ] : null;
						const setting = parts[ parts.length - 2 ];
						const key = parts[ parts.length - 1 ];
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
							if ( isSubProp ) {
								if ( ! next[ propKey ].properties ) {
									next[ propKey ] = { ...next[ propKey ], properties: {} };
								}
								if ( ! next[ propKey ].properties[ subPropKey ] ) {
									const subCfgInit = schemaProps?.[ propKey ]?.properties?.[ subPropKey ];
									next[ propKey ].properties[ subPropKey ] = {
										settings: {
											disable: false,
											filters: ( subCfgInit?.settings?.filters || [] ).map( ( f ) => ( { ...f } ) ),
										},
									};
								}
								if ( setting === 'settings' ) {
									next[ propKey ].properties[ subPropKey ].settings = {
										...next[ propKey ].properties[ subPropKey ].settings,
										[ key ]: e.target.value,
									};
								} else if ( setting === 'filters' ) {
									const subCfg = schemaProps?.[ propKey ]?.properties?.[ subPropKey ];
									const currentFilters =
										next[ propKey ].properties[ subPropKey ].settings?.filters ||
										subCfg?.settings?.filters ||
										[];
									next[ propKey ].properties[ subPropKey ].settings = {
										...next[ propKey ].properties[ subPropKey ].settings,
										filters: currentFilters.map( ( f ) => f.key === key ? { ...f, value: e.target.value } : f ),
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
										propConfig.settings?.filters ||
										[];
									next[ propKey ].settings = {
										...next[ propKey ].settings,
										filters: currentFilters.map( ( f ) => f.key === key ? { ...f, value: e.target.value } : f ),
									};
								}
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
					</>
				) }
			</Stack>
		</Stack>
	);
}

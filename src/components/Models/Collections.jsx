import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useSaveOptions from '../../hooks/useSaveOptions';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import ObjectTypeSelect from '../ObjectTypeSelect';

const DEFAULT_ROWS_PER_PAGE = 50;
const ROWS_PER_PAGE_OPTIONS = [ 25, 50, 100 ];

function mergeOrderPreview( savedOrder, page, perPage, newIds ) {
	const offset = page * perPage;
	const before = savedOrder.slice( 0, offset );
	const after = savedOrder.slice( offset + perPage );
	const otherIds = [ ...before, ...after ];
	const deduped = newIds.filter( ( id ) => ! otherIds.includes( id ) );

	return [ ...before, ...deduped, ...after ];
}

function decodeHtmlEntities( str ) {
	if ( ! str || typeof str !== 'string' ) {
		return str;
	}
	const txt = document.createElement( 'textarea' );
	txt.innerHTML = str;
	return txt.value;
}

function PostOrderList( { items, orderedIds, objectKind, loading, onReorder, originalOrder } ) {
	const { __ } = wp.i18n || {};
	const [ dragIdx, setDragIdx ] = useState( null );
	const [ dragOverIdx, setDragOverIdx ] = useState( null );

	const handleDragStart = ( e, idx ) => {
		setDragIdx( idx );
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = ( e, idx ) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if ( idx !== dragOverIdx ) {
			setDragOverIdx( idx );
		}
	};

	const handleDrop = ( e, idx ) => {
		e.preventDefault();
		if ( dragIdx === null || dragIdx === idx ) {
			setDragIdx( null );
			setDragOverIdx( null );
			return;
		}

		const next = [ ...items ];
		const [ moved ] = next.splice( dragIdx, 1 );
		next.splice( idx, 0, moved );
		onReorder( next );
		setDragIdx( null );
		setDragOverIdx( null );
	};

	const handleDragEnd = () => {
		setDragIdx( null );
		setDragOverIdx( null );
	};

	if ( loading ) {
		return (
			<Stack alignItems="center" py={ 4 }>
				<CircularProgress size={ 22 } />
			</Stack>
		);
	}

	if ( ! items.length ) {
		return (
			<Box sx={ { p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 } }>
				<Typography variant="body2" color="text.secondary">
					{ 'taxonomy' === objectKind
						? __( 'No taxonomy terms found for this taxonomy.', 'rest-api-firewall' )
						: __( 'No posts found for this post type.', 'rest-api-firewall' ) }
				</Typography>
			</Box>
		);
	}

	return (
		<Stack
			spacing={ 0 }
			sx={ { border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' } }
		>
			{ items.map( ( item, idx ) => {
				const savedPos = orderedIds.indexOf( item.id );
				const isOrdered = savedPos !== -1;
				const origIdx = ( originalOrder || [] ).findIndex( ( o ) => o.id === item.id );
				const hasMoved = origIdx !== -1 && origIdx !== idx;
				const isDragging = dragIdx === idx;
				const isOver = dragOverIdx === idx && dragIdx !== idx;
				const secondaryMeta = 'taxonomy' === objectKind
					? [
						item.slug ? `${ __( 'Slug', 'rest-api-firewall' ) }: ${ item.slug }` : '',
						Number.isInteger( item.count ) ? `${ item.count } ${ __( 'items', 'rest-api-firewall' ) }` : '',
					]
					: [
						item.author_name,
						item.date_created,
						item.date_modified ? `${ __( 'Updated', 'rest-api-firewall' ) }: ${ item.date_modified }` : '',
					];

				return (
					<Box
						key={ item.id }
						draggable
						onDragStart={ ( e ) => handleDragStart( e, idx ) }
						onDragOver={ ( e ) => handleDragOver( e, idx ) }
						onDrop={ ( e ) => handleDrop( e, idx ) }
						onDragEnd={ handleDragEnd }
						sx={ {
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
							px: 2,
							py: 0.875,
							bgcolor: isDragging ? 'action.selected' : 'background.paper',
							borderBottom: idx < items.length - 1 ? '1px solid' : 'none',
							borderColor: 'divider',
							borderTop: isOver ? '2px solid' : undefined,
							borderTopColor: isOver ? 'primary.main' : undefined,
							cursor: 'grab',
							opacity: isDragging ? 0.45 : 1,
							transition: 'background-color 0.1s',
							'&:hover': { bgcolor: isDragging ? 'action.selected' : 'action.hover' },
						} }
					>
						<DragIndicatorIcon sx={ { fontSize: 16, color: 'text.disabled', flexShrink: 0 } } />
                        <Box sx={ { display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 } }>
                            { isOrdered ? (
                                <Chip label={ `${ savedPos + 1 }` } size="small" color="primary" />
                            ) : (
                                <Chip label={ `${ idx + 1 }` } size="small" />
                            ) }
                            { hasMoved && (
                                <Typography variant="caption" color="text.secondary" sx={ { flexShrink: 0, lineHeight: 'normal' } }>
                                    { __( 'was', 'rest-api-firewall' ) }<br/>{ origIdx + 1 }
                                </Typography>
                            ) }
                        </Box>
						<Stack spacing={ 0.375 } sx={ { flex: 1, minWidth: 0 } }>
							<Typography
								variant="body2"
								sx={ { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 } }
							>
							{ decodeHtmlEntities( item.label ) || `#${ item.id }` }
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={ { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }
							>
								{ secondaryMeta.filter( Boolean ).join( ' • ' ) || `#${ item.id }` }
							</Typography>
						</Stack>

						<Stack direction="row" spacing={ 0.5 } alignItems="center" flexShrink={ 0 }>
							{ 'post_type' === objectKind && item.status && item.status !== 'publish' && (
								<Chip
									label={ item.status }
									size="small"
									sx={ { fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.75 } } }
								/>
							) }
							{ 'taxonomy' === objectKind && Number.isInteger( item.count ) && (
								<Chip
									label={ `${ item.count }` }
									size="small"
									sx={ { fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.75 } } }
								/>
							) }
							
						</Stack>
					</Box>
				);
			} ) }
		</Stack>
	);
}

export default function Collections( { form: formProp, setField: setFieldProp, syncSavedField, postTypes } ) {
	const { __, sprintf } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const { selectedApplicationId } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const objectTypes = adminData?.post_types || postTypes || [];
	const publicObjectTypes = objectTypes.filter( ( obj ) => obj.public );
	const isPro = hasValidLicense && !! selectedApplicationId;

	const form = formProp;
	const setField = setFieldProp;
	const { saving: savingOptions } = useSaveOptions();
	const { save: saveProAction, saving: savingProOrder } = useProActions();

	const [ selectedType, setSelectedType ] = useState( 'post' );
	const [ items, setItems ] = useState( [] );
	const [ localOrder, setLocalOrder ] = useState( [] );
	const [ orderedItems, setOrderedItems ] = useState( [] );
	const [ totalCount, setTotalCount ] = useState( 0 );
	const [ page, setPage ] = useState( 0 );
	const [ rowsPerPage, setRowsPerPage ] = useState( DEFAULT_ROWS_PER_PAGE );
	const [ loading, setLoading ] = useState( false );
	const [ resetting, setResetting ] = useState( false );
	const [ fetchError, setFetchError ] = useState( '' );
	const [ hasDragged, setHasDragged ] = useState( false );
	const [ originalOrder, setOriginalOrder ] = useState( [] );
	const [ proSettingsDirty, setProSettingsDirty ] = useState( false );

	const selectedObject = objectTypes.find( ( item ) => item.value === selectedType );
	const objectKind = selectedObject?.type || 'post_type';
	const objectLabel = selectedObject?.label || selectedType;
	const savedOrder = ( form.rest_collection_orders || {} )[ selectedType ] || [];
	const localIds = localOrder.map( ( item ) => item.id );
	const isDirty = hasDragged;
	const previewOrderIds = isDirty
		? mergeOrderPreview( savedOrder, page, rowsPerPage, localIds )
		: savedOrder;

	const formOrdersRef = useRef( form.rest_collection_orders );
	useEffect( () => {
		formOrdersRef.current = form.rest_collection_orders;
	}, [ form.rest_collection_orders ] );

	const loadOrders = useCallback( async () => {
		if ( ! isPro ) {
			return;
		}
		try {
			const [ ordersRes, perPageRes ] = await Promise.all( [
				fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( { action: 'get_application_collection_orders', nonce, application_id: selectedApplicationId } ),
				} ),
				fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( { action: 'get_application_collection_per_page_settings', nonce, application_id: selectedApplicationId } ),
				} ),
			] );

			const [ ordersJson, perPageJson ] = await Promise.all( [ ordersRes.json(), perPageRes.json() ] );

			if ( ordersJson.success ) {
				const perAppOrders = ordersJson.data.orders || {};
				syncSavedField( 'rest_collection_orders', { ...( formOrdersRef.current || {} ), ...perAppOrders } );
			}
			if ( perPageJson.success ) {
				syncSavedField( 'rest_collection_per_page_settings', perPageJson.data.settings || {} );
			}
		} catch {}
	}, [ isPro, selectedApplicationId, nonce, adminData.ajaxurl, syncSavedField ] );

	const buildOrderingParams = useCallback( ( action, ids = null, nextPage = page ) => {
		const params = {
			action,
			nonce,
			object_key: selectedType,
			object_kind: objectKind,
			page: nextPage,
			per_page: rowsPerPage,
		};

		if ( 'taxonomy' === objectKind ) {
			params.taxonomy = selectedType;
		} else {
			params.post_type = selectedType;
		}

		if ( ids ) {
			params.order = JSON.stringify( ids );
		}

		if ( isPro && selectedApplicationId ) {
			params.application_id = selectedApplicationId;
		}

		return params;
	}, [ nonce, objectKind, page, rowsPerPage, isPro, selectedApplicationId, selectedType ] );

	const loadItems = useCallback( async ( type, kind, pg, perPage ) => {
		if ( ! type ) {
			return;
		}

		setLoading( true );
		setFetchError( '' );

		try {
			const params = {
				action: 'get_collection_items',
				nonce,
				object_key: type,
				object_kind: kind,
				page: pg,
				per_page: perPage,
			};

			if ( 'taxonomy' === kind ) {
				params.taxonomy = type;
			} else {
				params.post_type = type;
			}

			if ( isPro && selectedApplicationId ) {
				params.application_id = selectedApplicationId;
			}

			const res = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
			const json = await res.json();
			if ( json.success ) {
				const fetchedItems = json.data.items || [];
				setItems( fetchedItems );
				setLocalOrder( fetchedItems );
				setOriginalOrder( fetchedItems );
				setOrderedItems( json.data.ordered_items || [] );
				setTotalCount( json.data.total || 0 );
			} else {
				setFetchError( json.data?.message || __( 'Failed to load items', 'rest-api-firewall' ) );
			}
		} catch {
			setFetchError( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	}, [ isPro, selectedApplicationId, nonce, adminData.ajaxurl, __ ] );

	useEffect( () => {
		loadOrders();
	}, [ loadOrders ] );

	useEffect( () => {
		if ( selectedType ) {
			loadItems( selectedType, objectKind, page, rowsPerPage );
		}
	}, [ selectedType, objectKind, page, rowsPerPage ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const handleTypeChange = ( e ) => {
		setSelectedType( e.target.value );
		setHasDragged( false );
		setOriginalOrder( [] );
		setProSettingsDirty( false );
		setPage( 0 );
	};

	const handlePageChange = ( _, newPage ) => {
		setHasDragged( false );
		setOriginalOrder( [] );
		setProSettingsDirty( false );
		setPage( newPage );
	};

	const handleRowsPerPageChange = ( e ) => {
		setRowsPerPage( parseInt( e.target.value, 10 ) || DEFAULT_ROWS_PER_PAGE );
		setHasDragged( false );
		setOriginalOrder( [] );
		setProSettingsDirty( false );
		setPage( 0 );
	};

	const handleReset = async () => {
		if ( ! selectedType ) {
			return;
		}

		setResetting( true );

		try {
			const params = buildOrderingParams(
				isPro ? 'reset_application_collection_order' : 'reset_collection_order',
				null,
				0
			);
			const res = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
			const json = await res.json();

			if ( json.success ) {
				setField( { target: {
					name: 'rest_collection_orders',
					value: { ...( formOrdersRef.current || {} ), [ selectedType ]: [] },
					type: 'object',
				} } );
				setOrderedItems( [] );
				setHasDragged( false );
				setPage( 0 );
				loadItems( selectedType, objectKind, 0, rowsPerPage );
			}
		} finally {
			setResetting( false );
		}
	};

	const handleReorder = useCallback( ( newItems ) => {
		setLocalOrder( newItems );
		setHasDragged( true );
		if ( ! isPro ) {
			const newIds = newItems.map( ( i ) => i.id );
			const currentSavedOrder = ( formOrdersRef.current || {} )[ selectedType ] || [];
			const merged = mergeOrderPreview( currentSavedOrder, page, rowsPerPage, newIds );
			setField( { target: {
				name: 'rest_collection_orders',
				value: { ...( formOrdersRef.current || {} ), [ selectedType ]: merged },
				type: 'object',
			} } );
		}
	}, [ selectedType, page, rowsPerPage, setField, isPro ] );

	const handleSavePro = useCallback( () => {
		const newIds = localOrder.map( ( i ) => i.id );
		const currentSavedOrder = ( formOrdersRef.current || {} )[ selectedType ] || [];
		const merged = mergeOrderPreview( currentSavedOrder, page, rowsPerPage, newIds );
		const currentPerPageSettings = ( form.rest_collection_per_page_settings || {} )[ selectedType ] || {};
		saveProAction(
			buildOrderingParams( 'save_application_collection_order', newIds ),
			{
				confirmTitle:   sprintf( __( 'Save %s Settings', 'rest-api-firewall' ), objectLabel ),
				confirmMessage: sprintf( __( 'Save order and per-page settings for %s?', 'rest-api-firewall' ), objectLabel ),
				successTitle:   __( 'Settings Saved', 'rest-api-firewall' ),
				successMessage: sprintf( __( '%s settings saved successfully.', 'rest-api-firewall' ), objectLabel ),
				onSuccess: ( data ) => {
					syncSavedField( 'rest_collection_orders', { ...( formOrdersRef.current || {} ), [ selectedType ]: data?.order || merged } );
					setHasDragged( false );
					setOriginalOrder( [ ...localOrder ] );
					const params = new URLSearchParams( {
						action: 'save_application_collection_per_page_setting',
						nonce,
						application_id: selectedApplicationId,
						object_key: selectedType,
						settings: JSON.stringify( currentPerPageSettings ),
					} );
					fetch( adminData.ajaxurl, { method: 'POST', body: params } )
						.then( () => setProSettingsDirty( false ) )
						.catch( () => {} );
				},
			}
		);
	}, [ saveProAction, localOrder, selectedType, page, rowsPerPage, buildOrderingParams, objectLabel, __, sprintf, syncSavedField, form.rest_collection_per_page_settings, nonce, selectedApplicationId, adminData.ajaxurl ] );

	const handlePerPageSettingChange = ( field, value ) => {
		const currentTypeSettings = ( form.rest_collection_per_page_settings || {} )[ selectedType ] || {};
		const newTypeSettings = { ...currentTypeSettings, [ field ]: value };
		const updated = {
			...( form.rest_collection_per_page_settings || {} ),
			[ selectedType ]: newTypeSettings,
		};

		if ( isPro ) {
			syncSavedField( 'rest_collection_per_page_settings', updated );
			setProSettingsDirty( true );
		} else {
			setField( {
				target: {
					name: 'rest_collection_per_page_settings',
					value: updated,
					type: 'object',
				},
			} );
		}
	};

	const handleEnforceOrderChange = ( checked ) => {
		handlePerPageSettingChange( 'enforce_order', checked );
	};


	return (
		<Stack gap={4} direction={{xs:'column', xl: 'row'}} p={ 4 }>
            
            <Stack spacing={ 3 } minWidth={600} flex={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={ 1 }>
                    <Typography variant="subtitle1" fontWeight={ 600 }>
                        { __( 'Set Collections Per Page And Order', 'rest-api-firewall' ) }
                    </Typography>
                    { isPro && (
                        <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            disabled={ ( ! hasDragged && ! proSettingsDirty ) || savingProOrder }
                            onClick={ handleSavePro }
                        >
                            { savingProOrder ? __( 'Saving…', 'rest-api-firewall' ) : __( 'Save Settings', 'rest-api-firewall' ) }
                        </Button>
                    ) }
                </Stack>
                <ObjectTypeSelect
                    types={ [ 'post_type', 'taxonomy' ] }
                    visibility={ [ 'public' ] }
                    isSingle
                    name="collection_object_type_select"
                    label={ __( 'Select Post Type Or Taxonomy', 'rest-api-firewall' ) }
                    value={ selectedType }
                    onChange={ handleTypeChange }
                    sx={ { maxWidth: 320} }
                />

                { selectedType && (
                    <Stack spacing={ 2 } pl={ 3 }>
                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={ !! ( form.rest_collection_per_page_settings?.[ selectedType ]?.enabled ) }
                                        onChange={ ( e ) => handlePerPageSettingChange( 'enabled', e.target.checked ) }
                                        size="small"
                                    />
                                }
                                label={ sprintf( __( 'Enforce %s Items Per Page', 'rest-api-firewall' ), objectLabel) }
                            />
                            <FormHelperText>
                                { sprintf( __( 'Override the per_page parameter on `%s` collection requests.', 'rest-api-firewall' ), objectLabel ) }
                            </FormHelperText>
                        </FormControl>

                        <TextField
                            label={ sprintf( __( '`%s` Items Per Page', 'rest-api-firewall' ), objectLabel ) }
                            type="number"
                            min="1"
                            max="100"
                            size="small"
                            disabled={ ! ( form.rest_collection_per_page_settings?.[ selectedType ]?.enabled ) }
                            value={ form.rest_collection_per_page_settings?.[ selectedType ]?.items_per_page || 25 }
                            onChange={ ( e ) => handlePerPageSettingChange( 'items_per_page', parseInt( e.target.value, 10 ) || 25 ) }
                            sx={ { maxWidth: 200 } }
                        />

                        <Stack spacing={ 2 }>
                            { fetchError && <Alert severity="error">{ fetchError }</Alert> }
                            <FormControl maxWidth={ 300 }>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={ !! ( form.rest_collection_per_page_settings?.[ selectedType ]?.enforce_order ) }
                                            onChange={ ( e ) => handleEnforceOrderChange( e.target.checked ) }
                                            size="small"
                                        />
                                    }
                                    label={ sprintf( __( 'Enforce %s Items Order', 'rest-api-firewall' ), objectLabel) }
                                />
                                <FormHelperText>
                                    { sprintf( __( 'Override the order_by parameter on `%s` collection requests.', 'rest-api-firewall' ), objectLabel ) }<br />
                                    { sprintf( __( 'If disabled, use `menu_order` as order by parameter.', 'rest-api-firewall' ), objectLabel ) }
                                </FormHelperText>
                            </FormControl>

                            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={ 1 }>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={ ( ! savedOrder.length && ! isDirty ) || loading || resetting || savingOptions }
                                    onClick={ handleReset }
                                    sx={ { textTransform: 'none' } }
                                >
                                    { resetting ? __( 'Resetting…', 'rest-api-firewall' ) : sprintf( __( 'Reset %s Items Order', 'rest-api-firewall' ), objectLabel ) }
                                </Button>
                                <Button
                                    size="small"
                                    variant="text"
                                    disabled={ ! hasDragged || ! originalOrder.length }
                                    onClick={ () => { setLocalOrder( originalOrder ); setHasDragged( false ); } }
                                    sx={ { textTransform: 'none' } }
                                >
                                    { __( 'Restore original', 'rest-api-firewall' ) }
                                </Button>
                            </Stack>

                            <Box>

                            <PostOrderList
                            items={ localOrder }
                            orderedIds={ previewOrderIds }
                            objectKind={ objectKind }
                            loading={ loading }
                            onReorder={ handleReorder }
                            originalOrder={ originalOrder }
                            />

                            <TablePagination
                                component="div"
                                count={ totalCount }
                                page={ page }
                                onPageChange={ handlePageChange }
                                onRowsPerPageChange={ handleRowsPerPageChange }
                                rowsPerPage={ rowsPerPage }
                                rowsPerPageOptions={ ROWS_PER_PAGE_OPTIONS }
                                sx={ { borderTop: 0, mt: -1 } }
                            />
                            </Box>
                        </Stack>
                    </Stack>
                ) }
            </Stack>

            <Stack spacing={ 2 } sx={{ width:300 }} >
                <Typography variant="subtitle1" fontWeight={ 600 }>
                    { __( 'Current Settings', 'rest-api-firewall' ) }
                </Typography>
                { publicObjectTypes.length > 0 && (
                    <Stack spacing={ 1 } maxWidth="100%" overflow="hidden">
                        { publicObjectTypes.map( ( obj ) => {
                            const typeSettings = ( form?.rest_collection_per_page_settings || {} )[ obj.value ] || {};
                            const typeOrder = ( form?.rest_collection_orders || {} )[ obj.value ] || [];
                            const hasPerPage = !! typeSettings.enabled;
                            const hasOrder = Array.isArray( typeOrder ) && typeOrder.length > 0;
                            const hasEnforceOrder = !! typeSettings.enforce_order;
                            const isSelected = selectedType === obj.value;

                            return (
                                <Stack key={ obj.value } sx={{p:1, mb:1, bgcolor: 'grey.100', borderRadius: 0.5}} maxWidth="100%" direction="row" flexWrap="wrap" gap={ 1 }>
                                    <Typography variant="body2" color={ isSelected ? 'primary.main' : 'text.primary' } fontWeight={ isSelected ? 600 : 500 }>
                                        { obj.label }
                                    </Typography>
                                    { hasPerPage && <Chip
                                        size="small"
                                        color={ isSelected ? 'primary' : 'default' }
                                        variant="outlined"
                                        label={sprintf( __( 'Per page: %d', 'rest-api-firewall' ), typeSettings.items_per_page || 25 ) }
                                            
                                    />}
                                    { hasOrder && <Chip
                                        size="small"
                                        color={ isSelected ? 'primary' : 'default' }
                                        variant="outlined"
                                        label={ __( 'Order set', 'rest-api-firewall' ) }
                                    />}
                                    { hasEnforceOrder && <Chip
                                        size="small"
                                        color={ isSelected ? 'primary' : 'default' }
                                        variant="outlined"
                                        label={  __( 'Order enforced', 'rest-api-firewall' )}
                                    />}
                                </Stack>
                            );
                        } ) }
                    </Stack>
                ) }
            </Stack>

                
		</Stack>
	);
}

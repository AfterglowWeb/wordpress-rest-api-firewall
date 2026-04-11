import { useState, useEffect, useCallback, useRef, useReducer, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import useSaveOptions from '../../hooks/useSaveOptions';
import useProActions from '../../hooks/useProActions';

import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import UndoIcon from '@mui/icons-material/Undo';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import RuleIcon from '@mui/icons-material/Rule';

import Tooltip from '@mui/material/Tooltip';

import { DataGrid } from '@mui/x-data-grid';

import { PostOrderList, PageDropZone } from './SortCollectionsUtils';
import CollectionEditor from './CollectionEditor';
import ObjectTypeNav from '../shared/ObjectTypeNav';

const initTypeEntry = ( ids ) => ( {
	masterOrder: ids,
	originalMasterOrder: ids,
	hasDragged: false,
	proSettingsDirty: false,
	loaded: true,
} );

const INITIAL_ORDER_STATE = { byType: {}, itemCache: {} };

function ordersReducer( state, action ) {
	switch ( action.type ) {
		case 'INIT_TYPE':
			return {
				...state,
				byType: { ...state.byType, [ action.typeKey ]: initTypeEntry( action.ids ) },
			};

		case 'UPDATE_MASTER_ORDER': {
			const prev = state.byType[ action.typeKey ] || initTypeEntry( [] );
			return {
				...state,
				byType: {
					...state.byType,
					[ action.typeKey ]: { ...prev, masterOrder: action.order, hasDragged: true },
				},
			};
		}

		case 'UNDO': {
			const prev = state.byType[ action.typeKey ];
			if ( ! prev ) return state;
			return {
				...state,
				byType: {
					...state.byType,
					[ action.typeKey ]: {
						...prev,
						masterOrder: prev.originalMasterOrder,
						hasDragged: false,
					},
				},
			};
		}

		case 'MARK_SAVED': {
			const prev = state.byType[ action.typeKey ];
			if ( ! prev ) return state;
			return {
				...state,
				byType: {
					...state.byType,
					[ action.typeKey ]: {
						...prev,
						masterOrder: action.savedOrder,
						originalMasterOrder: action.savedOrder,
						hasDragged: false,
						proSettingsDirty: false,
					},
				},
			};
		}

		case 'SET_SETTINGS_DIRTY': {
			const prev = state.byType[ action.typeKey ];
			if ( ! prev ) return state;
			return {
				...state,
				byType: {
					...state.byType,
					[ action.typeKey ]: { ...prev, proSettingsDirty: action.dirty },
				},
			};
		}

		case 'CACHE_ITEMS':
			return {
				...state,
				itemCache: {
					...state.itemCache,
					...Object.fromEntries( action.items.map( ( i ) => [ i.id, i ] ) ),
				},
			};

		case 'RESET_ALL':
			return INITIAL_ORDER_STATE;

		default:
			return state;
	}
}

const DEFAULT_ROWS_PER_PAGE = 25;
const ROWS_PER_PAGE_OPTIONS = [ 25, 50, 100 ];

export default function Collections( { form, setField, syncSavedField, postTypes } ) {
	const { __, sprintf } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const { selectedApplicationId, applications } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const objectTypes = adminData?.post_types || postTypes || [];
	const publicObjectTypes = objectTypes.filter( ( obj ) => obj.public );
	const hideUserRoutes = !! adminData?.admin_options?.hide_user_routes;
	const isPro = hasValidLicense && !! selectedApplicationId;

	const { subKey, navigate: navigateTo } = useNavigation();

	const { save: saveOptions, saving: savingOptions } = useSaveOptions();
	const { save: saveProAction, saving: savingProOrder } = useProActions();
	const { openDialog } = useDialog();

	const [ selectedType, setSelectedType ] = useState( subKey || 'post' );
	const [ loadingIds, setLoadingIds ] = useState( false );
	const [ loading, setLoading ] = useState( false );
	const [ resetting, setResetting ] = useState( false );
	const [ fetchError, setFetchError ] = useState( '' );
	const [ page, setPage ] = useState( 0 );
	const [ rowsPerPage, setRowsPerPage ] = useState( DEFAULT_ROWS_PER_PAGE );

	const [ orderState, dispatch ] = useReducer( ordersReducer, INITIAL_ORDER_STATE );

	const itemCacheRef = useRef( {} );
	useEffect( () => { itemCacheRef.current = orderState.itemCache; }, [ orderState.itemCache ] );
	const byTypeRef = useRef( {} );
	useEffect( () => { byTypeRef.current = orderState.byType; }, [ orderState.byType ] );
	useEffect( () => { if ( subKey ) setSelectedType( subKey ); }, [ subKey ] );

	const typeState = orderState.byType[ selectedType ] || {
		masterOrder: [],
		originalMasterOrder: [],
		hasDragged: false,
		proSettingsDirty: false,
		loaded: false,
	};
	const { masterOrder, originalMasterOrder, hasDragged, proSettingsDirty } = typeState;

	const selectedObject = objectTypes.find( ( item ) => item.value === selectedType );
	const objectKind = selectedObject?.type || 'post_type';
	const objectLabel = selectedObject?.label || selectedType;

	const currentPageItems = masterOrder.slice( page * rowsPerPage, ( page + 1 ) * rowsPerPage ).map( ( id ) => orderState.itemCache[ id ] ).filter( Boolean );
	const isLastPage = masterOrder.length <= ( page + 1 ) * rowsPerPage;
	const needsPagination = masterOrder.length > rowsPerPage;
	const singleItem = masterOrder.length === 1;

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

	const fetchAllIds = useCallback( async ( type, kind ) => {
		if ( ! type ) {
			return;
		}
		setLoadingIds( true );
		setFetchError( '' );
		try {
			const params = {
				action: isPro ? 'get_all_application_collection_ids' : 'get_all_collection_ids',
				nonce,
				object_key: type,
				object_kind: kind,
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
				const ids = ( json.data.ids || [] ).map( Number );
				dispatch( { type: 'INIT_TYPE', typeKey: type, ids } );
			} else {
				setFetchError( json.data?.message || __( 'Failed to load', 'rest-api-firewall' ) );
			}
		} catch {
			setFetchError( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoadingIds( false );
		}
	}, [ isPro, selectedApplicationId, nonce, adminData.ajaxurl, __ ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		if ( ! masterOrder.length ) {
			return;
		}
		const pageIds = masterOrder.slice( page * rowsPerPage, ( page + 1 ) * rowsPerPage );
		const missingIds = pageIds.filter( ( id ) => ! itemCacheRef.current[ id ] );
		if ( ! missingIds.length ) {
			return;
		}
		let cancelled = false;
		setLoading( true );
		setFetchError( '' );
		( async () => {
			try {
				const params = {
					action: 'get_collection_items_by_ids',
					nonce,
					object_key: selectedType,
					object_kind: objectKind,
					ids: JSON.stringify( missingIds ),
				};
				if ( 'taxonomy' === objectKind ) {
					params.taxonomy = selectedType;
				} else {
					params.post_type = selectedType;
				}
				const res = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
				const json = await res.json();
				if ( ! cancelled ) {
					if ( json.success ) {
						dispatch( { type: 'CACHE_ITEMS', items: json.data.items || [] } );
					} else {
						setFetchError( json.data?.message || __( 'Failed to load items', 'rest-api-firewall' ) );
					}
				}
			} catch {
				if ( ! cancelled ) {
					setFetchError( __( 'Network error', 'rest-api-firewall' ) );
				}
			} finally {
				if ( ! cancelled ) {
					setLoading( false );
				}
			}
		} )();
		return () => { cancelled = true; };
	}, [ masterOrder, page, rowsPerPage ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		loadOrders();
	}, [ loadOrders ] );

	const contextKey = `${ isPro ? '1' : '0' }__${ selectedApplicationId || 'none' }`;
	const prevContextKeyRef = useRef( null );
	useEffect( () => {
		const contextChanged = prevContextKeyRef.current !== null && prevContextKeyRef.current !== contextKey;
		prevContextKeyRef.current = contextKey;
		if ( contextChanged ) {
			dispatch( { type: 'RESET_ALL' } );
			byTypeRef.current = {};
			itemCacheRef.current = {};
		}
		setPage( 0 );
		if ( ! selectedType ) {
			return;
		}
		if ( byTypeRef.current[ selectedType ]?.loaded && ! contextChanged ) {
			return;
		}
		fetchAllIds( selectedType, objectKind );
	}, [ selectedType, objectKind, contextKey ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const syncOrderField = useCallback( ( order ) => {
		const value = { ...( formOrdersRef.current || {} ), [ selectedType ]: order };
		if ( ! isPro ) {
			setField( { target: { name: 'rest_collection_orders', value, type: 'object' } } );
		} else {
			syncSavedField( 'rest_collection_orders', value );
		}
	}, [ isPro, selectedType, setField, syncSavedField ] );

	const updateMasterOrder = useCallback( ( newOrder ) => {
		dispatch( { type: 'UPDATE_MASTER_ORDER', typeKey: selectedType, order: newOrder } );
		syncOrderField( newOrder );
	}, [ selectedType, syncOrderField ] );

	const handleTypeChange = ( e ) => {
		setSelectedType( e.target.value );
	};

	const handlePageChange = ( _, newPage ) => {
		setPage( newPage );
	};

	const handleRowsPerPageChange = ( e ) => {
		setRowsPerPage( parseInt( e.target.value, 10 ) || DEFAULT_ROWS_PER_PAGE );
		setPage( 0 );
	};

	const handleReset = async () => {
		if ( ! selectedType ) {
			return;
		}
		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: sprintf( __( 'Restore %s Order', 'rest-api-firewall' ), objectLabel ),
			content: sprintf( __( 'Restore WordPress default order for %s? This will remove any custom ordering you have set.', 'rest-api-firewall' ), objectLabel ),
			confirmLabel: __( 'Restore', 'rest-api-firewall' ),
			onConfirm: async () => {
				setResetting( true );
				try {
					// 1. Clear enforce_order and silently save per-page settings.
					const currentTypeSettings = ( form.rest_collection_per_page_settings || {} )[ selectedType ] || {};
					const updatedTypeSettings = { ...currentTypeSettings, enforce_order: false };
					const updatedPerPageSettings = {
						...( form.rest_collection_per_page_settings || {} ),
						[ selectedType ]: updatedTypeSettings,
					};
					if ( isPro ) {
						syncSavedField( 'rest_collection_per_page_settings', updatedPerPageSettings );
						dispatch( { type: 'SET_SETTINGS_DIRTY', typeKey: selectedType, dirty: false } );
						await fetch( adminData.ajaxurl, {
							method: 'POST',
							body: new URLSearchParams( {
								action: 'save_application_collection_per_page_setting',
								nonce,
								application_id: selectedApplicationId,
								object_key: selectedType,
								settings: JSON.stringify( updatedTypeSettings ),
							} ),
						} );
					} else {
						setField( { target: { name: 'rest_collection_per_page_settings', value: updatedPerPageSettings, type: 'object' } } );
						await fetch( adminData.ajaxurl, {
							method: 'POST',
							headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
							body: new URLSearchParams( {
								action: 'rest_api_firewall_update_options',
								nonce: adminData.nonce,
								options: JSON.stringify( {
									rest_collection_per_page_settings: updatedPerPageSettings,
									rest_collection_orders: formOrdersRef.current,
								} ),
							} ),
						} );
					}

					// 2. Reset order.
					const params = {
						action: isPro ? 'reset_application_collection_order' : 'reset_collection_order',
						nonce,
						object_key: selectedType,
						object_kind: objectKind,
					};
					if ( 'taxonomy' === objectKind ) {
						params.taxonomy = selectedType;
					} else {
						params.post_type = selectedType;
					}
					if ( isPro && selectedApplicationId ) {
						params.application_id = selectedApplicationId;
					}
					const res = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
					const json = await res.json();
					if ( json.success ) {
						setField( { target: {
							name: 'rest_collection_orders',
							value: { ...( formOrdersRef.current || {} ), [ selectedType ]: [] },
							type: 'object',
						} } );
						setPage( 0 );
						await fetchAllIds( selectedType, objectKind );
					}
				} finally {
					setResetting( false );
				}
			},
		} );
	};

	const handleReorder = useCallback( ( newItems ) => {
		const pageIds = newItems.map( ( i ) => i.id );
		const before = masterOrder.slice( 0, page * rowsPerPage );
		const after = masterOrder.slice( ( page + 1 ) * rowsPerPage );
		const newMasterOrder = [ ...before, ...pageIds, ...after ];
		updateMasterOrder( newMasterOrder );
	}, [ masterOrder, page, rowsPerPage, updateMasterOrder ] );

	const handleCrossPageMove = useCallback( ( itemId, direction, navigate ) => {
		const newOrder = masterOrder.filter( ( id ) => id !== itemId );
		let insertIdx;
		if ( direction === 'prev' ) {
			insertIdx = Math.max( 0, page * rowsPerPage - 1 );
		} else {
			insertIdx = Math.min( ( page + 1 ) * rowsPerPage, newOrder.length );
		}
		const finalOrder = [ ...newOrder.slice( 0, insertIdx ), itemId, ...newOrder.slice( insertIdx ) ];
		updateMasterOrder( finalOrder );
		if ( navigate ) {
			setPage( direction === 'prev' ? page - 1 : page + 1 );
		}
	}, [ masterOrder, page, rowsPerPage, updateMasterOrder ] );

	const handleSavePro = useCallback( () => {
		const currentPerPageSettings = ( form.rest_collection_per_page_settings || {} )[ selectedType ] || {};
		const params = {
			action: 'save_application_collection_order',
			nonce,
			object_key: selectedType,
			object_kind: objectKind,
			order: JSON.stringify( masterOrder ),
			full_order: '1',
			application_id: selectedApplicationId,
		};
		if ( 'taxonomy' === objectKind ) {
			params.taxonomy = selectedType;
		} else {
			params.post_type = selectedType;
		}
		saveProAction( params, {
			confirmTitle:   sprintf( __( 'Save %s Settings', 'rest-api-firewall' ), objectLabel ),
			confirmMessage: sprintf( __( 'Save order and per-page settings for %s?', 'rest-api-firewall' ), objectLabel ),
			successTitle:   __( 'Settings Saved', 'rest-api-firewall' ),
			successMessage: sprintf( __( '%s settings saved successfully.', 'rest-api-firewall' ), objectLabel ),
			onSuccess: ( data ) => {
				const savedOrder = data?.order || masterOrder;
				syncSavedField( 'rest_collection_orders', { ...( formOrdersRef.current || {} ), [ selectedType ]: savedOrder } );
				dispatch( { type: 'MARK_SAVED', typeKey: selectedType, savedOrder } );
				const perPageParams = new URLSearchParams( {
					action: 'save_application_collection_per_page_setting',
					nonce,
					application_id: selectedApplicationId,
					object_key: selectedType,
					settings: JSON.stringify( currentPerPageSettings ),
				} );
				fetch( adminData.ajaxurl, { method: 'POST', body: perPageParams } )
					.then( () => dispatch( { type: 'SET_SETTINGS_DIRTY', typeKey: selectedType, dirty: false } ) )
					.catch( () => {} );
			},
		} );
	}, [ saveProAction, masterOrder, selectedType, objectKind, objectLabel, __, sprintf, syncSavedField, form.rest_collection_per_page_settings, nonce, selectedApplicationId, adminData.ajaxurl ] );

	const handleSaveFree = useCallback( () => {
		saveOptions(
			{
				rest_collection_per_page_settings: form.rest_collection_per_page_settings,
				rest_collection_orders: form.rest_collection_orders,
			},
			{
				skipConfirm: true,
				onSuccess: () => {
					dispatch( { type: 'MARK_SAVED', typeKey: selectedType, savedOrder: masterOrder } );
				},
			}
		);
	}, [ saveOptions, form.rest_collection_per_page_settings, form.rest_collection_orders, selectedType, masterOrder ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const handlePerPageSettingChange = ( field, value ) => {
		const currentTypeSettings = ( form.rest_collection_per_page_settings || {} )[ selectedType ] || {};
		const newTypeSettings = { ...currentTypeSettings, [ field ]: value };
		const updated = {
			...( form.rest_collection_per_page_settings || {} ),
			[ selectedType ]: newTypeSettings,
		};
		if ( isPro ) {
			syncSavedField( 'rest_collection_per_page_settings', updated );
			dispatch( { type: 'SET_SETTINGS_DIRTY', typeKey: selectedType, dirty: true } );
		} else {
			setField( { target: {
				name: 'rest_collection_per_page_settings',
				value: updated,
				type: 'object',
			} } );
			dispatch( { type: 'SET_SETTINGS_DIRTY', typeKey: selectedType, dirty: true } );
		}
	};

	// Inline toggle in the pro DataGrid row — saves directly to DB without opening the editor.
	const handleInlineTypeToggle = useCallback( ( typeKey, field, value ) => {
		const currentTypeSettings = ( form.rest_collection_per_page_settings || {} )[ typeKey ] || {};
		const newTypeSettings = { ...currentTypeSettings, [ field ]: value };
		const updated = {
			...( form.rest_collection_per_page_settings || {} ),
			[ typeKey ]: newTypeSettings,
		};
		syncSavedField( 'rest_collection_per_page_settings', updated );
		fetch( adminData.ajaxurl, {
			method: 'POST',
			body: new URLSearchParams( {
				action: 'save_application_collection_per_page_setting',
				nonce,
				application_id: selectedApplicationId,
				object_key: typeKey,
				settings: JSON.stringify( newTypeSettings ),
			} ),
		} ).catch( () => {} );
	}, [ form.rest_collection_per_page_settings, syncSavedField, adminData.ajaxurl, nonce, selectedApplicationId ] );

	// ── Pro tier: DataGrid list + CollectionEditor (per-type) ──────────────────
	const [ editing, setEditing ] = useState( null );

	if ( isPro ) {
		// When editing a type, render the CollectionEditor (replaces the list).
		if ( editing !== null ) {
			return (
				<CollectionEditor
					collectionType={ editing }
					form={ form }
					setField={ setField }
					syncSavedField={ syncSavedField }
					onBack={ () => setEditing( null ) }
				/>
			);
		}

		// Build DataGrid rows from publicObjectTypes + form state.
		const proRows = publicObjectTypes.map( ( obj ) => {
			const isAuthorRestricted = obj.type === 'author' && hideUserRoutes;
			const typeSettings = ( form?.rest_collection_per_page_settings || {} )[ obj.value ] || {};
			const typeOrder    = ( form?.rest_collection_orders || {} )[ obj.value ] || [];
			return {
				id:              obj.value,
				label:           obj.label,
				object_type:     obj.value,
				source:          obj.source || '',
				count:           obj.count ?? 0,
				items_per_page:  typeSettings.enabled ? ( typeSettings.items_per_page || 25 ) : null,
				enforce_order:   !! typeSettings.enforce_order,
				enforce_per_page: !! typeSettings.enabled,
				has_custom_order: Array.isArray( typeOrder ) && typeOrder.length > 0,
				disabled:        isAuthorRestricted,
				disabled_reason: isAuthorRestricted ? __( 'Hidden because /wp/v2/users/* routes are disabled in global options', 'rest-api-firewall' ) : null,
				_obj:            obj,
			};
		} );

		const proColumns = [
			{
				field: 'label',
				headerName: __( 'Type', 'rest-api-firewall' ),
				flex: 1,
				renderCell: ( { row } ) => (
					<Stack direction="row" alignItems="center" gap={ 1 }>
						<Typography variant="body2" fontWeight={ 500 } color={ row.disabled ? 'text.disabled' : 'inherit' }>{ row.label }</Typography>
						{ row.source && (
							<Chip label={ row.source } size="small" variant="outlined" sx={ { fontSize: '0.7rem', height: 18 } } />
						) }
						{ row.disabled && row.disabled_reason && (
							<Tooltip title={ row.disabled_reason }>
								<Chip label={ __( 'Restricted', 'rest-api-firewall' ) } size="small" color="warning" variant="outlined" sx={ { fontSize: '0.7rem', height: 18 } } />
							</Tooltip>
						) }
					</Stack>
				),
			},
			{
				field: 'object_type',
				headerName: __( 'Kind', 'rest-api-firewall' ),
				width: 110,
				renderCell: ( { value } ) => (
					<Chip label={ value } size="small" variant="outlined" sx={ { fontFamily: 'monospace' } } />
				),
			},
			{
				field: 'count',
				headerName: __( 'Items', 'rest-api-firewall' ),
				width: 80,
				renderCell: ( { value } ) => (
					<Badge badgeContent={ value } color="primary" max={ 99999 } showZero
						anchorOrigin={ { vertical: 'top', horizontal: 'right' } }
						sx={ { '& .MuiBadge-badge': { position: 'static', transform: 'none', fontWeight: 600 } } }
					>
						{ null }
					</Badge>
				),
			},
			{
				field: 'enforce_per_page',
				headerName: __( 'Per Page', 'rest-api-firewall' ),
				width: 130,
				renderCell: ( { row } ) => row.enforce_per_page
					? <Chip label={ `${ row.items_per_page } / page` } size="small" color="primary" variant="outlined" />
					: <Chip label={ __( 'Default', 'rest-api-firewall' ) } size="small" variant="outlined" />,
			},
			{
				field: 'enforce_order',
				headerName: __( 'Order', 'rest-api-firewall' ),
				width: 130,
				renderCell: ( { value } ) => value
					? <Chip label={ __( 'Enforced', 'rest-api-firewall' ) } size="small" color="primary" variant="outlined" />
					: <Chip label={ __( 'Default', 'rest-api-firewall' ) } size="small" variant="outlined" />,
			},
			{
				field: 'has_custom_order',
				headerName: __( 'Custom Order', 'rest-api-firewall' ),
				width: 140,
				renderCell: ( { value } ) => value
					? <Chip label={ __( 'Set', 'rest-api-firewall' ) } size="small" color="success" variant="outlined" />
					: <Chip label={ __( 'None', 'rest-api-firewall' ) } size="small" variant="outlined" />,
			},
			{
				field: '_enabled',
				headerName: __( 'Active', 'rest-api-firewall' ),
				width: 80,
				sortable: false,
				renderCell: ( { row } ) => (
					<Tooltip
						disableInteractive
						title={ row.disabled
							? ( row.disabled_reason || __( 'Restricted', 'rest-api-firewall' ) )
							: ( row.enforce_per_page
								? __( 'Disable enforcement', 'rest-api-firewall' )
								: __( 'Enable enforcement', 'rest-api-firewall' ) )
						}
					>
						<span>
							<Switch
								size="small"
								checked={ row.enforce_per_page }
								disabled={ row.disabled }
								onChange={ ( e ) => handleInlineTypeToggle( row.id, 'enabled', e.target.checked ) }
								onClick={ ( e ) => e.stopPropagation() }
							/>
						</span>
					</Tooltip>
				),
			},
			{
				field: '_actions',
				headerName: '',
				width: 64,
				sortable: false,
				renderCell: ( { row } ) => (
					<Tooltip disableInteractive title={ row.disabled ? ( row.disabled_reason || __( 'Restricted', 'rest-api-firewall' ) ) : __( 'Edit', 'rest-api-firewall' ) }>
						<span>
							<IconButton size="small" onClick={ () => setEditing( row._obj ) } disabled={ row.disabled }>
								<EditOutlinedIcon fontSize="small" />
							</IconButton>
						</span>
					</Tooltip>
				),
			},
		];

		return (
			<Stack sx={ { height: '100%', flexGrow: 1 } }>
				<DataGrid
					rows={ proRows }
					columns={ proColumns }
					loading={ false }
					disableRowSelectionOnClick
					onRowDoubleClick={ ( { row } ) => setEditing( row._obj ) }
					showToolbar
					sx={ { border: 0 } }
				/>
			</Stack>
		);
	}
	// ── End pro tier ────────────────────────────────────────────────────────────

	// ── Free tier: grouped left nav + right form ────────────────────────────────

	return (
		<Stack direction="row" sx={ { height: '100%', flexGrow: 1, overflow: 'hidden' } }>

			<ObjectTypeNav
				objectTypes={ publicObjectTypes }
				selectedType={ selectedType }
				onSelect={ setSelectedType }
				renderItemEnd={ ( obj, isSelected ) => (
					<Chip
						label={ obj.count ?? 0 }
						size="small"
						color={ isSelected ? 'primary' : 'default' }
						sx={ { fontWeight: 700, fontSize: '0.7rem', height: 18, minWidth: 28, flexShrink: 0 } }
					/>
				) }
				renderItemBottom={ ( obj, isSelected ) => {
					const typeSettings    = ( form?.rest_collection_per_page_settings || {} )[ obj.value ] || {};
					const typeOrder       = ( form?.rest_collection_orders || {} )[ obj.value ] || [];
					const hasPerPage      = !! typeSettings.enabled;
					const hasOrder        = Array.isArray( typeOrder ) && typeOrder.length > 0;
					const hasEnforceOrder = !! typeSettings.enforce_order;
					if ( ! hasPerPage && ! hasOrder && ! hasEnforceOrder ) return null;
					return (
						<Stack direction="row" flexWrap="wrap" gap={ 0.5 }>
							{ hasPerPage && (
								<Chip size="small" color={ isSelected ? 'primary' : 'default' } variant="outlined"
									label={ sprintf( __( '%d/pg', 'rest-api-firewall' ), typeSettings.items_per_page || 25 ) }
									sx={ { fontSize: '0.6rem', height: 14 } }
								/>
							) }
							{ hasOrder && (
								<Chip size="small" color={ isSelected ? 'primary' : 'default' } variant="outlined"
									label={ __( 'ordered', 'rest-api-firewall' ) }
									sx={ { fontSize: '0.6rem', height: 14 } }
								/>
							) }
							{ hasEnforceOrder && (
								<Chip size="small" color={ isSelected ? 'primary' : 'default' } variant="outlined"
									label={ __( 'enforced', 'rest-api-firewall' ) }
									sx={ { fontSize: '0.6rem', height: 14 } }
								/>
							) }
						</Stack>
					);
				} }
			/>

			{ /* Right form */ }
			<Stack flex={ 1 } p={ 4 } spacing={ 3 } overflow="auto">
			<Stack direction="row" alignItems="center" justifyContent="space-between" gap={ 1 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ selectedType
							? sprintf( __( '%s — Per Page & Order', 'rest-api-firewall' ), objectLabel )
							: __( 'Set Collections Per Page And Order', 'rest-api-firewall' ) }
					</Typography>
					<Stack direction="row" gap={ 0.5 } alignItems="center">
						{ selectedType && (
							<>
								<Tooltip disableInteractive title={ __( 'View routes', 'rest-api-firewall' ) }>
									<IconButton size="small" onClick={ () => {
										const pt = publicObjectTypes.find( ( p ) => p.value === selectedType );
										const restPath = pt ? `/wp/v2/${ pt.rest_base || pt.value }` : null;
										navigateTo( 'per-route-settings', restPath ? `routes|${ restPath }` : 'routes' );
									} } sx={ { opacity: 0.5 } }>
										<AccountTreeOutlinedIcon fontSize="small" />
									</IconButton>
								</Tooltip>
								<Tooltip disableInteractive title={ __( 'View model properties', 'rest-api-firewall' ) }>
									<IconButton size="small" onClick={ () => navigateTo( 'models-properties', hasValidLicense ? 'models' : selectedType ) } sx={ { opacity: 0.5 } }>
										<RuleIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							</>
						) }
						<Button
							size="small"
							variant="contained"
							disableElevation
							disabled={ isPro
								? ( ( ! hasDragged && ! proSettingsDirty ) || savingProOrder )
								: ( ( ! hasDragged && ! proSettingsDirty ) || savingOptions )
							}
							onClick={ isPro ? handleSavePro : handleSaveFree }
						>
							{ ( isPro ? savingProOrder : savingOptions ) ? __( 'Saving…', 'rest-api-firewall' ) : __( 'Save', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				</Stack>

				{ selectedType && (
					<Stack spacing={ 2 }>
						<FormControl>
							<FormControlLabel
								control={
									<Switch
										checked={ !! ( form.rest_collection_per_page_settings?.[ selectedType ]?.enabled ) }
										onChange={ ( e ) => handlePerPageSettingChange( 'enabled', e.target.checked ) }
										size="small"
									/>
								}
								label={ sprintf( __( 'Enforce %s Items Per Page', 'rest-api-firewall' ), objectLabel ) }
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
							<FormControl>
								<FormControlLabel
									control={
										<Switch
											checked={ !! ( form.rest_collection_per_page_settings?.[ selectedType ]?.enforce_order ) }
											onChange={ ( e ) => handlePerPageSettingChange( 'enforce_order', e.target.checked ) }
											size="small"
																				disabled={ resetting }
									/>
									}
									label={ sprintf( __( 'Enforce %s Items Order', 'rest-api-firewall' ), objectLabel ) }
								/>
								<FormHelperText>
									{ sprintf( __( 'Override the order_by parameter on `%s` collection requests.', 'rest-api-firewall' ), objectLabel ) }<br />
									{ sprintf( __( 'If disabled, use `menu_order` as order by parameter.', 'rest-api-firewall' ), objectLabel ) }
								</FormHelperText>
							</FormControl>

							<Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent="space-between" gap={ 1 }>
								{ needsPagination && (
									<TablePagination
										component="div"
										count={ masterOrder.length }
										page={ page }
										onPageChange={ handlePageChange }
										onRowsPerPageChange={ handleRowsPerPageChange }
										rowsPerPage={ rowsPerPage }
										rowsPerPageOptions={ ROWS_PER_PAGE_OPTIONS }
										sx={ { borderTop: 0, mt: -1 } }
									/>
								) }

								<Stack flex={ 1 } />
								<Tooltip disableInteractive title={ __( 'Undo Current Changes', 'rest-api-firewall' ) }>
									<Button
										size="small"
										variant="text"
										startIcon={ <UndoIcon /> }
										disabled={ ! hasDragged || ! originalMasterOrder.length }
										onClick={ () => {
											dispatch( { type: 'UNDO', typeKey: selectedType } );
											syncOrderField( originalMasterOrder );
										} }
									>
										{ __( 'Undo', 'rest-api-firewall' ) }
									</Button>
								</Tooltip>

								<Tooltip disableInteractive title={ __( 'Restore WordPress Default Order', 'rest-api-firewall' ) }>
									<Button
										size="small"
										variant="text"
										color="error"
										startIcon={ <SettingsBackupRestoreIcon /> }
										disabled={ ! ( form.rest_collection_orders?.[ selectedType ]?.length > 0 ) || loading || loadingIds || resetting || savingOptions }
										onClick={ handleReset }
									>
										{ resetting ? __( 'Resetting…', 'rest-api-firewall' ) : sprintf( __( 'Restore', 'rest-api-firewall' ), objectLabel ) }
									</Button>
								</Tooltip>
							</Stack>

							<Box sx={ { display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 0.75 } }>
								{ needsPagination && (
									<PageDropZone
										direction="prev"
										disabled={ page === 0 }
										onDrop={ handleCrossPageMove }
										setPage={ setPage }
									/>
								) }
								<Box sx={ { flex: 1, minWidth: 0 } }>
									<PostOrderList
										items={ currentPageItems }
										orderedIds={ masterOrder }
										originalOrderedIds={ originalMasterOrder }
										objectKind={ objectKind }
										loading={ loading || loadingIds }
										onReorder={ handleReorder }
										singleItem={ singleItem }
									/>
								</Box>
								{ needsPagination && (
									<PageDropZone
										direction="next"
										disabled={ isLastPage }
										onDrop={ handleCrossPageMove }
										setPage={ setPage }
									/>
								) }
							</Box>
						</Stack>
					</Stack>
				) }
			</Stack>
		</Stack>
	);
}

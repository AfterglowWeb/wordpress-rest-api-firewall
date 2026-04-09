import { useState, useEffect, useCallback, useRef, useReducer } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import useProActions from '../../hooks/useProActions';
import useSaveOptions from '../../hooks/useSaveOptions';
import useRegisterToolbar from '../../hooks/useRegisterToolbar';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import UndoIcon from '@mui/icons-material/Undo';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

import { PostOrderList, PageDropZone } from './SortCollectionsUtils';

const DEFAULT_ROWS_PER_PAGE = 25;
const ROWS_PER_PAGE_OPTIONS = [ 25, 50, 100 ];

function initTypeEntry( ids ) {
	return {
		masterOrder: ids,
		originalMasterOrder: ids,
		hasDragged: false,
		proSettingsDirty: false,
		loaded: true,
	};
}

const INITIAL_ORDER_STATE = { masterOrder: [], originalMasterOrder: [], hasDragged: false, proSettingsDirty: false, loaded: false };
const INITIAL_ITEM_CACHE = {};

function orderReducer( state, action ) {
	switch ( action.type ) {
		case 'INIT':
			return initTypeEntry( action.ids );

		case 'UPDATE_ORDER':
			return { ...state, masterOrder: action.order, hasDragged: true };

		case 'UNDO':
			return { ...state, masterOrder: state.originalMasterOrder, hasDragged: false };

		case 'MARK_SAVED':
			return {
				...state,
				masterOrder: action.savedOrder,
				originalMasterOrder: action.savedOrder,
				hasDragged: false,
				proSettingsDirty: false,
			};

		case 'SET_SETTINGS_DIRTY':
			return { ...state, proSettingsDirty: action.dirty };

		default:
			return state;
	}
}

/**
 * CollectionEditor — Pro tier per-type collection order & settings editor.
 * Rendered by Collections.jsx when a user clicks "Edit" on a type row.
 *
 * @param {{ collectionType: object, form: object, setField: function, syncSavedField: function, onBack: function }} props
 */
export default function CollectionEditor( { collectionType, form, setField, syncSavedField, onBack } ) {
	const { __, sprintf } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { openDialog } = useDialog();

	const { saving: savingOptions } = useSaveOptions();
	const { save: saveProAction, saving: savingProOrder } = useProActions();

	const typeKey   = collectionType.value;
	const objectKind = collectionType.type || 'post_type';
	const objectLabel = collectionType.label || typeKey;

	const [ orderState, dispatch ] = useReducer( orderReducer, INITIAL_ORDER_STATE );
	const [ itemCache, setItemCache ]   = useState( INITIAL_ITEM_CACHE );
	const [ loadingIds, setLoadingIds ] = useState( false );
	const [ loading, setLoading ]       = useState( false );
	const [ resetting, setResetting ]   = useState( false );
	const [ fetchError, setFetchError ] = useState( '' );
	const [ page, setPage ]             = useState( 0 );
	const [ rowsPerPage, setRowsPerPage ] = useState( DEFAULT_ROWS_PER_PAGE );

	const { masterOrder, originalMasterOrder, hasDragged, proSettingsDirty } = orderState;

	const currentPageItems = masterOrder
		.slice( page * rowsPerPage, ( page + 1 ) * rowsPerPage )
		.map( ( id ) => itemCache[ id ] )
		.filter( Boolean );

	const isLastPage     = masterOrder.length <= ( page + 1 ) * rowsPerPage;
	const needsPagination = masterOrder.length > rowsPerPage;
	const singleItem     = masterOrder.length === 1;

	const formOrdersRef = useRef( form.rest_collection_orders );
	useEffect( () => {
		formOrdersRef.current = form.rest_collection_orders;
	}, [ form.rest_collection_orders ] );

	// Fetch the ordered IDs for this type from the server.
	const fetchAllIds = useCallback( async () => {
		setLoadingIds( true );
		setFetchError( '' );
		try {
			const params = {
				action: 'get_all_application_collection_ids',
				nonce,
				object_key: typeKey,
				object_kind: objectKind,
				application_id: selectedApplicationId,
			};
			if ( objectKind === 'taxonomy' ) {
				params.taxonomy = typeKey;
			} else {
				params.post_type = typeKey;
			}
			const res  = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
			const json = await res.json();
			if ( json.success ) {
				dispatch( { type: 'INIT', ids: ( json.data.ids || [] ).map( Number ) } );
			} else {
				setFetchError( json.data?.message || __( 'Failed to load', 'rest-api-firewall' ) );
			}
		} catch {
			setFetchError( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoadingIds( false );
		}
	}, [ typeKey, objectKind, selectedApplicationId, nonce, adminData.ajaxurl, __ ] );

	// Load ordered IDs on mount.
	useEffect( () => {
		fetchAllIds();
	}, [ fetchAllIds ] );

	// Fetch missing item details for the current page.
	useEffect( () => {
		if ( ! masterOrder.length ) {
			return;
		}
		const pageIds   = masterOrder.slice( page * rowsPerPage, ( page + 1 ) * rowsPerPage );
		const missingIds = pageIds.filter( ( id ) => ! itemCache[ id ] );
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
					object_key: typeKey,
					object_kind: objectKind,
					ids: JSON.stringify( missingIds ),
				};
				if ( objectKind === 'taxonomy' ) {
					params.taxonomy = typeKey;
				} else {
					params.post_type = typeKey;
				}
				const res  = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
				const json = await res.json();
				if ( ! cancelled ) {
					if ( json.success ) {
						setItemCache( ( prev ) => ( {
							...prev,
							...Object.fromEntries( ( json.data.items || [] ).map( ( i ) => [ i.id, i ] ) ),
						} ) );
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

	const syncOrderField = useCallback( ( order ) => {
		syncSavedField( 'rest_collection_orders', {
			...( formOrdersRef.current || {} ),
			[ typeKey ]: order,
		} );
	}, [ typeKey, syncSavedField ] );

	const handlePerPageSettingChange = useCallback( ( field, value ) => {
		const currentTypeSettings = ( form.rest_collection_per_page_settings || {} )[ typeKey ] || {};
		const newTypeSettings = { ...currentTypeSettings, [ field ]: value };
		const updated = {
			...( form.rest_collection_per_page_settings || {} ),
			[ typeKey ]: newTypeSettings,
		};
		syncSavedField( 'rest_collection_per_page_settings', updated );
		dispatch( { type: 'SET_SETTINGS_DIRTY', dirty: true } );
	}, [ typeKey, form.rest_collection_per_page_settings, syncSavedField ] );

	const handleReorder = useCallback( ( newItems ) => {
		const pageIds        = newItems.map( ( i ) => i.id );
		const before         = masterOrder.slice( 0, page * rowsPerPage );
		const after          = masterOrder.slice( ( page + 1 ) * rowsPerPage );
		const newMasterOrder = [ ...before, ...pageIds, ...after ];
		dispatch( { type: 'UPDATE_ORDER', order: newMasterOrder } );
		syncOrderField( newMasterOrder );
	}, [ masterOrder, page, rowsPerPage, syncOrderField ] );

	const handleCrossPageMove = useCallback( ( itemId, direction, navigate ) => {
		const newOrder = masterOrder.filter( ( id ) => id !== itemId );
		let insertIdx;
		if ( direction === 'prev' ) {
			insertIdx = Math.max( 0, page * rowsPerPage - 1 );
		} else {
			insertIdx = Math.min( ( page + 1 ) * rowsPerPage, newOrder.length );
		}
		const finalOrder = [ ...newOrder.slice( 0, insertIdx ), itemId, ...newOrder.slice( insertIdx ) ];
		dispatch( { type: 'UPDATE_ORDER', order: finalOrder } );
		syncOrderField( finalOrder );
		if ( navigate ) {
			setPage( direction === 'prev' ? page - 1 : page + 1 );
		}
	}, [ masterOrder, page, rowsPerPage, syncOrderField ] );

	const handleReset = useCallback( () => {
		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: sprintf( __( 'Restore %s Order', 'rest-api-firewall' ), objectLabel ),
			content: sprintf(
				__( 'Restore WordPress default order for %s? This will remove any custom ordering you have set.', 'rest-api-firewall' ),
				objectLabel
			),
			confirmLabel: __( 'Restore', 'rest-api-firewall' ),
			onConfirm: async () => {
				setResetting( true );
				try {
					const params = {
						action: 'reset_application_collection_order',
						nonce,
						object_key: typeKey,
						object_kind: objectKind,
						application_id: selectedApplicationId,
					};
					if ( objectKind === 'taxonomy' ) {
						params.taxonomy = typeKey;
					} else {
						params.post_type = typeKey;
					}
					const res  = await fetch( adminData.ajaxurl, { method: 'POST', body: new URLSearchParams( params ) } );
					const json = await res.json();
					if ( json.success ) {
						syncSavedField( 'rest_collection_orders', {
							...( formOrdersRef.current || {} ),
							[ typeKey ]: [],
						} );
						setPage( 0 );
						await fetchAllIds();
					}
				} finally {
					setResetting( false );
				}
			},
		} );
	}, [ openDialog, sprintf, __, objectLabel, nonce, typeKey, objectKind, selectedApplicationId, adminData.ajaxurl, syncSavedField, fetchAllIds ] );

	const handleSave = useCallback( () => {
		const currentPerPageSettings = ( form.rest_collection_per_page_settings || {} )[ typeKey ] || {};
		const params = {
			action: 'save_application_collection_order',
			nonce,
			object_key: typeKey,
			object_kind: objectKind,
			order: JSON.stringify( masterOrder ),
			full_order: '1',
			application_id: selectedApplicationId,
		};
		if ( objectKind === 'taxonomy' ) {
			params.taxonomy = typeKey;
		} else {
			params.post_type = typeKey;
		}
		saveProAction( params, {
			confirmTitle:   sprintf( __( 'Save %s Settings', 'rest-api-firewall' ), objectLabel ),
			confirmMessage: sprintf( __( 'Save order and per-page settings for %s?', 'rest-api-firewall' ), objectLabel ),
			successTitle:   __( 'Settings Saved', 'rest-api-firewall' ),
			successMessage: sprintf( __( '%s settings saved successfully.', 'rest-api-firewall' ), objectLabel ),
			onSuccess: ( data ) => {
				const savedOrder = data?.order || masterOrder;
				syncSavedField( 'rest_collection_orders', {
					...( formOrdersRef.current || {} ),
					[ typeKey ]: savedOrder,
				} );
				dispatch( { type: 'MARK_SAVED', savedOrder } );
				fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'save_application_collection_per_page_setting',
						nonce,
						application_id: selectedApplicationId,
						object_key: typeKey,
						settings: JSON.stringify( currentPerPageSettings ),
					} ),
				} )
					.then( () => dispatch( { type: 'SET_SETTINGS_DIRTY', dirty: false } ) )
					.catch( () => {} );
			},
		} );
	}, [ saveProAction, masterOrder, typeKey, objectKind, objectLabel, __, sprintf, syncSavedField, form.rest_collection_per_page_settings, nonce, selectedApplicationId, adminData.ajaxurl ] );

	const handleSaveRef = useRef( handleSave );
	useEffect( () => { handleSaveRef.current = handleSave; }, [ handleSave ] );

	const handleBack = useCallback( () => onBack(), [ onBack ] );

	const updateToolbar = useRegisterToolbar( {
		breadcrumb: __( 'Collections', 'rest-api-firewall' ),
		handleBack,
		handleSave: () => handleSaveRef.current?.(),
	} );

	useEffect( () => {
		updateToolbar( {
			title: objectLabel,
			saving: savingProOrder,
			canSave: hasDragged || proSettingsDirty,
			dirtyFlag: ( hasDragged || proSettingsDirty )
				? { has: true, message: sprintf( __( 'You have unsaved changes to %s collection settings.', 'rest-api-firewall' ), objectLabel ) }
				: null,
		} );
	}, [ objectLabel, savingProOrder, hasDragged, proSettingsDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const typeSettings = ( form?.rest_collection_per_page_settings || {} )[ typeKey ] || {};
	const hasCustomOrder = ( ( form?.rest_collection_orders || {} )[ typeKey ] || [] ).length > 0;

	return (
		<Stack spacing={ 3 } p={ 4 } maxWidth={ 800 }>
			{ fetchError && <Alert severity="error">{ fetchError }</Alert> }

			<Typography variant="h6" fontWeight={ 600 }>
				{ sprintf( __( '%s Collection Settings', 'rest-api-firewall' ), objectLabel ) }
			</Typography>

			{ /* Per-page settings */ }
			<Stack spacing={ 2 } pl={ 1 }>
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={ !! typeSettings.enabled }
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
					inputProps={ { min: 1, max: 100 } }
					size="small"
					disabled={ ! typeSettings.enabled }
					value={ typeSettings.items_per_page || 25 }
					onChange={ ( e ) => handlePerPageSettingChange( 'items_per_page', parseInt( e.target.value, 10 ) || 25 ) }
					sx={ { maxWidth: 200 } }
				/>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={ !! typeSettings.enforce_order }
								onChange={ ( e ) => handlePerPageSettingChange( 'enforce_order', e.target.checked ) }
								size="small"
							/>
						}
						label={ sprintf( __( 'Enforce %s Items Order', 'rest-api-firewall' ), objectLabel ) }
					/>
					<FormHelperText>
						{ sprintf( __( 'Override the order_by parameter on `%s` collection requests.', 'rest-api-firewall' ), objectLabel ) }
						<br />
						{ __( 'If disabled, use `menu_order` as order by parameter.', 'rest-api-firewall' ) }
					</FormHelperText>
				</FormControl>
			</Stack>

			{ /* Ordering toolbar: pagination + undo + restore */ }
			<Stack direction="row" alignItems="center" flexWrap="wrap" gap={ 1 }>
				{ needsPagination && (
					<TablePagination
						component="div"
						count={ masterOrder.length }
						page={ page }
						onPageChange={ ( _, newPage ) => setPage( newPage ) }
						onRowsPerPageChange={ ( e ) => {
							setRowsPerPage( parseInt( e.target.value, 10 ) || DEFAULT_ROWS_PER_PAGE );
							setPage( 0 );
						} }
						rowsPerPage={ rowsPerPage }
						rowsPerPageOptions={ ROWS_PER_PAGE_OPTIONS }
						sx={ { borderTop: 0, mt: -1 } }
					/>
				) }

				<Stack flex={ 1 } />

				<Tooltip disableInteractive title={ __( 'Undo Current Changes', 'rest-api-firewall' ) }>
					<span>
						<Button
							size="small"
							variant="text"
							startIcon={ <UndoIcon /> }
							disabled={ ! hasDragged || ! originalMasterOrder.length }
							onClick={ () => {
								dispatch( { type: 'UNDO' } );
								syncOrderField( originalMasterOrder );
							} }
						>
							{ __( 'Undo', 'rest-api-firewall' ) }
						</Button>
					</span>
				</Tooltip>

				<Tooltip disableInteractive title={ __( 'Restore WordPress Default Order', 'rest-api-firewall' ) }>
					<span>
						<Button
							size="small"
							variant="text"
							color="error"
							startIcon={ <SettingsBackupRestoreIcon /> }
							disabled={ ! hasCustomOrder || loading || loadingIds || resetting || savingOptions }
							onClick={ handleReset }
						>
							{ resetting ? __( 'Resetting…', 'rest-api-firewall' ) : __( 'Restore', 'rest-api-firewall' ) }
						</Button>
					</span>
				</Tooltip>
			</Stack>

			{ /* Drag-drop list */ }
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
	);
}

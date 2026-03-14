import {
	useState,
	useCallback,
	useReducer,
	useEffect,
	useRef,
} from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';

import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';

import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

import { treeReducer } from './routesPolicyReducer';
import {
	findNodeById,
	normalizeTree,
	getAllDescendantMethodIds,
	countAllCustomNodes,
} from './routesPolicyUtils';
import { CustomTreeItem } from './RoutesPolicyNodeContent';
import RoutesPolicyUsersPopover from './RoutesPolicyUsersPopover';
import TestPolicyPanel from './TestPolicyPanel';

export default function RoutesPolicyTree( { form, setField, selectedApplicationId, onNavigate } ) {
	const {
		enforce_auth,
		enforce_rate_limit,
		rate_limit,
		rate_limit_time,
		hide_user_routes,
		hide_batch_routes,
		hide_oembed_routes,
		disabled_methods,
		disabled_post_types,
	} = form;

	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __, sprintf } = wp.i18n || {};
	const [ treeData, setTreeData ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ expandedItems, setExpandedItems ] = useState( [] );

	const [ usersData, setUsersData ] = useState( null );
	const [ usersLoading, setUsersLoading ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ popoverRouteIds, setPopoverRouteIds ] = useState( [] );
	const [ popoverIsBulk, setPopoverIsBulk ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ saving, setSaving ] = useState( false );
	const [ confirmSaveOpen, setConfirmSaveOpen ] = useState( false );
	const [ testRoute, setTestRoute ] = useState( null );
	const usersLoadedRef = useRef( false );
	const treeLoadingRef = useRef( true );

	const loadRoutes = useCallback( async () => {
		setLoading( true );
		usersLoadedRef.current = false;
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_routes_policy_tree',
					nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setTreeData( result.data.tree );
			}
		} catch ( error ) {
			setErrorMessage(
				'Error loading routes:' + JSON.stringify( error )
			);
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce ] );

	useEffect( () => {
		loadRoutes();
	}, [ loadRoutes ] );

	const [ nodes, dispatch ] = useReducer(
		treeReducer,
		treeData || [],
		normalizeTree
	);

	useEffect( () => {
		if ( treeData && Array.isArray( treeData ) ) {
			treeLoadingRef.current = true;
			dispatch( { type: 'RESET', payload: normalizeTree( treeData ) } );
			loadUsers();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ treeData ] );

	const handleToggle = ( id, key, effectiveValues ) =>
		dispatch( { type: 'TOGGLE_NODE', id, key, effectiveValues } );

	const handleOverrideNode = ( id, key, value, effectiveValues ) =>
		dispatch( { type: 'OVERRIDE_NODE', id, key, value, effectiveValues } );

	const handleToggleCustom = ( id, effectiveValues ) =>
		dispatch( { type: 'TOGGLE_CUSTOM', id, effectiveValues } );

	const getNodeById = ( id ) => findNodeById( nodes, id );

	const customCount = countAllCustomNodes( nodes );

	const disabledPostTypeRoutes = ( disabled_post_types || [] ).map(
		( slug ) => {
			const pt = ( adminData?.post_types || [] ).find(
				( p ) => p.value === slug
			);
			return `/wp/v2/${ pt?.rest_base || slug }`;
		}
	);

	const loadUsers = useCallback( async () => {
		if ( usersLoadedRef.current ) {
			return;
		}
		usersLoadedRef.current = true;
		setUsersLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_route_policy_users',
					nonce,
					...( selectedApplicationId ? { application_id: selectedApplicationId } : {} ),
				} ),
			} );
			const result = await response.json();
			setUsersData( result?.success ? result.data.users : [] );
		} catch {
			usersLoadedRef.current = false;
			setUsersData( [] );
		} finally {
			setUsersLoading( false );
		}
	}, [ adminData, nonce, selectedApplicationId ] );

	const handleOpenUsersPopover = useCallback(
		( nodeId, anchorEl ) => {
			loadUsers();
			setPopoverAnchor( anchorEl );
			const node = getNodeById( nodeId );
			if ( node?.isMethod ) {
				setPopoverRouteIds( [ nodeId ] );
				setPopoverIsBulk( false );
			} else {
				setPopoverRouteIds( getAllDescendantMethodIds( node ) );
				setPopoverIsBulk( true );
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ loadUsers, nodes ]
	);

	const handleCloseUsersPopover = () => {
		setPopoverAnchor( null );
		setPopoverRouteIds( [] );
		setPopoverIsBulk( false );
	};

	const handleUserAccessChange = ( userId, routeIds, grant ) => {
		setUsersData( ( prev ) =>
			( prev || [] ).map( ( u ) => {
				if ( u.id !== userId ) {
					return u;
				}
				let routes = [ ...u.related_routes_uuid ];
				for ( const routeId of routeIds ) {
					if ( grant ) {
						if ( ! routes.includes( routeId ) ) {
							routes.push( routeId );
						}
					} else {
						routes = routes.filter( ( r ) => r !== routeId );
					}
				}
				return { ...u, related_routes_uuid: routes };
			} )
		);
	};

	const saveTree = useCallback(
		async ( tree, users ) => {
			setSaving( true );
			try {
				await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded; charset=UTF-8',
					},
					body: new URLSearchParams( {
						action: 'save_routes_policy_tree',
						nonce,
						tree: JSON.stringify( tree ),
						users: JSON.stringify( users || [] ),
						application_id: selectedApplicationId || '',
					} ),
				} );
				setIsDirty( false );
			} catch {
				// Silent fail.
			} finally {
				setSaving( false );
			}
		},
		[ adminData, nonce, selectedApplicationId ]
	);

	useEffect( () => {
		usersLoadedRef.current = false;
		setUsersData( null );
	}, [ selectedApplicationId ] );

	useEffect( () => {
		if ( treeLoadingRef.current ) {
			treeLoadingRef.current = false;
			return;
		}
		setIsDirty( true );
	}, [ nodes, usersData ] );

	if ( loading || ( ! loading && ! treeData ) ) {
		return (
			<Box
				sx={ {
					minHeight: 352,
					minWidth: 250,
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				<Typography variant="body2" color="text.secondary">
					{ loading
						? __( 'Loading routes…', 'rest-api-firewall' )
						: __( 'No routes found', 'rest-api-firewall' ) }
				</Typography>
				{ loading && (
					<LinearProgress
						sx={ { width: '100%', maxWidth: 250 } }
						color="info"
					/>
				) }
			</Box>
		);
	}

	return (
		<Box sx={ { minHeight: 352, minWidth: '100%' } }>
			<Box sx={ { display: testRoute ? 'block' : 'none' } }>
				<TestPolicyPanel
					route={ testRoute?.route || '' }
					method={ testRoute?.method || 'GET' }
					hasChildren={ testRoute?.hasChildren || false }
					hasUsers={ testRoute?.hasUsers || false }
					onClose={ () => setTestRoute( null ) }
					onNavigate={ onNavigate }
				/>
			</Box>

			<Box sx={ { display: testRoute ? 'none' : 'block' } }>

			<Toolbar disableGutters sx={ { gap: 1.5, mb: 2, flexWrap: 'wrap', minHeight: '0 !important' } }>
				<Button
					startIcon={ <RefreshIcon /> }
					size="small"
					onClick={ loadRoutes }
					disabled={ loading }
				>
					{ __( 'Refresh From Server', 'rest-api-firewall' ) }
				</Button>

				<Stack flex={ 1 } />

				<Stack direction="row" alignItems="center" gap={ 1 }>
					{ customCount > 0 && (
						<Chip
							label={ sprintf( __( '%d per-route settings', 'rest-api-firewall' ), customCount ) }
							size="small"
							variant="outlined"
						/>
					) }

					<Button
						startIcon={ <SettingsBackupRestoreOutlinedIcon /> }
						size="small"
						disabled={ customCount === 0 }
						onClick={ () => dispatch( { type: 'RESET_ALL_OVERRIDES' } ) }
					>
						{ __( 'Reset Per-route Settings', 'rest-api-firewall' ) }
					</Button>

					<Button
						variant="contained"
						size="small"
						disableElevation
						disabled={ ! isDirty || saving }
						onClick={ () => setConfirmSaveOpen( true ) }
					>
						{ saving
							? __( 'Saving…', 'rest-api-firewall' )
							: __( 'Save', 'rest-api-firewall' ) }
					</Button>
				</Stack>
			</Toolbar>

			<RichTreeView
				items={ nodes }
				slots={ { item: CustomTreeItem } }
				slotProps={ {
					item: {
						toggleNodeSetting: handleToggle,
						overrideNodeSetting: handleOverrideNode,
						getNodeById,
						openUsersPopover: hasValidLicense
							? handleOpenUsersPopover
							: null,
						toggleNodeCustom: handleToggleCustom,
						enforce_auth,
						enforce_rate_limit,
						rate_limit,
						rate_limit_time,
						hide_user_routes,
						hide_batch_routes,
						hide_oembed_routes,
						disabled_methods: disabled_methods || [],
						disabled_post_type_routes: disabledPostTypeRoutes,
						expandedItems,
						hasValidLicense,
						usersData,
						onNavigate,
						onTest: setTestRoute,
					},
				} }
				expandedItems={ expandedItems }
				onExpandedItemsChange={ ( _e, ids ) => setExpandedItems( ids ) }
			/>

			<RoutesPolicyUsersPopover
				open={ Boolean( popoverAnchor ) }
				anchorEl={ popoverAnchor }
				onClose={ handleCloseUsersPopover }
				usersData={ usersData }
				usersLoading={ usersLoading }
				routeIds={ popoverRouteIds }
				isBulk={ popoverIsBulk }
				onUserAccessChange={ handleUserAccessChange }
			/>

			<Dialog
				open={ confirmSaveOpen }
				onClose={ () => setConfirmSaveOpen( false ) }
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>
					{ __( 'Save Route Policy', 'rest-api-firewall' ) }
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{ __(
							'Changing route policies can break your front-end application. Make sure you have tested your configuration before saving.',
							'rest-api-firewall'
						) }
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={ () => setConfirmSaveOpen( false ) }>
						{ __( 'Cancel', 'rest-api-firewall' ) }
					</Button>
					<Button
						variant="contained"
						size="small"
						disableElevation
						onClick={ () => {
							setConfirmSaveOpen( false );
							saveTree( nodes, usersData );
						} }
					>
						{ __( 'Confirm Save', 'rest-api-firewall' ) }
					</Button>
				</DialogActions>
			</Dialog>

			</Box> { /* end tree toggle Box */ }
		</Box>
	);
}

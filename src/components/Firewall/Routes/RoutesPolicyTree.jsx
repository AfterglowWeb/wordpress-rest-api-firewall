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
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';

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


export default function RoutesPolicyTree( { form, setField } ) {
	const {
		enforce_auth,
		enforce_rate_limit,
		rate_limit,
		rate_limit_time,
		hide_user_routes,
		disabled_methods,
		disabled_post_types,
	} = form;

	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};
	const [ treeData, setTreeData ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ expandedItems, setExpandedItems ] = useState( [] );

	const [ usersData, setUsersData ] = useState( null );
	const [ usersLoading, setUsersLoading ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ popoverRouteIds, setPopoverRouteIds ] = useState( [] );
	const [ popoverIsBulk, setPopoverIsBulk ] = useState( false );
	const usersLoadedRef = useRef( false );
	const treeLoadingRef = useRef( true );
	const saveTimerRef = useRef( null );

	const loadRoutes = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_routes_policy_tree',
					nonce: adminData.nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setTreeData( result.data.tree );
				if ( Array.isArray( result.data.users ) ) {
					setUsersData( result.data.users );
					usersLoadedRef.current = true;
				}
			}
		} catch ( error ) {
			setErrorMessage(
				'Error loading routes:' + JSON.stringify( error )
			);
		} finally {
			setLoading( false );
		}
	}, [ adminData ] );

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
		}
	}, [ treeData ] );

	const handleToggle = ( id, key, effectiveValues ) =>
		dispatch( { type: 'TOGGLE_NODE', id, key, effectiveValues } );

	const handleOverrideNode = ( id, key, value, effectiveValues ) =>
		dispatch( { type: 'OVERRIDE_NODE', id, key, value, effectiveValues } );

	const handleToggleCustom = ( id, effectiveValues ) =>
		dispatch( { type: 'TOGGLE_CUSTOM', id, effectiveValues } );

	const getNodeById = ( id ) => findNodeById( nodes, id );

	const customCount = countAllCustomNodes( nodes );

	// Translate disabled_post_types slugs → /wp/v2/{rest_base} path prefixes.
	// Requires adminData.post_types to include rest_base (added in Utils.php).
	const disabledPostTypeRoutes = ( disabled_post_types || [] )
		.map( ( slug ) => {
			const pt = ( adminData?.post_types || [] ).find(
				( p ) => p.value === slug
			);
			return `/wp/v2/${ pt?.rest_base || slug }`;
		} );

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
					nonce: adminData.nonce,
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
	}, [ adminData ] );

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
				if ( u.id !== userId ) return u;
				let routes = [ ...u.related_routes_uuid ];
				for ( const routeId of routeIds ) {
					if ( grant ) {
						if ( ! routes.includes( routeId ) ) routes.push( routeId );
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
			try {
				await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded; charset=UTF-8',
					},
					body: new URLSearchParams( {
						action: 'save_routes_policy_tree',
						nonce: adminData.nonce,
						tree: JSON.stringify( tree ),
						users: JSON.stringify( users || [] ),
					} ),
				} );
			} catch {
				// Silent fail.
			}
		},
		[ adminData ]
	);

	useEffect( () => {
		if ( treeLoadingRef.current ) {
			treeLoadingRef.current = false;
			return;
		}
		if ( saveTimerRef.current ) {
			clearTimeout( saveTimerRef.current );
		}
		saveTimerRef.current = setTimeout( () => {
			saveTree( nodes, usersData );
		}, 800 );
		return () => {
			if ( saveTimerRef.current ) {
				clearTimeout( saveTimerRef.current );
			}
		};
	}, [ nodes, usersData, saveTree ] );

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
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
			>
				<Stack direction="row" alignItems="center" gap={ 1 }>
					<Typography
						variant="caption"
						sx={ {
							display: 'block',
							textTransform: 'uppercase',
							letterSpacing: 0.5,
							fontSize: '0.75rem',
							color: 'text.secondary',
						} }
					>
						{ __( 'Per-Route Settings', 'rest-api-firewall' ) }
					</Typography>

					{ customCount > 0 && (
						<Chip
							label={ `${ customCount } custom` }
							size="small"
							color="info"
							variant="outlined"
							sx={ { fontSize: '0.65rem', height: 18, px: 0.5 } }
						/>
					) }
				</Stack>

				<Stack direction="row" alignItems="center">
					{ customCount > 0 && (
						<Tooltip
							title={ __(
								'Reset all custom settings',
								'rest-api-firewall'
							) }
							placement="left"
						>
							<IconButton
								onClick={ () =>
									dispatch( { type: 'RESET_ALL_OVERRIDES' } )
								}
							>
								<ReplayIcon />
							</IconButton>
						</Tooltip>
					) }
					<Tooltip
						title={ __( 'Refresh Routes', 'rest-api-firewall' ) }
						placement="left"
					>
						<IconButton onClick={ loadRoutes }>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>

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
						disabled_methods: disabled_methods || [],
						disabled_post_type_routes: disabledPostTypeRoutes,
						expandedItems,
						hasValidLicense,
						usersData,
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
		</Box>
	);
}

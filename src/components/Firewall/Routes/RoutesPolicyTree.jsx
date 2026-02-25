import {
	useState,
	useCallback,
	useReducer,
	forwardRef,
	useEffect,
	useRef,
} from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';

import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem, TreeItemContent } from '@mui/x-tree-view/TreeItem';
import { useTreeItem } from '@mui/x-tree-view/useTreeItem';

import TestPolicy from './TestPolicy';
import CopyButton from '../../CopyButton';

const CustomTreeItem = forwardRef( function CustomTreeItem( props, ref ) {
	const node = props.getNodeById ? props.getNodeById( props.itemId ) : null;

	return (
		<TreeItem
			{ ...props }
			ref={ ref }
			slots={ { content: NodeContent } }
			slotProps={ {
				content: {
					toggleNodeSetting: props.toggleNodeSetting,
					overrideNodeSetting: props.overrideNodeSetting,
					clearNodeOverride: props.clearNodeOverride,
					applyToAllChildren: props.applyToAllChildren,
					getNodeById: props.getNodeById,
					openUsersPopover: props.openUsersPopover,
					node,
					enforce_auth: props.enforce_auth,
					enforce_rate_limit: props.enforce_rate_limit,
					rate_limit: props.rate_limit,
					rate_limit_time: props.rate_limit_time,
					expandedItems: props.expandedItems,
					usersData: props.usersData,
				},
			} }
		/>
	);
} );

export default function RoutesPolicyTree( { form, setField } ) {
	const { enforce_auth, enforce_rate_limit, rate_limit, rate_limit_time } =
		form;

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
	const [ popoverRouteId, setPopoverRouteId ] = useState( null );
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

	const handleToggle = ( id, key ) =>
		dispatch( { type: 'TOGGLE_NODE', id, key } );

	const handleApplyToAll = ( id, shouldApply ) =>
		dispatch( { type: 'APPLY_TO_ALL_DESCENDANTS', id, shouldApply } );

	const handleOverrideNode = ( id, key, value ) =>
		dispatch( { type: 'OVERRIDE_NODE', id, key, value } );

	const handleClearOverride = ( id ) =>
		dispatch( { type: 'CLEAR_OVERRIDE', id } );

	const getNodeById = ( id ) => findNodeById( nodes, id );

	const anyOverrideExists = nodes.some( ( n ) => {
		const s = n.settings || {};
		return (
			isTrulyCustomized( s, enforce_auth, enforce_rate_limit ) ||
			countModifiedDescendants( n, enforce_auth, enforce_rate_limit ) > 0
		);
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
		( routeId, anchorEl ) => {
			loadUsers();
			setPopoverAnchor( anchorEl );
			setPopoverRouteId( routeId );
		},
		[ loadUsers ]
	);

	const handleCloseUsersPopover = () => {
		setPopoverAnchor( null );
		setPopoverRouteId( null );
	};

	const handleUserAccessChange = async ( userId, routeId, grant ) => {
		setUsersData( ( prev ) =>
			( prev || [] ).map( ( u ) => {
				if ( u.id !== userId ) {
					return u;
				}
				const routes = grant
					? [ ...new Set( [ ...u.related_routes_uuid, routeId ] ) ]
					: u.related_routes_uuid.filter( ( r ) => r !== routeId );
				return { ...u, related_routes_uuid: routes };
			} )
		);

		await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action: 'update_route_user_access',
				nonce: adminData.nonce,
				user_id: userId,
				route_id: routeId,
				grant: grant ? '1' : '0',
			} ),
		} );
	};

	const saveTree = useCallback(
		async ( tree ) => {
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
			saveTree( nodes );
		}, 800 );
		return () => {
			if ( saveTimerRef.current ) {
				clearTimeout( saveTimerRef.current );
			}
		};
	}, [ nodes, saveTree ] );

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

				<Stack direction="row" alignItems="center">
					{ anyOverrideExists && (
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
						clearNodeOverride: handleClearOverride,
						applyToAllChildren: handleApplyToAll,
						getNodeById,
						openUsersPopover: hasValidLicense
							? handleOpenUsersPopover
							: null,
						enforce_auth,
						enforce_rate_limit,
						rate_limit,
						rate_limit_time,
						expandedItems,
						hasValidLicense,
						usersData,
					},
				} }
				expandedItems={ expandedItems }
				onExpandedItemsChange={ ( _e, ids ) => setExpandedItems( ids ) }
			/>

			<Popover
				open={ Boolean( popoverAnchor ) }
				anchorEl={ popoverAnchor }
				onClose={ handleCloseUsersPopover }
				anchorOrigin={ { vertical: 'bottom', horizontal: 'left' } }
				transformOrigin={ { vertical: 'top', horizontal: 'left' } }
			>
				<Box sx={ { p: 2, minWidth: 220, maxWidth: 340 } }>
					<Typography
						variant="subtitle2"
						sx={ { mb: 1, fontWeight: 600 } }
					>
						{ __( 'User Access', 'rest-api-firewall' ) }
					</Typography>

					{ usersLoading && (
						<Box
							sx={ {
								display: 'flex',
								justifyContent: 'center',
								py: 1,
							} }
						>
							<CircularProgress size={ 20 } />
						</Box>
					) }

					{ ! usersLoading &&
						usersData !== null &&
						usersData.length === 0 && (
							<Typography variant="body2" color="text.secondary">
								{ __(
									'No users configured for this application.',
									'rest-api-firewall'
								) }
							</Typography>
						) }

					{ ! usersLoading && usersData && usersData.length > 0 && (
						<Stack spacing={ 0 }>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={ { mb: 0.5, fontSize: '0.7rem' } }
							>
								{ __(
									'Check to restrict user access to this route only.',
									'rest-api-firewall'
								) }
							</Typography>
							{ usersData.map( ( user ) => {
								const isChecked =
									user.related_routes_uuid.includes(
										popoverRouteId
									);
								return (
									<FormControlLabel
										key={ user.id }
										control={
											<Checkbox
												size="small"
												checked={ isChecked }
												onChange={ ( e ) =>
													handleUserAccessChange(
														user.id,
														popoverRouteId,
														e.target.checked
													)
												}
												sx={ { py: 0.5 } }
											/>
										}
										label={
											<Typography variant="body2">
												{ user.display_name }
											</Typography>
										}
									/>
								);
							} ) }
						</Stack>
					) }
				</Box>
			</Popover>
		</Box>
	);
}

function NodeContent( {
	children,
	toggleNodeSetting,
	overrideNodeSetting,
	clearNodeOverride,
	applyToAllChildren,
	getNodeById,
	openUsersPopover,
	node,
	enforce_auth,
	enforce_rate_limit,
	rate_limit,
	rate_limit_time,
	expandedItems,
	usersData,
	...props
} ) {
	useTreeItem( props );
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	if ( ! node?.id ) {
		return <TreeItemContent { ...props }>{ children }</TreeItemContent>;
	}

	const nodeSettings = node.settings ?? {
		protect: { value: false, inherited: false, overridden: false },
		disabled: { value: false, inherited: false, overridden: false },
		rate_limit: { value: false, inherited: false, overridden: false },
		rate_limit_time: { value: false, inherited: false, overridden: false },
	};

	const hasChildren = node.children && node.children.length > 0;
	const modifiedCount = countModifiedDescendants(
		node,
		enforce_auth,
		enforce_rate_limit
	);

	const authIsGlobal = !! enforce_auth && ! nodeSettings.protect.overridden;
	const isAuthEnforced = authIsGlobal || nodeSettings.protect.value;

	const rateIsGlobal =
		!! enforce_rate_limit && ! nodeSettings.rate_limit.overridden;
	const isRateLimitEnforced = rateIsGlobal || nodeSettings.rate_limit.value;

	const isDisabled = nodeSettings.disabled.value;

	const effectiveRateLimit = rate_limit;
	const effectiveRateLimitTime = rate_limit_time;

	const userCount = node.isMethod
		? ( usersData || [] ).filter( ( u ) =>
				u.related_routes_uuid.includes( node.id )
		  ).length
		: 0;

	const isCustomized =
		isTrulyCustomized( nodeSettings, enforce_auth, enforce_rate_limit ) ||
		userCount > 0;

	const getDescendantsMatchState = () => {
		if ( ! hasChildren ) {
			return null;
		}

		let allMatch = true;
		let noneMatch = true;

		const checkDescendants = ( childNodes ) => {
			for ( const child of childNodes ) {
				const childMatchesProtect =
					child.settings?.protect?.value ===
					nodeSettings.protect.value;
				const childMatchesDisabled =
					child.settings?.disabled?.value ===
					nodeSettings.disabled.value;
				const childMatchesRateLimit =
					child.settings?.rate_limit?.value ===
					nodeSettings.rate_limit.value;
				const childMatches =
					childMatchesProtect &&
					childMatchesDisabled &&
					childMatchesRateLimit;

				if ( childMatches ) {
					noneMatch = false;
				} else {
					allMatch = false;
				}

				if ( child.children && child.children.length > 0 ) {
					checkDescendants( child.children );
				}
			}
		};

		checkDescendants( node.children );

		if ( allMatch ) {
			return 'all';
		}
		if ( noneMatch ) {
			return 'none';
		}
		return 'partial';
	};

	const descendantsMatchState = getDescendantsMatchState();
	const isApplyToChildrenChecked = nodeSettings.applyToChildren;

	const handleSwitchClick = ( e ) => {
		e.stopPropagation();
	};

	const handleAuthToggle = ( e ) => {
		e.stopPropagation();
		if ( enforce_auth && ! nodeSettings.protect.overridden ) {
			overrideNodeSetting( node.id, 'protect', false );
		} else {
			toggleNodeSetting( node.id, 'protect' );
		}
	};

	const handleRateToggle = ( e ) => {
		e.stopPropagation();
		if ( enforce_rate_limit && ! nodeSettings.rate_limit.overridden ) {
			overrideNodeSetting( node.id, 'rate_limit', false );
		} else {
			toggleNodeSetting( node.id, 'rate_limit' );
		}
	};

	const handleDisableToggle = ( e ) => {
		e.stopPropagation();
		toggleNodeSetting( node.id, 'disabled' );
	};

	const handleApplyToAll = ( e ) => {
		e.stopPropagation();
		const shouldApply = ! isApplyToChildrenChecked;
		applyToAllChildren( node.id, shouldApply );
	};

	const getPermissionColor = ( type ) => {
		switch ( type ) {
			case 'public':
				return 'error';
			case 'protected':
				return 'warning';
			case 'forbidden':
				return 'success';
			case 'authenticated':
				return 'success';
			case 'custom':
				return 'info';
			case 'unknown':
			default:
				return 'default';
		}
	};

	const getEffectivePermission = ( type ) => {
		return isDisabled
			? 'forbidden'
			: isAuthEnforced
			? 'authenticated'
			: type;
	};

	return (
		<TreeItemContent { ...props }>
			<Stack
				direction="row"
				alignItems="center"
				gap={ 0.5 }
				flex={ 1 }
				py={ 1 }
			>
				<Stack direction="column" spacing={ 0.5 }>
					<Stack
						direction="row"
						spacing={ 1 }
						alignItems="center"
						sx={ {
							cursor: isDisabled ? 'default' : 'pointer',
							filter: isDisabled
								? 'grayscale(1) opacity(0.6)'
								: 'none',
						} }
					>
						{ children }

						{ node.permission && (
							<Chip
								label={
									getEffectivePermission(
										node.permission.type
									) || 'unknown'
								}
								size="small"
								variant="outlined"
								color={ getPermissionColor(
									getEffectivePermission(
										node.permission.type
									)
								) }
							/>
						) }

						{ isCustomized && (
							<Chip
								label={ __( 'custom', 'rest-api-firewall' ) }
								size="small"
								variant="outlined"
							/>
						) }

						{ modifiedCount > 0 && (
							<Chip
								label={ `${ modifiedCount } custom` }
								size="small"
								variant="outlined"
							/>
						) }

						{ node.isMethod && node.route && (
							<TestPolicy
								route={ node.route }
								method={ node.method || 'GET' }
								hasChildren={ hasChildren }
							/>
						) }
					</Stack>

					{ node.permission?.callback && (
						<Typography
							variant="caption"
							sx={ {
								color: 'text.secondary',
								fontSize: '0.7rem',
								ml: 4,
							} }
						>
							Permission: { node.permission.callback }
						</Typography>
					) }
				</Stack>
				{ ! node.isMethod && ( node.path || node.route ) && (
					<Tooltip title="Copy path">
						<CopyButton toCopy={ node.path || node.route } />
					</Tooltip>
				) }
			</Stack>

			<Stack
				direction="row"
				spacing={ 1 }
				alignItems="center"
				onClick={ handleSwitchClick }
			>
				{ isCustomized && hasValidLicense && (
					<Tooltip
						title={ __( 'Reset this row', 'rest-api-firewall' ) }
					>
						<IconButton
							size="small"
							onClick={ ( e ) => {
								e.stopPropagation();
								clearNodeOverride( node.id );
							} }
						>
							<ReplayIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				) }

				{ node.isMethod && openUsersPopover && isAuthEnforced && (
					<Button
						size="small"
						variant="text"
						disabled={ isDisabled }
						onClick={ ( e ) => {
							e.stopPropagation();
							openUsersPopover( node.id, e.currentTarget );
						} }
						sx={ { fontSize: '0.75rem', minWidth: 0, px: 1 } }
					>
						{ userCount > 0
							? `${ userCount } user${
									userCount > 1 ? 's' : ''
							  } set`
							: __( 'Set users', 'rest-api-firewall' ) }
					</Button>
				) }

				<Tooltip
					title={
						! hasValidLicense
							? __( 'Pro version required', 'rest-api-firewall' )
							: isDisabled
							? __( 'Route is disabled', 'rest-api-firewall' )
							: authIsGlobal
							? __(
									'Authentication enforced globally. Click to override for this route.',
									'rest-api-firewall'
							  )
							: isAuthEnforced
							? __(
									'Authentication enforced',
									'rest-api-firewall'
							  )
							: __(
									'Enable authentication for this route',
									'rest-api-firewall'
							  )
					}
				>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ isAuthEnforced }
								onChange={ handleAuthToggle }
								disabled={ ! hasValidLicense || isDisabled }
								sx={ {
									opacity:
										isDisabled ||
										authIsGlobal ||
										nodeSettings.protect.inherited ||
										! hasValidLicense
											? 0.6
											: 1,
								} }
							/>
						}
						label={
							<Typography
								variant="body2"
								sx={ { fontSize: '0.875rem' } }
							>
								Auth{ ' ' }
								{ ( authIsGlobal ||
									nodeSettings.protect.inherited ) &&
									'↓' }
							</Typography>
						}
					/>
				</Tooltip>

				<Tooltip
					title={
						! hasValidLicense
							? __( 'Pro version required', 'rest-api-firewall' )
							: isDisabled
							? __( 'Route is disabled', 'rest-api-firewall' )
							: rateIsGlobal
							? __(
									'Rate limiting enforced globally. Click to override for this route.',
									'rest-api-firewall'
							  )
							: isRateLimitEnforced
							? `${ effectiveRateLimit } requests / ${ effectiveRateLimitTime }s`
							: __(
									'Enable rate limiting for this route',
									'rest-api-firewall'
							  )
					}
				>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ isRateLimitEnforced }
								onChange={ handleRateToggle }
								disabled={ ! hasValidLicense || isDisabled }
								sx={ {
									opacity:
										isDisabled ||
										rateIsGlobal ||
										nodeSettings.rate_limit.inherited ||
										! hasValidLicense
											? 0.6
											: 1,
								} }
							/>
						}
						label={
							<Typography
								variant="body2"
								sx={ { fontSize: '0.875rem' } }
							>
								Rate{ ' ' }
								{ ( rateIsGlobal ||
									nodeSettings.rate_limit.inherited ) &&
									'↓' }
							</Typography>
						}
					/>
				</Tooltip>

				<Tooltip
					title={
						! hasValidLicense
							? __( 'Pro version required', 'rest-api-firewall' )
							: isDisabled
							? __(
									'This route is disabled',
									'rest-api-firewall'
							  )
							: __( 'Disable this route', 'rest-api-firewall' )
					}
				>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ nodeSettings.disabled.value }
								onChange={ handleDisableToggle }
								disabled={ ! hasValidLicense }
								sx={ {
									opacity:
										nodeSettings.disabled.inherited ||
										! hasValidLicense
											? 0.6
											: 1,
								} }
							/>
						}
						label={
							<Typography
								variant="body2"
								sx={ { fontSize: '0.875rem' } }
							>
								Disable{ ' ' }
								{ nodeSettings.disabled.inherited && '↓' }
							</Typography>
						}
					/>
				</Tooltip>

				{ hasChildren && (
					<Tooltip
						title={
							! hasValidLicense
								? __(
										'Pro version required',
										'rest-api-firewall'
								  )
								: isApplyToChildrenChecked
								? __(
										'Settings applied to all descendants. Click to unlink.',
										'rest-api-firewall'
								  )
								: descendantsMatchState === 'all'
								? __(
										'All descendants have same settings',
										'rest-api-firewall'
								  )
								: descendantsMatchState === 'partial'
								? __(
										'Some descendants have different settings. Click to apply to all.',
										'rest-api-firewall'
								  )
								: __(
										'Descendants have different settings. Click to apply to all.',
										'rest-api-firewall'
								  )
						}
					>
						<FormControlLabel
							control={
								<Checkbox
									size="small"
									checked={ isApplyToChildrenChecked }
									indeterminate={
										! isApplyToChildrenChecked &&
										descendantsMatchState === 'partial'
									}
									onChange={ handleApplyToAll }
									disabled={ ! hasValidLicense }
									sx={ { py: 0 } }
								/>
							}
							label={
								<Typography
									variant="body2"
									sx={ { fontSize: '0.75rem' } }
								>
									{ __(
										'Apply to children',
										'rest-api-firewall'
									) }
								</Typography>
							}
						/>
					</Tooltip>
				) }
			</Stack>
		</TreeItemContent>
	);
}

function normalizeTree( nodes, parentPath = '', parentSettings = null ) {
	if ( ! nodes || ! Array.isArray( nodes ) ) {
		return [];
	}

	const normalized = nodes.map( ( node ) => {
		const nodePath = node.path || `${ parentPath }/${ node.label }`;
		const nodeSettings = {
			protect: {
				value: false,
				inherited: parentSettings?.protect?.value ?? false,
				overridden: false,
			},
			disabled: {
				value: false,
				inherited: parentSettings?.disabled?.value ?? false,
				overridden: false,
			},
			rate_limit: {
				value: false,
				inherited: parentSettings?.rate_limit?.value ?? false,
				overridden: false,
			},
			rate_limit_time: {
				value: false,
				inherited: parentSettings?.rate_limit_time?.value ?? false,
				overridden: false,
			},
			applyToChildren: false,
		};

		if ( node.settings ) {
			if ( node.settings.protect !== undefined ) {
				nodeSettings.protect = {
					value: !! node.settings.protect,
					inherited: false,
					overridden: !! (
						node.settings.protect_overridden ?? false
					),
				};
			}
			if ( node.settings.disabled !== undefined ) {
				nodeSettings.disabled = {
					value: !! node.settings.disabled,
					inherited: false,
					overridden: !! (
						node.settings.disabled_overridden ?? false
					),
				};
			}
			if ( node.settings.rate_limit !== undefined ) {
				nodeSettings.rate_limit = {
					value: !! node.settings.rate_limit,
					inherited: false,
					overridden: !! (
						node.settings.rate_limit_overridden ?? false
					),
				};
			}
			if ( node.settings.rate_limit_time !== undefined ) {
				nodeSettings.rate_limit_time = {
					value: !! node.settings.rate_limit_time,
					inherited: false,
					overridden: false,
				};
			}
			if ( node.settings.applyToChildren !== undefined ) {
				nodeSettings.applyToChildren = node.settings.applyToChildren;
			}
		}

		const normalizedNode = {
			id: node.id ?? node.uuid ?? crypto.randomUUID(),
			label: node.label,
			path: nodePath,
			settings: nodeSettings,
			permission: node.permission,
			isMethod: node.isMethod ?? false,
			method: node.method,
			route: node.route,
			params: node.params,
			children: [],
		};

		if ( node.children && node.children.length > 0 ) {
			normalizedNode.children = normalizeTree(
				node.children,
				nodePath,
				nodeSettings
			);
		}

		return normalizedNode;
	} );

	if ( parentSettings === null ) {
		return rehydrateApplyToChildren( normalized );
	}
	return normalized;
}

function rehydrateApplyToChildren( nodes ) {
	return nodes.map( ( node ) => {
		const updated = { ...node };
		if ( updated.settings?.applyToChildren && updated.children?.length ) {
			for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
				updated.children = propagateToDescendants(
					updated.children,
					key,
					updated.settings[ key ].value
				);
			}
		}
		if ( updated.children?.length ) {
			updated.children = rehydrateApplyToChildren( updated.children );
		}
		return updated;
	} );
}

function treeReducer( state, action ) {
	switch ( action.type ) {
		case 'TOGGLE_NODE':
			return toggleNode( state, action.id, action.key );
		case 'OVERRIDE_NODE':
			return overrideNode( state, action.id, action.key, action.value );
		case 'CLEAR_OVERRIDE':
			return clearOverride( state, action.id );
		case 'RESET_ALL_OVERRIDES':
			return resetAllOverrides( state );
		case 'APPLY_TO_ALL_DESCENDANTS':
			return applyToAllDescendants(
				state,
				action.id,
				action.shouldApply
			);
		case 'RESET':
			return action.payload;
		default:
			return state;
	}
}

function toggleNode( items, id, key ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const newValue = ! item.settings[ key ].value;
			const updated = {
				...item,
				settings: {
					...item.settings,
					[ key ]: {
						value: newValue,
						inherited: false,
						overridden: true,
					},
				},
			};
			if (
				updated.settings.applyToChildren &&
				updated.children?.length
			) {
				updated.children = propagateToDescendants(
					updated.children,
					key,
					newValue
				);
			}
			return updated;
		}
		if ( item.children ) {
			return { ...item, children: toggleNode( item.children, id, key ) };
		}
		return item;
	} );
}

function overrideNode( items, id, key, value ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const updated = {
				...item,
				settings: {
					...item.settings,
					[ key ]: {
						value,
						inherited: false,
						overridden: true,
					},
				},
			};
			if (
				updated.settings.applyToChildren &&
				updated.children?.length
			) {
				updated.children = propagateToDescendants(
					updated.children,
					key,
					value
				);
			}
			return updated;
		}
		if ( item.children ) {
			return {
				...item,
				children: overrideNode( item.children, id, key, value ),
			};
		}
		return item;
	} );
}

function clearOverride( items, id ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const newSettings = { ...item.settings };
			for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
				if ( newSettings[ key ] ) {
					newSettings[ key ] = {
						...newSettings[ key ],
						overridden: false,
					};
				}
			}
			return { ...item, settings: newSettings };
		}
		if ( item.children ) {
			return {
				...item,
				children: clearOverride( item.children, id ),
			};
		}
		return item;
	} );
}

function resetAllOverrides( items ) {
	return items.map( ( item ) => {
		const newSettings = { ...item.settings };
		for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
			if ( newSettings[ key ] ) {
				newSettings[ key ] = {
					...newSettings[ key ],
					overridden: false,
				};
			}
		}
		return {
			...item,
			settings: newSettings,
			children: item.children ? resetAllOverrides( item.children ) : [],
		};
	} );
}

function applyToAllDescendants( items, parentId, shouldApply ) {
	return items.map( ( item ) => {
		if ( item.id === parentId ) {
			const updated = {
				...item,
				settings: {
					...item.settings,
					applyToChildren: shouldApply,
				},
			};
			if ( shouldApply && updated.children?.length ) {
				for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
					updated.children = propagateToDescendants(
						updated.children,
						key,
						updated.settings[ key ].value
					);
				}
			}
			return updated;
		}
		if ( item.children ) {
			return {
				...item,
				children: applyToAllDescendants(
					item.children,
					parentId,
					shouldApply
				),
			};
		}
		return item;
	} );
}

function propagateToDescendants( children, key, value ) {
	return ( children || [] ).map( ( child ) => {
		const updated = {
			...child,
			settings: {
				...child.settings,
				[ key ]: {
					value,
					inherited: true,
					overridden: child.settings?.[ key ]?.overridden ?? false,
				},
			},
		};
		if ( updated.children?.length ) {
			updated.children = propagateToDescendants(
				updated.children,
				key,
				value
			);
		}
		return updated;
	} );
}

function isTrulyCustomized( settings, enforceAuth, enforceRateLimit ) {
	const isProtectCustomized =
		settings.protect?.overridden &&
		settings.protect.value !== !! enforceAuth;
	const isRateCustomized =
		settings.rate_limit?.overridden &&
		settings.rate_limit.value !== !! enforceRateLimit;
	const isDisabledCustomized =
		settings.disabled?.overridden && settings.disabled.value !== false;
	return isProtectCustomized || isRateCustomized || isDisabledCustomized;
}

function countModifiedDescendants( node, enforceAuth, enforceRateLimit ) {
	let count = 0;
	for ( const child of node.children || [] ) {
		if (
			isTrulyCustomized(
				child.settings || {},
				enforceAuth,
				enforceRateLimit
			)
		) {
			count++;
		}
		count += countModifiedDescendants(
			child,
			enforceAuth,
			enforceRateLimit
		);
	}
	return count;
}

function findNodeById( items, id ) {
	for ( const item of items ) {
		if ( item.id === id ) {
			return item;
		}
		if ( item.children ) {
			const found = findNodeById( item.children, id );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}

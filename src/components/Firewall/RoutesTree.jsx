import { useReducer, forwardRef, useMemo, useEffect } from '@wordpress/element';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem, TreeItemContent } from '@mui/x-tree-view/TreeItem';
import { useTreeItem } from '@mui/x-tree-view/useTreeItem';

import TestPolicy from './TestPolicy';
import CopyButton from '../CopyButton';

function normalizeTree( nodes, parentPath = '', parentSettings = null ) {
	if ( ! nodes || ! Array.isArray( nodes ) ) {
		return [];
	}

	return nodes.map( ( node ) => {
		const nodePath = node.path || `${ parentPath }/${ node.label }`;
		const nodeSettings = {
			protect: {
				value: false,
				inherited: parentSettings?.protect?.value ?? false,
			},
			disabled: {
				value: false,
				inherited: parentSettings?.disabled?.value ?? false,
			},
			rate_limit: {
				value: false,
				inherited: parentSettings?.rate_limit?.value ?? false,
			},
			rate_limit_time: {
				value: false,
				inherited: parentSettings?.rate_limit_time?.value ?? false,
			},
			applyToChildren: false,
		};

		if ( node.settings ) {
			if ( node.settings.protect !== undefined ) {
				nodeSettings.protect = {
					value: node.settings.protect,
					inherited: false,
				};
			}
			if ( node.settings.disabled !== undefined ) {
				nodeSettings.disabled = {
					value: node.settings.disabled,
					inherited: false,
				};
			}
			if ( node.settings.rate_limit !== undefined ) {
				nodeSettings.rate_limit = {
					value: node.settings.rate_limit,
					inherited: false,
				};
			}
			if ( node.settings.rate_limit_time !== undefined ) {
				nodeSettings.rate_limit_time = {
					value: node.settings.rate_limit_time,
					inherited: false,
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
}

function NodeContent( {
	children,
	toggleNodeSetting,
	applyToAllChildren,
	getNodeById,
	node,
	enforceAuth,
	enforceRateLimit,
	enforceDisabled,
	globalRateLimit,
	globalRateLimitTime,
	proActive = true,
	...props
} ) {
	useTreeItem( props );
	const { __ } = wp.i18n || {};

	if ( ! node?.id ) {
		return <TreeItemContent { ...props }>{ children }</TreeItemContent>;
	}

	const nodeSettings = node.settings ?? {
		protect: { value: false, inherited: false },
		disabled: { value: false, inherited: false },
		rate_limit: { value: false, inherited: false },
		rate_limit_time: { value: false, inherited: false },
	};

	const hasChildren = node.children && node.children.length > 0;

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

	const handleToggle = ( key ) => ( e ) => {
		e.stopPropagation();
		toggleNodeSetting( node.id, key );
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

	const isAuthEnforced = enforceAuth || nodeSettings.protect.value;
	const isRateLimitEnforced =
		enforceRateLimit || nodeSettings.rate_limit.value;
	const isDisabled = enforceDisabled || nodeSettings.disabled.value;
	const effectiveRateLimit = nodeSettings.rate_limit.value || globalRateLimit;
	const effectiveRateLimitTime =
		nodeSettings.rate_limit_time.value || globalRateLimitTime;

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

						{ node.isMethod && (
							<Chip
								label={ node.method || node.label }
								size="small"
								sx={ { ml: 1 } }
								color={
									node.method === 'GET'
										? 'success'
										: node.method === 'POST'
										? 'warning'
										: node.method === 'PUT'
										? 'error'
										: node.method === 'DELETE'
										? 'error'
										: 'default'
								}
							/>
						) }

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
				<Tooltip
					title={
						! proActive
							? __( 'Pro version required', 'rest-api-firewall' )
							: enforceRateLimit
							? __(
									'Authentication enforced globally',
									'rest-api-firewall'
							  )
							: isAuthEnforced
							? `Authentication enforced`
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
								onChange={ handleToggle( 'protect' ) }
								disabled={ enforceAuth || ! proActive }
								sx={ {
									opacity:
										enforceAuth ||
										nodeSettings.protect.inherited ||
										! proActive
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
								{ ( enforceAuth ||
									nodeSettings.protect.inherited ) &&
									'↓' }
							</Typography>
						}
					/>
				</Tooltip>

				<Tooltip
					title={
						! proActive
							? __( 'Pro version required', 'rest-api-firewall' )
							: enforceRateLimit
							? __(
									'Rate limiting enforced globally',
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
								onChange={ handleToggle( 'rate_limit' ) }
								disabled={ enforceRateLimit || ! proActive }
								sx={ {
									opacity:
										enforceRateLimit ||
										nodeSettings.rate_limit.inherited ||
										! proActive
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
								{ ( enforceRateLimit ||
									nodeSettings.rate_limit.inherited ) &&
									'↓' }
							</Typography>
						}
					/>
				</Tooltip>

				<Tooltip
					title={
						! proActive
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
								onChange={ handleToggle( 'disabled' ) }
								disabled={ ! proActive }
								sx={ {
									opacity:
										nodeSettings.disabled.inherited ||
										! proActive
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
							! proActive
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
									disabled={ ! proActive }
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
					applyToAllChildren: props.applyToAllChildren,
					getNodeById: props.getNodeById,
					node,
					enforceAuth: props.enforceAuth,
					enforceRateLimit: props.enforceRateLimit,
					enforceDisabled: props.disabled,
					globalRateLimit: props.globalRateLimit,
					globalRateLimitTime: props.globalRateLimitTime,
					proActive: props.proActive,
				},
			} }
		/>
	);
} );

function treeReducer( state, action ) {
	switch ( action.type ) {
		case 'TOGGLE_NODE':
			return toggleNode( state, action.id, action.key );
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
			return {
				...item,
				settings: {
					...item.settings,
					[ key ]: {
						value: ! item.settings[ key ].value,
						inherited: false,
					},
				},
			};
		}
		if ( item.children ) {
			return { ...item, children: toggleNode( item.children, id, key ) };
		}
		return item;
	} );
}

function applyToAllDescendants( items, parentId, shouldApply ) {
	return items.map( ( item ) => {
		if ( item.id === parentId ) {
			const parentSettings = item.settings;

			const updateDescendants = ( children, applySettings ) => {
				return ( children || [] ).map( ( child ) => {
					const hasGrandchildren =
						child.children && child.children.length > 0;

					if ( applySettings ) {
						return {
							...child,
							settings: {
								protect: {
									value: parentSettings.protect.value,
									inherited: false,
								},
								disabled: {
									value: parentSettings.disabled.value,
									inherited: false,
								},
								rate_limit: {
									value: parentSettings.rate_limit.value,
									inherited: false,
								},
								rate_limit_time: {
									value: parentSettings.rate_limit_time.value,
									inherited: false,
								},
								applyToChildren: hasGrandchildren,
							},
							children: updateDescendants( child.children, true ),
						};
					}
					return {
						...child,
						settings: {
							...child.settings,
							applyToChildren: false,
						},
						children: updateDescendants( child.children, false ),
					};
				} );
			};

			return {
				...item,
				settings: {
					...item.settings,
					applyToChildren: shouldApply,
				},
				children: updateDescendants( item.children, shouldApply ),
			};
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

export default function RoutesTree( {
	treeData = [],
	onSettingsChange,
	enforceAuth = false,
	enforceRateLimit = false,
	enforceDisabled = false,
	globalRateLimit = 30,
	globalRateLimitTime = 60,
	proActive = true,
} ) {
	const [ nodes, dispatch ] = useReducer(
		treeReducer,
		treeData || [],
		normalizeTree
	);
	const { __ } = wp.i18n || {};

	useEffect( () => {
		if ( treeData && Array.isArray( treeData ) ) {
			dispatch( { type: 'RESET', payload: normalizeTree( treeData ) } );
		}
	}, [ treeData ] );

	const handleToggle = ( id, key ) => {
		dispatch( { type: 'TOGGLE_NODE', id, key } );
	};

	const handleApplyToAll = ( id, shouldApply ) => {
		dispatch( { type: 'APPLY_TO_ALL_DESCENDANTS', id, shouldApply } );
	};

	const getNodeById = ( id ) => findNodeById( nodes, id );

	useMemo( () => {
		if ( onSettingsChange ) {
			onSettingsChange( nodes );
		}
	}, [ nodes, onSettingsChange ] );

	if ( ! treeData || treeData.length === 0 ) {
		return (
			<Box
				sx={ {
					minHeight: 352,
					minWidth: 250,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				<Typography variant="body2" color="text.secondary">
					{ treeData === null
						? __( 'Loading routes…', 'rest-api-firewall' )
						: __( 'No routes found', 'rest-api-firewall' ) }
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={ { minHeight: 352, minWidth: '100%' } }>
			<RichTreeView
				items={ nodes }
				slots={ { item: CustomTreeItem } }
				slotProps={ {
					item: {
						toggleNodeSetting: handleToggle,
						applyToAllChildren: handleApplyToAll,
						getNodeById,
						enforceAuth,
						enforceRateLimit,
						enforceDisabled,
						globalRateLimit,
						globalRateLimitTime,
						proActive,
					},
				} }
			/>
		</Box>
	);
}

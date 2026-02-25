import { forwardRef } from '@wordpress/element';
import { useLicense } from '../../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ReplayIcon from '@mui/icons-material/Replay';

import { TreeItem, TreeItemContent } from '@mui/x-tree-view/TreeItem';
import { useTreeItem } from '@mui/x-tree-view/useTreeItem';

import TestPolicy from './TestPolicy';
import CopyButton from '../../CopyButton';
import {
	isTrulyCustomized,
	countModifiedDescendants,
	getAllDescendantMethodIds,
} from './routesPolicyUtils';

export const CustomTreeItem = forwardRef( function CustomTreeItem( props, ref ) {
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

export function NodeContent( {
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
	const modifiedCount = countModifiedDescendants( node, enforce_auth, enforce_rate_limit );

	const authIsGlobal = !! enforce_auth && ! nodeSettings.protect.overridden;
	const isAuthEnforced = authIsGlobal || nodeSettings.protect.value;

	const rateIsGlobal = !! enforce_rate_limit && ! nodeSettings.rate_limit.overridden;
	const isRateLimitEnforced = rateIsGlobal || nodeSettings.rate_limit.value;

	const isDisabled = nodeSettings.disabled.value;

	const effectiveRateLimit = rate_limit;
	const effectiveRateLimitTime = rate_limit_time;

	const ownUserCount = node.isMethod
		? ( usersData || [] ).filter( ( u ) =>
				u.related_routes_uuid.includes( node.id )
		  ).length
		: 0;

	const buttonUserCount = node.isMethod
		? ownUserCount
		: ( usersData || [] ).filter( ( u ) =>
				getAllDescendantMethodIds( node ).some( ( id ) =>
					u.related_routes_uuid.includes( id )
				)
		  ).length;


	const isCustomized =
		isTrulyCustomized( nodeSettings, enforce_auth, enforce_rate_limit ) ||
		ownUserCount > 0;

	const getDescendantsMatchState = () => {
		if ( ! hasChildren ) {
			return null;
		}
		let allMatch = true;
		let noneMatch = true;
		const checkDescendants = ( childNodes ) => {
			for ( const child of childNodes ) {
				const childMatches =
					child.settings?.protect?.value === nodeSettings.protect.value &&
					child.settings?.disabled?.value === nodeSettings.disabled.value &&
					child.settings?.rate_limit?.value === nodeSettings.rate_limit.value;

				if ( childMatches ) {
					noneMatch = false;
				} else {
					allMatch = false;
				}
				if ( child.children?.length ) {
					checkDescendants( child.children );
				}
			}
		};
		checkDescendants( node.children );
		if ( allMatch ) return 'all';
		if ( noneMatch ) return 'none';
		return 'partial';
	};

	const descendantsMatchState = getDescendantsMatchState();
	const isApplyToChildrenChecked = nodeSettings.applyToChildren;

	const handleSwitchClick = ( e ) => e.stopPropagation();

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
		applyToAllChildren( node.id, ! isApplyToChildrenChecked );
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
			default:
				return 'default';
		}
	};

	const getEffectivePermission = ( type ) =>
		isDisabled ? 'forbidden' : isAuthEnforced ? 'authenticated' : type;

	return (
		<TreeItemContent
			{ ...props }
			sx={ {
				...( props.sx || {} ),
				bgcolor: isCustomized
					? 'rgba(76, 175, 80, 0.07)'
					: 'transparent',
				borderRadius: 1,
			} }
		>
			<Stack direction="row" alignItems="center" gap={ 0.5 } flex={ 1 } py={ 1 }>
				<Stack direction="column" spacing={ 0.5 }>
					<Stack
						direction="row"
						spacing={ 1 }
						alignItems="center"
						sx={ {
							cursor: isDisabled ? 'default' : 'pointer',
							filter: isDisabled ? 'grayscale(1) opacity(0.6)' : 'none',
						} }
					>
						{ children }

						{ node.permission && (
							<Chip
								label={
									getEffectivePermission( node.permission.type ) ||
									'unknown'
								}
								size="small"
								variant="outlined"
								color={ getPermissionColor(
									getEffectivePermission( node.permission.type )
								) }
							/>
						) }

{ modifiedCount > 0 && (
						<Box
							component="span"
							sx={ {
								bgcolor: 'success.main',
								color: '#fff',
								borderRadius: '50%',
								minWidth: 18,
								height: 18,
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.65rem',
								fontWeight: 700,
								lineHeight: 1,
								px: 0.3,
								flexShrink: 0,
							} }
						>
							{ modifiedCount }
						</Box>
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
					<Tooltip title={ __( 'Reset this row', 'rest-api-firewall' ) }>
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

				{ openUsersPopover && isAuthEnforced && (
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
						{ buttonUserCount > 0
							? `${ buttonUserCount } user${
									buttonUserCount > 1 ? 's' : ''
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
							? __( 'Authentication enforced', 'rest-api-firewall' )
							: __( 'Enable authentication for this route', 'rest-api-firewall' )
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
							<Typography variant="body2" sx={ { fontSize: '0.875rem' } }>
								Auth{ ' ' }
								{ ( authIsGlobal || nodeSettings.protect.inherited ) && '↓' }
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
							: __( 'Enable rate limiting for this route', 'rest-api-firewall' )
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
							<Typography variant="body2" sx={ { fontSize: '0.875rem' } }>
								Rate{ ' ' }
								{ ( rateIsGlobal || nodeSettings.rate_limit.inherited ) && '↓' }
							</Typography>
						}
					/>
				</Tooltip>

				<Tooltip
					title={
						! hasValidLicense
							? __( 'Pro version required', 'rest-api-firewall' )
							: isDisabled
							? __( 'This route is disabled', 'rest-api-firewall' )
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
										nodeSettings.disabled.inherited || ! hasValidLicense
											? 0.6
											: 1,
								} }
							/>
						}
						label={
							<Typography variant="body2" sx={ { fontSize: '0.875rem' } }>
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
								? __( 'Pro version required', 'rest-api-firewall' )
								: isApplyToChildrenChecked
								? __(
										'Settings applied to all descendants. Click to unlink.',
										'rest-api-firewall'
								  )
								: descendantsMatchState === 'all'
								? __( 'All descendants have same settings', 'rest-api-firewall' )
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
								<Typography variant="body2" sx={ { fontSize: '0.75rem' } }>
									{ __( 'Apply to children', 'rest-api-firewall' ) }
								</Typography>
							}
						/>
					</Tooltip>
				) }
			</Stack>
		</TreeItemContent>
	);
}

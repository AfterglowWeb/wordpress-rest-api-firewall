import { forwardRef } from '@wordpress/element';
import { useLicense } from '../../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { TreeItem, TreeItemContent } from '@mui/x-tree-view/TreeItem';
import { useTreeItem } from '@mui/x-tree-view/useTreeItem';

import TestPolicy from './TestPolicy';
import CopyButton from '../../CopyButton';
import {
	isNodeCustom,
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
					getNodeById: props.getNodeById,
					openUsersPopover: props.openUsersPopover,
					toggleNodeCustom: props.toggleNodeCustom,
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
	getNodeById,
	openUsersPopover,
	toggleNodeCustom,
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
	const modifiedCount = countModifiedDescendants( node );

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

	const isCustom = isNodeCustom( nodeSettings );

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
			} }
		>
			<Stack direction="row" alignItems="center" gap={ 0.5 } flex={ 1 } py={ 1 }>
				<Stack direction="column" spacing={ 0.5 }>
					<Stack
						direction="row"
						spacing={ 1 }
						alignItems="center"
						sx={ {
							cursor: isDisabled && node.isMethod ? 'default' : 'pointer',
							filter: isDisabled && node.isMethod ? 'grayscale(1) opacity(0.6)' : 'none',
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
								width: 18,
								height: 18,
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.65rem',
								fontWeight: 700,
								lineHeight: 1,
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
<Tooltip
				title={
					isCustom
						? __( 'Custom settings active — click to reset to inherited', 'rest-api-firewall' )
						: __( 'Click to define custom settings for this row', 'rest-api-firewall' )
				}
			>
				<IconButton
					size="small"
					onClick={ ( e ) => {
						e.stopPropagation();
						toggleNodeCustom( node.id, {
							protect: isAuthEnforced,
							rate_limit: isRateLimitEnforced,
							disabled: isDisabled,
						} );
					} }
					sx={ {
						opacity: isCustom ? 1 : 0.35,
						color: isCustom ? 'primary.main' : 'inherit',
					} }
				>
					<SettingsOutlinedIcon fontSize="small" />
				</IconButton>
			</Tooltip>

				{ openUsersPopover && isAuthEnforced && (
					<Button
						size="small"
						variant="text"
						disabled={ isDisabled && node.isMethod }
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
							: isDisabled && node.isMethod
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
								disabled={ ! hasValidLicense || ( isDisabled && node.isMethod ) }
								sx={ {
									opacity:
										isDisabled && node.isMethod ||
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
							: isDisabled && node.isMethod
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
								disabled={ ! hasValidLicense || ( isDisabled && node.isMethod ) }
								sx={ {
									opacity:
										isDisabled && node.isMethod ||
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


			</Stack>
		</TreeItemContent>
	);
}

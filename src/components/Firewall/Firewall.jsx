import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';

import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import RoutesTree from './RoutesTree';
import IpBlackList from './IpBlackList';
import ProBadge from '../ProBadge';
import RateLimit from './RateLimit';
import RestApiUser from './RestApUser';
import Card from '@mui/material/Card';

const defaultFirewallOptions = {
	enforce_auth: false,
	enforce_rate_limit: false,
	hide_user_routes: false,
	user_id: 0,
	rate_limit: 200,
	rate_limit_time: 60,
	rate_limit_release: 300,
	rate_limit_blacklist: 5,
	rate_limit_blacklist_time: 3600,
};

export default function Firewall() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const [ restRoutes, setRestRoutes ] = useState( null );
	const [ treeState, setTreeState ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ firewallOptions, setFirewallOptions ] = useState(
		defaultFirewallOptions
	);
	const [ users, setUsers ] = useState( [] );
	const [ restApiUser, setRestApiUser ] = useState( [] );
	const [ proActive, setProActive ] = useState( true );

	const { openDialog, updateDialog } = useDialog();

	const minDelay = ( ms ) =>
		new Promise( ( resolve ) => setTimeout( resolve, ms ) );

	useEffect( () => {
		if ( Array.isArray( adminData?.users ) ) {
			setUsers( adminData.users );
		}
	}, [ adminData ] );

	useEffect( () => {
		if ( firewallOptions.user_id && users ) {
			const currentUser = users.filter(
				( user ) => firewallOptions.user_id === user.value
			);
			if ( currentUser && currentUser.length > 0 ) {
				setRestApiUser( currentUser[ 0 ] );
			}
		}
	}, [ users, firewallOptions.user_id ] );

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
				setRestRoutes( result.data.tree );
				setProActive( result.data.pro_active ?? true );
			}
		} catch ( error ) {
			console.error( 'Error loading routes:', error );
		} finally {
			setLoading( false );
		}
	}, [ adminData ] );

	const loadFirewallOptions = useCallback( async () => {
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_firewall_options',
					nonce: adminData.nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setFirewallOptions( {
					enforce_auth: result.data.enforce_auth ?? false,
					enforce_rate_limit: result.data.enforce_rate_limit ?? false,
					hide_user_routes: result.data.hide_user_routes ?? false,
					user_id: result.data.user_id ?? 0,
					rate_limit: result.data.rate_limit ?? 200,
					rate_limit_time: result.data.rate_limit_time ?? 60,
					rate_limit_release: result.data.rate_limit_release ?? 300,
					rate_limit_blacklist: result.data.rate_limit_blacklist ?? 5,
					rate_limit_blacklist_time:
						result.data.rate_limit_blacklist_time ?? 3600,
				} );
			}
		} catch ( error ) {
			console.error( 'Error loading firewall options:', error );
		}
	}, [ adminData ] );

	useEffect( () => {
		loadRoutes();
		loadFirewallOptions();
	}, [ loadRoutes, loadFirewallOptions ] );

	const handleTreeChange = ( updatedNodes ) => {
		setTreeState( updatedNodes );
	};

	const handleOptionChange = ( e ) => {
		const { name, value, type, checked } = e.target;
		setFirewallOptions( ( prev ) => ( {
			...prev,
			[ name ]: type === 'checkbox' ? checked : value,
		} ) );
	};

	const handleSave = () => {
		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: __( 'Confirm Save', 'rest-api-firewall' ),
			content: __(
				'Are you sure you want to save these firewall settings?',
				'rest-api-firewall'
			),
			onConfirm: async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Saving…', 'rest-api-firewall' ),
				} );

				try {
					// Save both options and policy in parallel
					const [ optionsResponse, policyResponse ] =
						await Promise.all( [
							fetch( adminData.ajaxurl, {
								method: 'POST',
								headers: {
									'Content-Type':
										'application/x-www-form-urlencoded; charset=UTF-8',
								},
								body: new URLSearchParams( {
									action: 'save_firewall_options',
									nonce: adminData.nonce,
									data: JSON.stringify( {
										enforce_auth:
											firewallOptions.enforce_auth
												? '1'
												: '0',
										enforce_rate_limit:
											firewallOptions.enforce_rate_limit
												? '1'
												: '0',
										hide_user_routes:
											firewallOptions.hide_user_routes
												? '1'
												: '0',
										user_id: String(
											firewallOptions.user_id
										),
										rate_limit: String(
											firewallOptions.rate_limit
										),
										rate_limit_time: String(
											firewallOptions.rate_limit_time
										),
										rate_limit_release: String(
											firewallOptions.rate_limit_release
										),
										rate_limit_blacklist: String(
											firewallOptions.rate_limit_blacklist
										),
										rate_limit_blacklist_time: String(
											firewallOptions.rate_limit_blacklist_time
										),
									} ),
								} ),
							} ),
							treeState
								? fetch( adminData.ajaxurl, {
										method: 'POST',
										headers: {
											'Content-Type':
												'application/x-www-form-urlencoded; charset=UTF-8',
										},
										body: new URLSearchParams( {
											action: 'save_routes_policy_tree',
											nonce: adminData.nonce,
											tree: JSON.stringify( treeState ),
										} ),
								  } )
								: Promise.resolve( {
										json: () => ( { success: true } ),
								  } ),
							minDelay( 400 ),
						] );

					const optionsResult = await optionsResponse.json();
					const policyResult = await policyResponse.json();

					if (
						! policyResult?.success &&
						policyResult?.data?.pro_required
					) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: __(
								'Global Settings Saved',
								'rest-api-firewall'
							),
							content: __(
								'Global settings saved successfully. Go Pro to block and fine tune.',
								'rest-api-firewall'
							),
						} );
						return;
					}

					if ( optionsResult?.success && policyResult?.success ) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: __(
								'Firewall Settings Saved',
								'rest-api-firewall'
							),
							content: __(
								'Per-route policies saved successfully',
								'rest-api-firewall'
							),
							autoClose: 2000,
						} );
						await loadRoutes();
					} else {
						const errorMessage =
							optionsResult?.data?.message ||
							policyResult?.data?.message ||
							'Unknown error';
						updateDialog( {
							type: DIALOG_TYPES.ERROR,
							title: __( 'Error', 'rest-api-firewall' ),
							content:
								__(
									'Failed to save settings:',
									'rest-api-firewall'
								) + errorMessage,
						} );
					}
				} catch ( error ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content:
							__(
								'Error saving settings:',
								'rest-api-firewall'
							) + error.message,
					} );
				}
			},
		} );
	};

	return (
		<Stack spacing={ 3 }>
			<Grid spacing={ 4 } container>
				<Grid size={ { xs: 12, xl: 7 } } spacing={ 3 }>
					<Card variant="outlined" sx={ { p: 2, mb: 3 } }>
						<Stack
							direction={ 'row' }
							justifyContent={ 'space-between' }
							gap={ 2 }
							flexWrap={ 'wrap' }
							alignItems={ 'center' }
						>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __(
									'User and Rate Limiting',
									'rest-api-firewall'
								) }
							</Typography>
							<Button
								disableElevation
								size="small"
								color="primary"
								variant="contained"
								onClick={ handleSave }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						</Stack>
						<RestApiUser
							firewallOptions={ firewallOptions }
							handleOptionChange={ handleOptionChange }
							users={ users }
							restApiUser={ restApiUser }
						/>
						<Divider sx={ { my: 3 } } />
						<RateLimit
							firewallOptions={ firewallOptions }
							handleOptionChange={ handleOptionChange }
						/>
					</Card>
				</Grid>

				<Grid size={ { xs: 12, xl: 5 } }>
					<Card variant="outlined" sx={ { p: 2, mb: 3 } }>
						<IpBlackList />
					</Card>
				</Grid>
			</Grid>

			<Divider />

			<Typography
				variant="subtitle1"
				fontWeight={ 600 }
				sx={ { mb: 2, position: 'relative' } }
			>
				<span>{ __( 'Per Route Settings', 'rest-api-firewall' ) }</span>
				<Tooltip
					title={ __(
						'Refresh routes from server',
						'rest-api-firewall'
					) }
				>
					<IconButton
						onClick={ loadRoutes }
						disabled={ loading }
						size="small"
					>
						<RefreshIcon />
					</IconButton>
				</Tooltip>
				<ProBadge position={ 'right' } />
			</Typography>

			{ loading ? (
				<Stack
					direction="row"
					justifyContent="center"
					alignItems="center"
					sx={ { minHeight: 352 } }
				>
					<LinearProgress />
				</Stack>
			) : (
				<RoutesTree
					treeData={ restRoutes }
					onSettingsChange={ handleTreeChange }
					enforceAuth={ firewallOptions.enforce_auth }
					enforceRateLimit={ firewallOptions.enforce_rate_limit }
					globalRateLimit={ firewallOptions.rate_limit }
					globalRateLimitTime={ firewallOptions.rate_limit_time }
					proActive={ proActive }
				/>
			) }
		</Stack>
	);
}

import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';

import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import RoutesTree from './RoutesTree';
import IpBlackList from './IpBlackList';
import Grid from '@mui/material/Grid';

const defaultFirewallOptions = {
	enforce_auth: false,
	enforce_rate_limit: false,
	hide_user_routes: false,
	user_id: 0,
	rate_limit: 30,
	rate_limit_time: 60,
};

export default function Firewall() {
	const { adminData } = useAdminData();
	const { __, sprintf } = wp.i18n || {};
	const [ restRoutes, setRestRoutes ] = useState( null );
	const [ treeState, setTreeState ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ firewallOptions, setFirewallOptions ] = useState( defaultFirewallOptions );
	const [ users, setUsers ] = useState( [] );
	const [ restApiUser, setRestApiUser ] = useState( [] );
	const [ proActive, setProActive ] = useState( true );

	const adminUrl = adminData?.ajaxurl?.split( 'admin-ajax.php' )[0] || '';
	const usersPageUrl = `${ adminUrl }users.php`;

	const { openDialog, updateDialog } = useDialog();

	const minDelay = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

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
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
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
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
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
					rate_limit: result.data.rate_limit ?? 30,
					rate_limit_time: result.data.rate_limit_time ?? 60,
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
			content: __( 'Are you sure you want to save these firewall settings?', 'rest-api-firewall' ),
			onConfirm: async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Saving...', 'rest-api-firewall' ),
				} );

				try {
					// Save both options and policy in parallel
					const [ optionsResponse, policyResponse ] = await Promise.all( [
						fetch( adminData.ajaxurl, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
							},
							body: new URLSearchParams( {
								action: 'save_firewall_options',
								nonce: adminData.nonce,
								enforce_auth: firewallOptions.enforce_auth ? '1' : '0',
								enforce_rate_limit: firewallOptions.enforce_rate_limit ? '1' : '0',
								hide_user_routes: firewallOptions.hide_user_routes ? '1' : '0',
								user_id: String( firewallOptions.user_id ),
								rate_limit: String( firewallOptions.rate_limit ),
								rate_limit_time: String( firewallOptions.rate_limit_time ),
							} ),
						} ),
						treeState
							? fetch( adminData.ajaxurl, {
									method: 'POST',
									headers: {
										'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
									},
									body: new URLSearchParams( {
										action: 'save_routes_policy_tree',
										nonce: adminData.nonce,
										tree: JSON.stringify( treeState ),
									} ),
							  } )
							: Promise.resolve( { json: () => ( { success: true } ) } ),
						minDelay( 400 ),
					] );

					const optionsResult = await optionsResponse.json();
					const policyResult = await policyResponse.json();

					if ( ! policyResult?.success && policyResult?.data?.pro_required ) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: __( ' Global Settings Saved', 'rest-api-firewall' ),
							content: __( 'Global settings saved successfully. Go Pro to block and fine tune.', 'rest-api-firewall' ),
						} );
						return;
					}

					if ( optionsResult?.success && policyResult?.success ) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: __( 'Firewall Settings Saved', 'rest-api-firewall' ),
							content: __( 'Per-route policies saved successfully', 'rest-api-firewall' ),
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
							content: __( 'Failed to save settings: ', 'rest-api-firewall' ) + errorMessage,
						} );
					}
				} catch ( error ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: __( 'Error saving settings: ', 'rest-api-firewall' ) + error.message,
					} );
				}
			},
		} );
	};

	return (
	
			<Stack spacing={ 3 } >

				<Grid spacing={ 4 } container>
					<Grid size={ {xs:12, xl:7} } spacing={ 3 }>
						
						<Stack direction={"row"} justifyContent={"space-between"} gap={2} flexWrap={"wrap"} alignItems={"center"}>
							<Typography variant="subtitle1" fontWeight={600}>
								{ __( 'User and Rate Limiting', 'rest-api-firewall' ) }
							</Typography>
							<Button size="small" color="primary" variant="contained" onClick={ handleSave }>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						</Stack>

						<Stack direction={{xs:'column', xl:'row'}} my={3.6} gap={ 2 } justifyContent={'space-between'}>
							
							<FormControl>
								<InputLabel id="user-id-label">
									{ __( 'REST API User', 'rest-api-firewall' ) }
								</InputLabel>
								<Select
									labelId="user-id-label"
									id="user_id"
									name="user_id"
									value={ firewallOptions.user_id }
									label={ __( 'REST API User', 'rest-api-firewall' ) }
									onChange={ handleOptionChange }
								>
									<MenuItem value={ 0 }>
										<em>{ __( 'Select User', 'rest-api-firewall' ) }</em>
									</MenuItem>
									{ users.map( ( user ) =>
										user.value && user.label ? (
											<MenuItem key={ user.value } value={ user.value }>
												{ user.label }
											</MenuItem>
										) : null
									) }
								</Select>
								<FormHelperText>
								
									{ firewallOptions.user_id &&
										restApiUser &&
										restApiUser?.label &&
										restApiUser?.admin_url ?
										<>
										<span>
										{sprintf( __( 'Restrict authentication to %s.', 'rest-api-firewall'), restApiUser.label)}<br/>
										{__( 'Ensure you safe saved the user application password.', 'rest-api-firewall')}
										</span>
										<Typography
												component="a"
												href={ restApiUser.admin_url }
												variant="body.2"
												target="_blank"
												sx={ {
													display: 'flex',
													alignItems: 'center',
													gap: '4px',
													px: '14px',
													fontSize: '12px',
												} }
											>
												{ __( 'User profile', 'rest-api-firewall' ) }
												<OpenInNewIcon fontSize="inherut" />
											</Typography>
										</>
										:
										<>
										<span>
										{__( 'Restrict authentication to one user. Create an application password first in', 'rest-api-firewall')}
										</span>
										<Typography
											component="a"
											href={ usersPageUrl }
											variant="body.2"
											target="_blank"
											sx={ {
												display: 'inline-flex',
												alignItems: 'center',
												gap: '4px',
												pl: '4px',
												fontSize: '12px',
											} }
											>
												{ __( 'users list', 'rest-api-firewall' ) }
												<OpenInNewIcon fontSize="inherit" />
											</Typography></>
										}
								
								</FormHelperText>
							</FormControl>
								
							<FormControl sx={{minWidth:240}}>
								<FormControlLabel
									control={
										<Switch
											checked={ !! firewallOptions.enforce_auth }
											name="enforce_auth"
											size="small"
											onChange={ handleOptionChange }
										/>
									}
									label={ __( 'Enforce Authentication', 'rest-api-firewall' ) }
								/>
								<FormHelperText>
									{ __('Enforce authentication on all routes', 'rest-api-firewall') }
								</FormHelperText>
							</FormControl>

							<FormControl sx={{minWidth:240}}>
								<FormControlLabel
									control={
										<Switch
											checked={ !! firewallOptions.hide_user_routes }
											name="hide_user_routes"
											size="small"
											onChange={ handleOptionChange }
										/>
									}
									label={ __( 'Hide User Routes', 'rest-api-firewall' ) }
								/>
								<FormHelperText>
									{ __('Block access to /wp/v2/users endpoint', 'rest-api-firewall') }
								</FormHelperText>
							</FormControl>
						</Stack>

						<Stack direction={{xs:'column', lg:'row'}} my={3.6} gap={ 2 }  justifyContent={'space-between'}>
							
							<Stack direction={{xs:'column', sm:'row'}} gap={ 2 }>
								<TextField
									label={ __( 'Rate Limit Requests', 'rest-api-firewall' ) }
									type="number"
									helperText={ __(
										'Maximum requests before rate-limiting',
										'rest-api-firewall'
									) }
									name="rate_limit"
									value={ firewallOptions.rate_limit }
									onChange={ handleOptionChange }
									fullWidth
								/>

								<TextField
									label={ __( 'Rate Limit Window (seconds)', 'rest-api-firewall' ) }
									type="number"
									helperText={ __(
										'Time window for the request limit',
										'rest-api-firewall'
									) }
									name="rate_limit_time"
									value={ firewallOptions.rate_limit_time }
									onChange={ handleOptionChange }
									fullWidth
								/>
							</Stack>

							<FormControl sx={{minWidth:240}}>
								<FormControlLabel
									control={
										<Switch
											checked={ !! firewallOptions.enforce_rate_limit }
											name="enforce_rate_limit"
											onChange={ handleOptionChange }
											size="small"
										/>
									}
									label={ __( 'Enforce Rate Limiting', 'rest-api-firewall' ) }
								/>
								<FormHelperText>
									{ __(
										'Apply rate limiting to all routes',
										'rest-api-firewall'
									) }
								</FormHelperText>
							</FormControl>

						</Stack>
					</Grid>
					<Grid size={ {xs:12, xl:5} }>
						<IpBlackList />
					</Grid>
				</Grid>

				<Divider />

				<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
					<span>{ __( 'Per Route Settings', 'rest-api-firewall' ) }</span>
					<Tooltip title={ __( 'Refresh routes from server', 'rest-api-firewall' ) }>
						<IconButton onClick={ loadRoutes } disabled={ loading } size="small">
							<RefreshIcon />
						</IconButton>
					</Tooltip>
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

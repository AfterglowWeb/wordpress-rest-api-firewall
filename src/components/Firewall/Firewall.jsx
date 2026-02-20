import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

import LinearProgress from '@mui/material/LinearProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

import RoutesTree from './RoutesTree';
import IpBlackList from './IpBlackList';
import RateLimit from './RateLimit';
import RestApiUser from './RestApiUser';
import MultipleSelect from '../MultipleSelect';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';


export default function Firewall({ 
	panelGroup, 
	form,
	setField }) {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const [ restRoutes, setRestRoutes ] = useState( null );
	const [ treeState, setTreeState ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ restApiUser, setRestApiUser ] = useState( [] );
	const [ proActive, setProActive ] = useState( true );
	const isDisabled = ! form.rest_collections_allowed_post_types_enabled || ! proActive;

	useEffect( () => {
		if ( Array.isArray( adminData?.users ) && form.firewall_user_id ) {
			const currentUser = adminData.users.filter(
				( user ) => form.firewall_user_id === user.value
			);
			if ( currentUser && currentUser.length > 0 ) {
				setRestApiUser( currentUser[ 0 ] );
			}
		}
	}, [ adminData?.users, form.firewall_user_id ] );

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

	useEffect( () => {
		loadRoutes();
	}, [ loadRoutes ] );

	const handleTreeChange = ( updatedNodes ) => {
		setTreeState( updatedNodes );
	};

	const normPanelIndex = Number( panelGroup );

	return (
		<Stack>
			{ normPanelIndex === 1 && (
				<Stack sx={ { maxWidth: 800 } } id="section-user-rate-limiting">
					<RestApiUser
						form={ form }
						setField={ setField }
						users={ adminData?.users || [] }
						restApiUser={ restApiUser }
					/>
					<Divider sx={ { my: 3 } } />
					<RateLimit
						form={ form }
						setField={ setField }
					/>
				</Stack>
			)}

			{ normPanelIndex === 2 && (

				<Stack id="section-ip-filtering">
					<IpBlackList />
				</Stack>
			)}

			{ normPanelIndex === 3 && (
			
				<Stack spacing={3} id="section-per-route-settings">

					<Stack spacing={3} maxWidth={500}>
					
						<Typography
						variant="caption"
						sx={{
							display: 'block', 
							mt: 1,
							textTransform: 'uppercase',
							letterSpacing: 0.5,
							fontSize: '0.75rem',
							color: 'text.secondary',
						}}
						>
							{__( 'Global Settings', 'rest-api-firewall' ) }
						</Typography>

						<FormControl>
							<FormControlLabel
								control={
									<Switch
										checked={ !! form.enforce_auth }
										name="enforce_auth"
										size="small"
										onChange={ setField }
									/>
								}
								label={ __(
									'Enforce Authentication on All Routes',
									'rest-api-firewall'
								) }
							/>
						</FormControl>

						<FormControl>
							<FormControlLabel
								control={
									<Switch
										checked={
											!! form.enforce_rate_limit
										}
										onChange={ setField }
										size="small"
									/>
								}
								label={ __(
									'Enforce Rate Limiting on All Routes',
									'rest-api-firewall'
								) }
							/>
						</FormControl>

						<FormControl>
							<FormControlLabel
								control={
									<Switch
										checked={ !! form.hide_user_routes }
										name="hide_user_routes"
										size="small"
										onChange={ setField }
									/>
								}
								label={ __( 'Disable /wp/v2/users/* Routes', 'rest-api-firewall' ) }
							/>
						</FormControl>

						<Stack spacing={ 1 }>
							<Tooltip 
							title={ ! proActive ? __( 'Licence required', 'rest-api-firewall' ) : '' } 
							followCursor
							>
								<FormControl disabled={ ! proActive }>
									<FormControlLabel
										control={
											<Switch
												size="small"
												checked={
													!! form.rest_collections_allowed_post_types_enabled
												}
												name="rest_collections_allowed_post_types_enabled"
												onChange={ setField }
											/>
										}
										label={ __( 'Restrict Post Types', 'rest-api-firewall' ) }
									/>
									
								</FormControl>
							</Tooltip>

							{ adminData?.post_types && (
								<Stack pl={3.5}>
									<MultipleSelect disabled={ isDisabled }
									name="rest_collections_allowed_post_types"
									label={ __(
										'Select Post Types',
										'rest-api-firewall'
									) }
									value={ form.rest_collections_allowed_post_types }
									helperText={
										<Stack>
											<Typography variant="caption" color="inherit">
											{ __( 'Only the selected post types will be exposed in the REST API.', 'rest-api-firewall' ) }
											</Typography>
											<Typography variant="caption" color="inherit">
											{ __( 'If left empty, default visibility settings apply.', 'rest-api-firewall' ) }
											</Typography>
										</Stack>
									}
									options={ adminData.post_types }
									onChange={ setField }
									/>
								</Stack>
							) }
						</Stack>

					</Stack>

					<Divider />

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
						<Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								
								<Typography
								variant="caption"
								sx={{
									display: 'block', 
									textTransform: 'uppercase',
									letterSpacing: 0.5,
									fontSize: '0.75rem',
									color: 'text.secondary',
								}}
								>
									{__( 'Per-Route Settings', 'rest-api-firewall' ) }
								</Typography>

								<Tooltip title={ __( 'Refresh Routes', 'rest-api-firewall' ) } placement="left">
									<IconButton
										onClick={ loadRoutes }
									>
										<RefreshIcon />
									</IconButton>
								</Tooltip>
							</Stack>
							<RoutesTree
								treeData={ restRoutes }
								onSettingsChange={ handleTreeChange }
								enforceAuth={ form.enforce_auth }
								enforceRateLimit={ form.enforce_rate_limit }
								globalRateLimit={ form.rate_limit }
								globalRateLimitTime={ form.rate_limit_time }
								proActive={ proActive }
							/>
						</Stack>
					) }
				</Stack>

			)}
		</Stack>
	);
}
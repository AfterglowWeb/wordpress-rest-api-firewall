import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import useSettingsForm from '../../contexts/useSettingsForm';

import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import RoutesTree from './RoutesTree';
import IpBlackList from './IpBlackList';
import ProBadge from '../ProBadge';
import RateLimit from './RateLimit';
import RestApiUser from './RestApiUser';
import CollectionsAllowedTypes from './CollectionsAllowedTypes';

export default function Firewall({ 
	panelIndex, 
	form,
	setField }) {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const [ restRoutes, setRestRoutes ] = useState( null );
	const [ treeState, setTreeState ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ restApiUser, setRestApiUser ] = useState( [] );
	const [ proActive, setProActive ] = useState( true );

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

	const normPanelIndex = Number( panelIndex );

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
			</Stack>)}
			{ normPanelIndex === 2 && (
			<Stack id="section-ip-filtering">
				<IpBlackList />
			</Stack>)}
			{ normPanelIndex === 3 && (
			<Stack id="section-per-route-settings">
				<CollectionsAllowedTypes form={form} setField={setField} />
				<Typography
					variant="subtitle1"
					fontWeight={ 600 }
					sx={ { mb: 2, mt: 3, position: 'relative' } }
				>
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
						enforceAuth={ form.enforce_auth }
						enforceRateLimit={ form.enforce_rate_limit }
						globalRateLimit={ form.rate_limit }
						globalRateLimitTime={ form.rate_limit_time }
						proActive={ proActive }
					/>
				) }
			</Stack>)}
		</Stack>
	);
}
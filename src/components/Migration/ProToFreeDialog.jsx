import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import WebhookIcon from '@mui/icons-material/Webhook';
import ApiIcon from '@mui/icons-material/Api';
import ShieldIcon from '@mui/icons-material/Shield';

/**
 * Dialog shown when pro license expires or plugin is deactivated.
 * Lets the user export one application's data to the free tier before losing access.
 *
 * Visibility controlled by parent: only mount this when
 *   window.restApiFirewallPro?.shouldPromptFallback === true
 */
export default function ProToFreeDialog( { open, onClose, onExported } ) {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();

	const [ applications, setApplications ] = useState( [] );
	const [ loadingApps, setLoadingApps ] = useState( false );
	const [ selectedAppId, setSelectedAppId ] = useState( '' );
	const [ running, setRunning ] = useState( false );
	const [ result, setResult ] = useState( null ); // null | { success: bool, message: string }

	const proNonce = window.restApiFirewallPro?.nonce || adminData.nonce;

	const postAjax = useCallback( async ( action, extra = {} ) => {
		const r = await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( { action, nonce: proNonce, ...extra } ),
		} );
		return r.json();
	}, [ adminData, proNonce ] );

	// Load applications when dialog opens.
	useEffect( () => {
		if ( ! open ) {
			setResult( null );
			setSelectedAppId( '' );
			return;
		}
		setLoadingApps( true );
		postAjax( 'rest_api_firewall_pro_get_fallback_applications' )
			.then( ( json ) => {
				if ( json?.success ) {
					const apps = json.data?.applications ?? [];
					setApplications( apps );
					if ( apps.length === 1 ) {
						setSelectedAppId( apps[0].id );
					}
				}
			} )
			.catch( () => {} )
			.finally( () => setLoadingApps( false ) );
	}, [ open, postAjax ] );

	const handleExport = async () => {
		if ( ! selectedAppId ) return;
		setRunning( true );
		try {
			const data = await postAjax( 'rest_api_firewall_pro_export_to_free', {
				application_id: selectedAppId,
			} );
			setResult( {
				success: !! data.success,
				message: data.data?.message || ( data.success
					? __( 'Export completed. You can now continue using the free tier.', 'rest-api-firewall' )
					: __( 'Export failed.', 'rest-api-firewall' ) ),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message: err.message || __( 'An unexpected error occurred.', 'rest-api-firewall' ),
			} );
		} finally {
			setRunning( false );
		}
	};

	const handleDismiss = async () => {
		await postAjax( 'rest_api_firewall_pro_dismiss_fallback' ).catch( () => {} );
		onClose?.();
	};

	const WILL_EXPORT = [
		{
			icon: ManageAccountsOutlinedIcon,
			primary: __( 'Auth & rate limiting', 'rest-api-firewall' ),
			secondary: __( 'First application user becomes the firewall user. Rate limit settings are preserved.', 'rest-api-firewall' ),
		},
		{
			icon: AccountTreeOutlinedIcon,
			primary: __( 'Routes policy', 'rest-api-firewall' ),
			secondary: __( 'Application routes and nodes are exported to the global firewall policy.', 'rest-api-firewall' ),
		},
		{
			icon: WebhookIcon,
			primary: __( 'First outbound webhook', 'rest-api-firewall' ),
			secondary: __( 'Endpoint URL and trigger events are exported to the free tier webhook settings.', 'rest-api-firewall' ),
		},
	];

	const WILL_PRESERVE = [
		{
			icon: ApiIcon,
			primary: __( 'Collections', 'rest-api-firewall' ),
			secondary: __( 'Your global per-page and sorting settings are untouched.', 'rest-api-firewall' ),
		},
		{
			icon: SecurityOutlined,
			primary: __( 'Global security & IP filtering', 'rest-api-firewall' ),
			secondary: __( 'These settings are independent of applications.', 'rest-api-firewall' ),
		},
		{
			icon: ShieldIcon,
			primary: __( 'Logs', 'rest-api-firewall' ),
			secondary: __( 'Log entries are not affected.', 'rest-api-firewall' ),
		},
	];

	const WILL_LOSE = [
		__( 'Multiple applications', 'rest-api-firewall' ),
		__( 'Per-application users', 'rest-api-firewall' ),
		__( 'Models & properties', 'rest-api-firewall' ),
		__( 'Automations', 'rest-api-firewall' ),
		__( 'Email templates', 'rest-api-firewall' ),
		__( 'API connections', 'rest-api-firewall' ),
	];

	return (
		<Dialog open={ open } maxWidth="sm" fullWidth disableEscapeKeyDown={ running }>
			<DialogTitle sx={ { display: 'flex', alignItems: 'center', gap: 1.5 } }>
				<SecurityOutlined color="warning" />
				{ __( 'Pro License Expired — Export to Free Tier', 'rest-api-firewall' ) }
			</DialogTitle>

			<DialogContent>
				<Stack spacing={ 3 } pt={ 1 }>
					{ ! result && (
						<>
							<Alert severity="warning">
								{ __(
									'Your Pro license is no longer active. Select which application you want to keep — its core settings will be exported to the free tier plugin.',
									'rest-api-firewall'
								) }
							</Alert>

							{ loadingApps ? (
								<Stack alignItems="center" py={ 2 }>
									<CircularProgress size={ 24 } />
								</Stack>
							) : (
								<FormControl fullWidth size="small">
									<InputLabel>
										{ __( 'Application to export', 'rest-api-firewall' ) }
									</InputLabel>
									<Select
										value={ selectedAppId }
										label={ __( 'Application to export', 'rest-api-firewall' ) }
										onChange={ ( e ) => setSelectedAppId( e.target.value ) }
										disabled={ running }
									>
										{ applications.map( ( app ) => (
											<MenuItem key={ app.id } value={ app.id }>
												{ app.title }
											</MenuItem>
										) ) }
									</Select>
								</FormControl>
							) }

							<Divider />

							<Stack spacing={ 1 }>
								<Typography variant="subtitle2" fontWeight={ 600 }>
									{ __( 'What will be exported', 'rest-api-firewall' ) }
								</Typography>
								<List dense disablePadding>
									{ WILL_EXPORT.map( ( item ) => {
										const Icon = item.icon;
										return (
											<ListItem key={ item.primary } alignItems="flex-start" disablePadding sx={ { py: 0.5 } }>
												<ListItemIcon sx={ { minWidth: 32, mt: 0.5 } }>
													<Icon fontSize="small" color="success" />
												</ListItemIcon>
												<ListItemText
													primary={ item.primary }
													secondary={ item.secondary }
													primaryTypographyProps={ { variant: 'body2', fontWeight: 500 } }
													secondaryTypographyProps={ { variant: 'caption' } }
												/>
											</ListItem>
										);
									} ) }
								</List>
							</Stack>

							<Stack spacing={ 1 }>
								<Typography variant="subtitle2" fontWeight={ 600 }>
									{ __( 'What will be preserved (unchanged)', 'rest-api-firewall' ) }
								</Typography>
								<List dense disablePadding>
									{ WILL_PRESERVE.map( ( item ) => {
										const Icon = item.icon;
										return (
											<ListItem key={ item.primary } alignItems="flex-start" disablePadding sx={ { py: 0.5 } }>
												<ListItemIcon sx={ { minWidth: 32, mt: 0.5 } }>
													<Icon fontSize="small" color="info" />
												</ListItemIcon>
												<ListItemText
													primary={ item.primary }
													secondary={ item.secondary }
													primaryTypographyProps={ { variant: 'body2', fontWeight: 500 } }
													secondaryTypographyProps={ { variant: 'caption' } }
												/>
											</ListItem>
										);
									} ) }
								</List>
							</Stack>

							<Stack spacing={ 1 }>
								<Typography variant="subtitle2" fontWeight={ 600 } color="text.secondary">
									{ __( 'Features no longer accessible', 'rest-api-firewall' ) }
								</Typography>
								<Stack direction="row" flexWrap="wrap" gap={ 1 }>
									{ WILL_LOSE.map( ( label ) => (
										<Chip
											key={ label }
											size="small"
											variant="outlined"
											label={ label }
											icon={ <RemoveCircleOutlineIcon /> }
											sx={ { color: 'text.disabled', borderColor: 'divider' } }
										/>
									) ) }
								</Stack>
							</Stack>
						</>
					) }

					{ running && (
						<Stack spacing={ 1 }>
							<Typography variant="body2" color="text.secondary">
								{ __( 'Exporting settings…', 'rest-api-firewall' ) }
							</Typography>
							<LinearProgress />
						</Stack>
					) }

					{ result && (
						<Alert
							severity={ result.success ? 'success' : 'error' }
							icon={ result.success
								? <CheckCircleOutlineIcon fontSize="inherit" />
								: <ErrorOutlineIcon fontSize="inherit" />
							}
						>
							{ result.message }
						</Alert>
					) }
				</Stack>
			</DialogContent>

			<DialogActions sx={ { px: 3, pb: 2 } }>
				{ ! result && (
					<>
						<Button variant="text" disabled={ running } onClick={ handleDismiss }>
							{ __( 'Dismiss for now', 'rest-api-firewall' ) }
						</Button>
						<Button
							variant="contained"
							disableElevation
							disabled={ ! selectedAppId || running || loadingApps }
							onClick={ handleExport }
						>
							{ __( 'Export & Continue on Free', 'rest-api-firewall' ) }
						</Button>
					</>
				) }
				{ result?.success && (
					<Button variant="contained" disableElevation onClick={ onExported ?? onClose }>
						{ __( 'Done', 'rest-api-firewall' ) }
					</Button>
				) }
				{ result && ! result.success && (
					<>
						<Button variant="text" onClick={ handleDismiss }>
							{ __( 'Dismiss', 'rest-api-firewall' ) }
						</Button>
						<Button variant="outlined" onClick={ () => setResult( null ) }>
							{ __( 'Try Again', 'rest-api-firewall' ) }
						</Button>
					</>
				) }
			</DialogActions>
		</Dialog>
	);
}

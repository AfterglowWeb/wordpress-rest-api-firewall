import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

const STORAGE_KEY = 'rest_api_firewall_licence_state';

export default function License() {
	const { adminData } = useAdminData();
	const { updateLicenseStatus } = useLicense();
	const [ loading, setLoading ] = useState( false );
	const [ checkingStatus, setCheckingStatus ] = useState( true );
	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ status, setStatus ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ successMessage, setSuccessMessage ] = useState( '' );
	const [ confirmOpen, setConfirmOpen ] = useState( false );
	const { __ } = wp.i18n || {};

	useEffect( () => {
		const stored = localStorage.getItem( STORAGE_KEY );
		if ( stored ) {
			localStorage.removeItem( STORAGE_KEY );
			if ( stored === 'activate' ) {
				setSuccessMessage(
					__( 'License activated successfully.', 'rest-api-firewall' )
				);
			} else if ( stored === 'deactivate' ) {
				setSuccessMessage(
					__(
						'License deactivated successfully.',
						'rest-api-firewall'
					)
				);
			}
		}
	}, [] );

	useEffect( () => {
		if ( null === status ) {
			checkLicenseStatus();
		}
	}, [ status ] );

	const checkLicenseStatus = async () => {
		setCheckingStatus( true );
		setError( '' );
		try {
			const formData = new FormData();
			formData.append( 'action', 'rest_firewall_pro_check_license' );
			formData.append( 'nonce', adminData.nonce );

			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: formData,
			} );

			const result = await response.json();

			if ( result.success ) {
				setStatus( result.data );
				updateLicenseStatus( result.data );
				setLicenseKey( '' );
			} else {
				setError(
					result.data?.message ||
						__(
							'Failed to check license status',
							'rest-api-firewall'
						)
				);
			}
		} catch ( err ) {
			setError(
				__( 'Error checking license status', 'rest-api-firewall' )
			);
		} finally {
			setCheckingStatus( false );
		}
	};

	const handleActivate = async () => {
		if ( ! licenseKey.trim() ) {
			setError( __( 'Please enter a license key', 'rest-api-firewall' ) );
			return;
		}

		setLoading( true );
		setError( '' );
		try {
			const formData = new FormData();
			formData.append( 'action', 'rest_firewall_pro_activate_license' );
			formData.append( 'nonce', adminData.nonce );
			formData.append( 'license_key', licenseKey );

			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: formData,
			} );

			const result = await response.json();

			if ( result.success ) {
				localStorage.setItem( STORAGE_KEY, 'activate' );
				window.location.reload();
			} else {
				setError(
					result.data?.message ||
						__( 'Failed to activate license', 'rest-api-firewall' )
				);
			}
		} catch ( err ) {
			setError( __( 'Error activating license', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	};

	const handleDeactivate = () => {
		setConfirmOpen( true );
	};

	const confirmDeactivate = async () => {
		setConfirmOpen( false );
		setLoading( true );
		setError( '' );
		try {
			const formData = new FormData();
			formData.append( 'action', 'rest_firewall_pro_deactivate_license' );
			formData.append( 'nonce', adminData.nonce );

			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: formData,
			} );

			const result = await response.json();

			if ( result.success ) {
				localStorage.setItem( STORAGE_KEY, 'deactivate' );
				window.location.reload();
			} else {
				setError(
					result.data?.message ||
						__(
							'Failed to deactivate license',
							'rest-api-firewall'
						)
				);
			}
		} catch ( err ) {
			console.error( 'Error deactivating license:', err );
			setError( __( 'Error deactivating license', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleActivate();
		}
	};

	const isLicenseActive = status?.valid;
	const formatDate = ( dateString ) => {
		if ( ! dateString ) {
			return 'N/A';
		}
		return new Date( dateString ).toLocaleDateString( 'en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		} );
	};

	return (
		<>
			<Stack gap={ 2 } p={ 2 } width={ 320 }>
				<Stack direction="row" alignItems="center" gap={ 1 }>
					{ isLicenseActive ? (
						<CheckCircleIcon sx={ { color: 'success.main' } } />
					) : (
						<InfoIcon sx={ { color: 'info.main' } } />
					) }
					<Typography variant="h6" sx={ { fontWeight: 600 } }>
						{ __( 'License Management', 'rest-api-firewall' ) }
					</Typography>
				</Stack>

				{ successMessage && (
					<Alert severity="success">{ successMessage }</Alert>
				) }

				{ error && <Alert severity="error">{ error }</Alert> }

				{ checkingStatus ? (
					<Box display="flex" justifyContent="center" py={ 3 }>
						<CircularProgress />
					</Box>
				) : (
					<>
						{ isLicenseActive && status && (
							<>
								{ ! successMessage && (
									<Alert severity="success">
										{ __(
											'Your license is active and valid',
											'rest-api-firewall'
										) }
									</Alert>
								) }

								<Box
									sx={ {
										bgcolor: 'background.paper',
										p: 2,
										mb: 1,
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'divider',
									} }
								>
									<Typography
										variant="subtitle2"
										color="textSecondary"
										mb={ 1 }
									>
										{ __(
											'License Details',
											'rest-api-firewall'
										) }
									</Typography>
									<Stack gap={ 1 }>
										<Box
											display="flex"
											justifyContent="space-between"
										>
											<Typography
												sx={ {
													display: 'inline-block',
													minWidth: 50,
												} }
												variant="body2"
												color="textSecondary"
											>
												{ __(
													'Key:',
													'rest-api-firewall'
												) }
											</Typography>
											<Typography
												sx={ {
													display: 'block',
													flex: 1,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												} }
												variant="body2"
												fontFamily="monospace"
											>
												{ status.key_masked }
											</Typography>
										</Box>

										{ status.email && (
											<Box
												display="flex"
												justifyContent="space-between"
											>
												<Typography
													sx={ {
														display: 'block',
														minWidth: 50,
													} }
													variant="body2"
													color="textSecondary"
												>
													{ __(
														'Email:',
														'rest-api-firewall'
													) }
												</Typography>
												<Typography
													sx={ {
														display: 'block',
														flex: 1,
														overflow: 'hidden',
														textOverflow:
															'ellipsis',
														whiteSpace: 'nowrap',
													} }
													variant="body2"
												>
													{ status.email }
												</Typography>
											</Box>
										) }

										<Divider sx={ { my: 1 } } />
										<Box
											display="flex"
											justifyContent="space-between"
										>
											<Typography
												variant="body2"
												color="textSecondary"
											>
												{ __(
													'Expires:',
													'rest-api-firewall'
												) }
											</Typography>
											<Typography
												variant="body2"
												sx={ {
													color: 'info.main',
												} }
											>
												{ formatDate( status.expires ) }
											</Typography>
										</Box>
										<Box
											display="flex"
											justifyContent="space-between"
										>
											<Typography
												variant="body2"
												color="textSecondary"
											>
												{ __(
													'Sites:',
													'rest-api-firewall'
												) }
											</Typography>
											<Typography variant="body2">
												{ status.site_count } /{ ' ' }
												{ status.site_limit }
											</Typography>
										</Box>
										{ status.features &&
											status.features.length > 0 && (
												<>
													<Divider sx={ { my: 1 } } />
													<Typography
														variant="body2"
														color="textSecondary"
														mb={ 1 }
													>
														{ __(
															'Features:',
															'rest-api-firewall'
														) }
													</Typography>
													<Typography variant="body2">
														{ status.features.join(
															', '
														) }
													</Typography>
												</>
											) }
									</Stack>
								</Box>

								<Button
									onClick={ handleDeactivate }
									disabled={ loading }
									color="info"
									variant="outlined"
									fullWidth
								>
									{ loading ? (
										<CircularProgress
											size={ 20 }
											sx={ { mr: 1 } }
										/>
									) : null }
									{ __(
										'Deactivate License',
										'rest-api-firewall'
									) }
								</Button>
							</>
						) }

						{ ! isLicenseActive && (
							<>
								{ ! successMessage && (
									<Alert severity="info">
										{ __(
											'Enter your license key to activate Pro features.',
											'rest-api-firewall'
										) }
									</Alert>
								) }

								<TextField
									label={ __(
										'License Key',
										'rest-api-firewall'
									) }
									type="password"
									value={ licenseKey }
									onChange={ ( e ) =>
										setLicenseKey( e.target.value )
									}
									onKeyDown={ handleKeyDown }
									fullWidth
									disabled={ loading }
									placeholder={ __(
										'Enter your license key',
										'rest-api-firewall'
									) }
								/>

								<Button
									onClick={ handleActivate }
									disabled={ loading || ! licenseKey.trim() }
									variant="contained"
									color="primary"
									fullWidth
								>
									{ loading ? (
										<CircularProgress
											size={ 20 }
											sx={ { mr: 1 } }
										/>
									) : null }
									{ __( 'Activate', 'rest-api-firewall' ) }
								</Button>
							</>
						) }
					</>
				) }
			</Stack>

			<Dialog
				open={ confirmOpen }
				onClose={ () => setConfirmOpen( false ) }
			>
				<DialogTitle>
					{ __( 'Deactivate License', 'rest-api-firewall' ) }
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{ __(
							'Are you sure you want to deactivate this license? Pro features will be disabled.',
							'rest-api-firewall'
						) }
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={ () => setConfirmOpen( false ) }>
						{ __( 'Cancel', 'rest-api-firewall' ) }
					</Button>
					<Button
						onClick={ confirmDeactivate }
						variant="contained"
						disableElevation
					>
						{ __( 'Deactivate', 'rest-api-firewall' ) }
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';

import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

export default function LicenseDialog() {
	const { adminData } = useAdminData();
	const [ loading, setLoading ] = useState( false );
	const [ checkingStatus, setCheckingStatus ] = useState( true );
	const [ email, setEmail ] = useState( '' );
	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ status, setStatus ] = useState( null );
	const [ snackbar, setSnackbar ] = useState( {
		open: false,
		message: '',
		severity: 'success',
	} );
	const [ licenseOpen, setLicenseOpen ] = useState( false );
	const { __ } = wp.i18n || {};

	const toggleDrawer = ( open ) => ( event ) => {
		if (
			event.type === 'keydown' &&
			( event.key === 'Tab' || event.key === 'Shift' )
		) {
			return;
		}
		setLicenseOpen( open );
	};

	useEffect( () => {
		if ( licenseOpen ) {
			checkLicenseStatus();
		}
	}, [ licenseOpen ] );

	const checkLicenseStatus = async () => {
		setCheckingStatus( true );
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
				setEmail( result.data.email || '' );
				setLicenseKey( '' );
			} else {
				showSnackbar(
					result.data?.message ||
						__(
							'Failed to check license status',
							'rest-api-firewall'
						),
					'error'
				);
			}
		} catch ( error ) {
			showSnackbar(
				__( 'Error checking license status', 'rest-api-firewall' ),
				'error'
			);
		} finally {
			setCheckingStatus( false );
		}
	};

	const handleActivate = async () => {
		if ( ! licenseKey.trim() || ! email.trim() ) {
			showSnackbar(
				__(
					'Please enter both license key and email',
					'rest-api-firewall'
				),
				'error'
			);
			return;
		}

		setLoading( true );
		try {
			const formData = new FormData();
			formData.append( 'action', 'rest_firewall_pro_activate_license' );
			formData.append( 'nonce', adminData.nonce );
			formData.append( 'license_key', licenseKey );
			formData.append( 'email', email );

			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: formData,
			} );

			const result = await response.json();

			if ( result.success ) {
				showSnackbar(
					result.data?.message ||
						__(
							'License activated successfully',
							'rest-api-firewall'
						),
					'success'
				);
				setLicenseKey( '' );
				await checkLicenseStatus();
			} else {
				showSnackbar(
					result.data?.message ||
						__( 'Failed to activate license', 'rest-api-firewall' ),
					'error'
				);
			}
		} catch ( error ) {
			showSnackbar(
				__( 'Error activating license', 'rest-api-firewall' ),
				'error'
			);
		} finally {
			setLoading( false );
		}
	};

	const handleDeactivate = async () => {
		if (
			! window.confirm(
				__(
					'Are you sure you want to revoke this license?',
					'rest-api-firewall'
				)
			)
		) {
			return;
		}

		setLoading( true );
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
				showSnackbar(
					result.data?.message ||
						__(
							'License revoked successfully',
							'rest-api-firewall'
						),
					'success'
				);
				setStatus( null );
				setEmail( '' );
				setLicenseKey( '' );
			} else {
				showSnackbar(
					result.data?.message ||
						__( 'Failed to revoke license', 'rest-api-firewall' ),
					'error'
				);
			}
		} catch ( error ) {
			console.error( 'Error revoking license:', error );
			showSnackbar(
				__( 'Error revoking license', 'rest-api-firewall' ),
				'error'
			);
		} finally {
			setLoading( false );
		}
	};

	const showSnackbar = ( message, severity = 'success' ) => {
		setSnackbar( { open: true, message, severity } );
	};

	const handleCloseSnackbar = () => {
		setSnackbar( { ...snackbar, open: false } );
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

	const drawerContent = (
		<Box sx={ { width: 320 } } role="presentation">
			<Box sx={ { p: 2 } }>
				<Stack gap={ 2 }>
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

					{ checkingStatus ? (
						<Box display="flex" justifyContent="center" py={ 3 }>
							<CircularProgress />
						</Box>
					) : (
						<>
							{ isLicenseActive && status && (
								<>
									<Alert severity="success">
										{ __(
											'Your license is active and valid',
											'rest-api-firewall'
										) }
									</Alert>

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
														textOverflow:
															'ellipsis',
														whiteSpace: 'nowrap',
													} }
													variant="body2"
													fontFamily="monospace"
												>
													{ status.key_masked }
												</Typography>
											</Box>

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
													{ formatDate(
														status.expires
													) }
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
														<Divider
															sx={ { my: 1 } }
														/>
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

									<Box sx={ { mb: 1 } }>
										<Typography
											variant="subtitle2"
											color="textSecondary"
											mb={ 1 }
										>
											{ __(
												'Update Email',
												'rest-api-firewall'
											) }
										</Typography>
										<Stack spacing={ 3 }>
											<TextField
												label={ __(
													'New Email',
													'rest-api-firewall'
												) }
												type="email"
												value={ email }
												onChange={ ( e ) =>
													setEmail( e.target.value )
												}
												fullWidth
												size="small"
												disabled={ loading }
											/>
											<TextField
												label={ __(
													'License Key',
													'rest-api-firewall'
												) }
												type="password"
												value={ licenseKey }
												onChange={ ( e ) =>
													setLicenseKey(
														e.target.value
													)
												}
												fullWidth
												size="small"
												disabled={ loading }
												helperText={ __(
													'Enter your license key to update',
													'rest-api-firewall'
												) }
											/>
										</Stack>
									</Box>

									<Stack gap={ 2 }>
										<Button
											onClick={ handleActivate }
											disabled={ loading }
											variant="contained"
											disableElevation
											color="primary"
											fullWidth
										>
											{ loading ? (
												<CircularProgress
													size={ 20 }
													sx={ { mr: 1 } }
												/>
											) : null }
											{ __(
												'Update',
												'rest-api-firewall'
											) }
										</Button>
										<Button
											onClick={ handleDeactivate }
											disabled={ loading }
											color="info"
											variant="outlined"
											fullWidth
										>
											{ __(
												'Revoke License',
												'rest-api-firewall'
											) }
										</Button>
									</Stack>
								</>
							) }

							{ ! isLicenseActive && (
								<>
									<Alert severity="info">
										{ __(
											'No active license found. Enter your license details to activate.',
											'rest-api-firewall'
										) }
									</Alert>

									<Stack gap={ 2 }>
										<TextField
											label={ __(
												'Email',
												'rest-api-firewall'
											) }
											type="email"
											value={ email }
											onChange={ ( e ) =>
												setEmail( e.target.value )
											}
											fullWidth
											disabled={ loading }
											placeholder={ __(
												'your@email.com',
												'rest-api-firewall'
											) }
										/>
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
											fullWidth
											disabled={ loading }
											placeholder={ __(
												'Your license key',
												'rest-api-firewall'
											) }
										/>
									</Stack>

									{ status?.message && (
										<Alert severity="error">
											{ status.message }
										</Alert>
									) }

									<Button
										onClick={ handleActivate }
										disabled={ loading }
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
										{ __(
											'Activate',
											'rest-api-firewall'
										) }
									</Button>
								</>
							) }
						</>
					) }
				</Stack>
			</Box>
		</Box>
	);

	return (
		<>
			<Button onClick={ toggleDrawer( true ) }>
				{ __( 'Manage License', 'rest-api-firewall' ) }
			</Button>
			<Drawer
				anchor="right"
				open={ licenseOpen }
				onClose={ toggleDrawer( false ) }
				sx={ {
					'& .MuiPaper-root': {
						height: {
							sm: 'calc(100% - 46px)',
							md: 'calc(100% - 32px)',
						},
						mt: { sm: '46px', md: '32px' },
					},
				} }
			>
				{ drawerContent }
			</Drawer>

			<Snackbar
				open={ snackbar.open }
				autoHideDuration={ 4000 }
				onClose={ handleCloseSnackbar }
				anchorOrigin={ { vertical: 'top', horizontal: 'center' } }
			>
				<Alert
					onClose={ handleCloseSnackbar }
					severity={ snackbar.severity }
					sx={ { width: '100%' } }
				>
					{ snackbar.message }
				</Alert>
			</Snackbar>
		</>
	);
}

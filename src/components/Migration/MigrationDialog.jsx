import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StorageIcon from '@mui/icons-material/Storage';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function MigrationDialog( {
	open,
	onClose,
	onDone,
	onOpenRequest,
	onNavigateToGlobalSettings,
	onCreateNewApp,
	migrationNeeded = false,
	schemaUpdateNeeded = false,
	migrationDone = false,
} ) {
	const scenario = schemaUpdateNeeded
		? 'schema_update'
		: migrationNeeded
		? 'free_to_pro'
		: 'already_migrated';
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	const [ title, setTitle ] = useState( '' );
	const [ enableImmediately, setEnableImmediately ] = useState( false );
	const [ running, setRunning ] = useState( false );
	const [ result, setResult ] = useState( null ); // null | { success: bool, message: string }
	const [ snackDismissed, setSnackDismissed ] = useState( false );

	useEffect( () => {
		if ( open ) {
			setTitle( '' );
			setEnableImmediately( false );
			setRunning( false );
			setResult( null );
		}
	}, [ open ] );

	const postAjax = async ( action, extraParams = {} ) => {
		const response = await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action,
				nonce: adminData.nonce,
				...extraParams,
			} ),
		} );
		return response.json();
	};

	const handleDone = () => onDone?.();

	const handleRetry = () => setResult( null );

	const canMigrate = title.trim().length > 0 && ! running;

	const handleMigrate = async () => {
		if ( ! canMigrate ) {
			return;
		}
		setRunning( true );
		try {
			const data = await postAjax( 'rest_api_firewall_pro_migrate', {
				title: title.trim(),
				enabled: enableImmediately ? '1' : '0',
			} );
			setResult( {
				success: !! data.success,
				message:
					data.data?.message ||
					( data.success
						? __( 'Migration completed!', 'rest-api-firewall' )
						: __( 'Migration failed.', 'rest-api-firewall' ) ),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message ||
					__( 'An unexpected error occurred.', 'rest-api-firewall' ),
			} );
		} finally {
			setRunning( false );
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' && canMigrate ) {
			handleMigrate();
		}
	};

	const handleSchemaUpdate = async () => {
		setRunning( true );
		try {
			const data = await postAjax(
				'rest_api_firewall_pro_update_schema'
			);
			setResult( {
				success: !! data.success,
				message:
					data.data?.message ||
					( data.success
						? __(
								'Database updated successfully.',
								'rest-api-firewall'
						  )
						: __( 'Update failed.', 'rest-api-firewall' ) ),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message ||
					__( 'An unexpected error occurred.', 'rest-api-firewall' ),
			} );
		} finally {
			setRunning( false );
		}
	};

	// Snack is only relevant for free→pro migration on the free tier side.
	// When pro license is valid, the auto-opening dialog + navigation item are sufficient.
	const showSnack =
		( migrationNeeded || schemaUpdateNeeded ) &&
		! hasValidLicense &&
		! migrationDone &&
		! open &&
		! snackDismissed;

	const snackbar = (
		<Snackbar
			open={ showSnack }
			anchorOrigin={ { vertical: 'bottom', horizontal: 'center' } }
			sx={ { mb: 2 } }
		>
			<Alert
				severity="warning"
				onClose={ () => setSnackDismissed( true ) }
				action={
					<Button
						variant="contained"
						disableElevation
						color="warning"
						size="small"
						onClick={ onOpenRequest }
					>
						{ schemaUpdateNeeded
							? __( 'Update Now', 'rest-api-firewall' )
							: __( 'Migrate Now', 'rest-api-firewall' ) }
					</Button>
				}
			>
				{ schemaUpdateNeeded
					? __(
							'Database update required — new columns need to be added.',
							'rest-api-firewall'
					  )
					: __(
							'Pro migration pending — your free settings have not been imported yet.',
							'rest-api-firewall'
					  ) }
			</Alert>
		</Snackbar>
	);

	if ( scenario === 'already_migrated' ) {
		return (
			<>
				<Dialog open={ open } maxWidth="sm" fullWidth>
					<DialogTitle
						sx={ {
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
						} }
					>
						<TaskAltIcon color="success" />
						{ __(
							'REST API Toolkit Pro — Already Set Up',
							'rest-api-firewall'
						) }
					</DialogTitle>
					<DialogContent>
						<Stack spacing={ 2 } pt={ 1 }>
							<Alert
								severity="success"
								icon={ <TaskAltIcon fontSize="inherit" /> }
							>
								{ __(
									'Your Pro configuration is already active. No action is required.',
									'rest-api-firewall'
								) }
							</Alert>
							<Typography variant="body2" color="text.secondary">
								{ __(
									'Your applications and settings are intact. You can manage them from the sidebar navigation.',
									'rest-api-firewall'
								) }
							</Typography>
						</Stack>
					</DialogContent>
					<DialogActions sx={ { px: 3, pb: 2 } }>
						<Button
							variant="contained"
							disableElevation
							onClick={ onClose }
						>
							{ __( 'Close', 'rest-api-firewall' ) }
						</Button>
					</DialogActions>
				</Dialog>
				{ snackbar }
			</>
		);
	}

	if ( scenario === 'schema_update' ) {
		return (
			<>
				<Dialog
					open={ open }
					maxWidth="sm"
					fullWidth
					disableEscapeKeyDown={ running }
				>
					<DialogTitle
						sx={ {
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
						} }
					>
						<StorageIcon color="warning" />
						{ __(
							'Database Update Required',
							'rest-api-firewall'
						) }
					</DialogTitle>
					<DialogContent>
						<Stack spacing={ 3 } pt={ 1 }>
							{ ! result && (
								<Stack spacing={ 2 }>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{ __(
											'The database schema needs to be updated to support new features. New columns will be added to existing tables — your data will not be affected.',
											'rest-api-firewall'
										) }
									</Typography>
									<Stack
										direction="row"
										spacing={ 1 }
										alignItems="center"
									>
										<Chip
											label={ __(
												'Schema update pending',
												'rest-api-firewall'
											) }
											color="warning"
											size="small"
											variant="outlined"
										/>
									</Stack>
								</Stack>
							) }

							{ running && (
								<Stack spacing={ 1 }>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{ __(
											'Updating database schema…',
											'rest-api-firewall'
										) }
									</Typography>
									<LinearProgress />
								</Stack>
							) }

							{ result && (
								<Alert
									severity={
										result.success ? 'success' : 'error'
									}
									icon={
										result.success ? (
											<CheckCircleOutlineIcon fontSize="inherit" />
										) : (
											<ErrorOutlineIcon fontSize="inherit" />
										)
									}
								>
									{ result.message }
								</Alert>
							) }
						</Stack>
					</DialogContent>
					<DialogActions sx={ { px: 3, pb: 2 } }>
						<Button
							variant="outlined"
							disabled={ running }
							onClick={ onClose }
						>
							{ __( 'Cancel', 'rest-api-firewall' ) }
						</Button>

						{ ! result && (
							<Button
								variant="contained"
								disableElevation
								disabled={ running }
								onClick={ handleSchemaUpdate }
							>
								{ __( 'Run Update', 'rest-api-firewall' ) }
							</Button>
						) }

						{ result?.success && (
							<Button
								variant="contained"
								disableElevation
								onClick={ handleDone }
							>
								{ __( 'Done', 'rest-api-firewall' ) }
							</Button>
						) }

						{ result && ! result.success && (
							<Button variant="outlined" onClick={ handleRetry }>
								{ __( 'Try Again', 'rest-api-firewall' ) }
							</Button>
						) }
					</DialogActions>
				</Dialog>
				{ snackbar }
			</>
		);
	}

	return (
		<>
			<Dialog
				open={ open }
				maxWidth="sm"
				fullWidth
				disableEscapeKeyDown={ running }
			>
				<DialogTitle
					sx={ { display: 'flex', alignItems: 'center', gap: 1.5 } }
				>
					<RocketLaunchOutlinedIcon color="primary" />
					{ __(
						'REST API Toolkit Pro — Import Existing Settings',
						'rest-api-firewall'
					) }
				</DialogTitle>

				<DialogContent>
					<Stack spacing={ 3 } pt={ 1 }>
						{ ! result && (
							<Stack spacing={ 3 }>
								<Typography
									component="p"
									variant="body2"
									color="text.secondary"
								>
									{ __(
										'Your existing free plugin settings will be imported into a new Pro application.',
										'rest-api-firewall'
									) }
									<br />
									{ __(
										'Give it a name so you can identify it later.',
										'rest-api-firewall'
									) }
								</Typography>

								<TextField
									label={ __(
										'Application Title',
										'rest-api-firewall'
									) }
									value={ title }
									onChange={ ( e ) =>
										setTitle( e.target.value )
									}
									onKeyDown={ handleKeyDown }
									disabled={ running }
									fullWidth
									autoFocus
									placeholder={ __(
										'e.g. My Website',
										'rest-api-firewall'
									) }
									size="small"
								/>

								<FormControlLabel
									control={
										<Checkbox
											checked={ enableImmediately }
											onChange={ ( e ) =>
												setEnableImmediately(
													e.target.checked
												)
											}
											disabled={ running }
											size="small"
										/>
									}
									label={ __(
										'Activate this application immediately',
										'rest-api-firewall'
									) }
								/>
							</Stack>
						) }

						{ running && (
							<Stack spacing={ 1 }>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{ __(
										'Migrating your settings…',
										'rest-api-firewall'
									) }
								</Typography>
								<LinearProgress />
							</Stack>
						) }

						{ result && (
							<Alert
								severity={
									result.success ? 'success' : 'error'
								}
								icon={
									result.success ? (
										<CheckCircleOutlineIcon fontSize="inherit" />
									) : (
										<ErrorOutlineIcon fontSize="inherit" />
									)
								}
							>
								{ result.message }
							</Alert>
						) }
					</Stack>
				</DialogContent>

				<DialogActions sx={ { px: 3, pb: 2 } }>
					<Button
						variant="outlined"
						disableElevation
						disabled={ running }
						onClick={ onClose }
					>
						{ __( 'Cancel', 'rest-api-firewall' ) }
					</Button>

					{ ! result && (
						<Button
							variant="contained"
							disableElevation
							onClick={ handleMigrate }
							disabled={ ! canMigrate }
						>
							{ __( 'Start Migration', 'rest-api-firewall' ) }
						</Button>
					) }

					{ result?.success && (
						<Button
							variant="contained"
							disableElevation
							onClick={ handleDone }
						>
							{ __( 'Done', 'rest-api-firewall' ) }
						</Button>
					) }

					{ result && ! result.success && (
						<Button variant="outlined" onClick={ handleRetry }>
							{ __( 'Try Again', 'rest-api-firewall' ) }
						</Button>
					) }
				</DialogActions>
			</Dialog>
			{ snackbar }
		</>
	);
}

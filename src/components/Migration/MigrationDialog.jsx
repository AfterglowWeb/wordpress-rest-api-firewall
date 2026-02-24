import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

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

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function MigrationDialog( { open, onClose, onDone } ) {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};

	const [ title, setTitle ] = useState( '' );
	const [ migrating, setMigrating ] = useState( false );
	const [ result, setResult ] = useState( null ); // null | { success: bool, message: string }

	useEffect( () => {
		if ( open ) {
			setTitle( '' );
			setMigrating( false );
			setResult( null );
		}
	}, [ open ] );

	if ( ! open ) {
		return null;
	}

	const canSubmit = title.trim().length > 0 && ! migrating;

	const handleMigrate = async () => {
		if ( ! canSubmit ) {
			return;
		}

		setMigrating( true );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'rest_api_firewall_pro_migrate',
					nonce: adminData.nonce,
					title: title.trim(),
				} ),
			} );

			const data = await response.json();

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
			setMigrating( false );
		}
	};

	const handleRetry = () => {
		setResult( null );
	};

	const handleDone = () => onDone?.();

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' && canSubmit ) {
			handleMigrate();
		}
	};

	return (
		<Dialog
			open={ open }
			maxWidth="sm"
			fullWidth
			disableEscapeKeyDown={ migrating }
		>
			<DialogTitle
				sx={ { display: 'flex', alignItems: 'center', gap: 1.5 } }
			>
				{ __(
					'REST API Toolkit Pro, Import Existing Settings',
					'rest-api-firewall'
				) }
			</DialogTitle>

			<DialogContent>
				<Stack spacing={ 3 } pt={ 1 }>
					{ /* Step 1 – no result yet */ }
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
								onChange={ ( e ) => setTitle( e.target.value ) }
								onKeyDown={ handleKeyDown }
								disabled={ migrating }
								fullWidth
								autoFocus
								placeholder={ __(
									'e.g. My Website',
									'rest-api-firewall'
								) }
								size="small"
							/>
						</Stack>
					) }

					{ /* Step 2 – migration in progress */ }
					{ migrating && (
						<Stack spacing={ 1 }>
							<Typography variant="body2" color="text.secondary">
								{ __(
									'Migrating your settings…',
									'rest-api-firewall'
								) }
							</Typography>
							<LinearProgress />
						</Stack>
					) }

					{ /* Step 3 – migration result */ }
					{ result && (
						<Alert
							severity={ result.success ? 'success' : 'error' }
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
					disabled={ migrating }
					onClick={ onClose }
				>
					{ __( 'Cancel', 'rest-api-firewall' ) }
				</Button>

				{ ! result && (
					<Button
						variant="contained"
						disableElevation
						onClick={ handleMigrate }
						disabled={ ! canSubmit }
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
	);
}

import { useState, useCallback } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';
import { useLicense } from '../contexts/LicenseContext';
import { useDialog, DIALOG_TYPES } from '../contexts/DialogContext';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import CachedIcon from '@mui/icons-material/Cached';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function ConfigurationPanel( {
	form,
	setField,
	schemaUpdateNeeded = false,
	onSchemaUpdated,
} ) {
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	const [ schemaRunning, setSchemaRunning ] = useState( false );
	const [ schemaResult, setSchemaResult ] = useState( null ); // null | { success, message }

	const handleSchemaUpdate = async () => {
		setSchemaRunning( true );
		setSchemaResult( null );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'rest_api_firewall_pro_update_schema',
					nonce: adminData.nonce,
				} ),
			} );
			const data = await response.json();
			const success = !! data.success;
			setSchemaResult( {
				success,
				message:
					data.data?.message ||
					( success
						? __(
								'Database updated successfully.',
								'rest-api-firewall'
						  )
						: __(
								'Update failed. Please try again.',
								'rest-api-firewall'
						  ) ),
			} );
			if ( success ) {
				setTimeout( () => onSchemaUpdated?.(), 1200 );
			}
		} catch ( err ) {
			setSchemaResult( {
				success: false,
				message:
					err.message ||
					__( 'An unexpected error occurred.', 'rest-api-firewall' ),
			} );
		} finally {
			setSchemaRunning( false );
		}
	};

	const [ flushRunning, setFlushRunning ] = useState( false );
	const [ flushResult,  setFlushResult  ] = useState( null );
	const { openDialog, closeDialog }       = useDialog();

	const runFlush = useCallback( async () => {
		setFlushRunning( true );
		setFlushResult( null );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'rest_api_firewall_flush_rewrite_rules',
					nonce:  adminData.nonce,
				} ),
			} );
			const json = await response.json();
			setFlushResult( {
				success: !! json?.success,
				message: json?.data?.message || ( json?.success
					? __( 'Done.', 'rest-api-firewall' )
					: __( 'An error occurred.', 'rest-api-firewall' ) ),
			} );
		} catch ( err ) {
			setFlushResult( { success: false, message: err.message } );
		} finally {
			setFlushRunning( false );
		}
	}, [ adminData, __ ] );

	const handleFlushRewriteRules = () => {
		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: __( 'Flush Rewrite Rules', 'rest-api-firewall' ),
			content: __( 'This will regenerate all WordPress rewrite rules. The site will continue to work normally.', 'rest-api-firewall' ),
			confirmLabel: __( 'Flush now', 'rest-api-firewall' ),
			onConfirm: () => {
				closeDialog();
				runFlush();
			},
		} );
	};

	return (
		<Stack spacing={ 0 } p={ 4 } flexGrow={ 1 } sx={ { maxWidth: 700 } }>
			{ hasValidLicense && (
				<>
					<Stack spacing={ 2 } mb={ 4 }>
						<Stack direction="row" alignItems="center" gap={ 1 }>
							<StorageIcon fontSize="small" color="action" />
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Database Schema', 'rest-api-firewall' ) }
							</Typography>
						</Stack>

						<Stack
							direction="row"
							alignItems="center"
							gap={ 2 }
							flexWrap="wrap"
						>
							{ schemaUpdateNeeded && ! schemaResult?.success ? (
								<Chip
									icon={ <WarningAmberIcon /> }
									label={ __(
										'Update required',
										'rest-api-firewall'
									) }
									color="warning"
									variant="outlined"
									size="small"
								/>
							) : (
								<Chip
									icon={ <CheckCircleOutlineIcon /> }
									label={ __(
										'Up to date',
										'rest-api-firewall'
									) }
									color="success"
									variant="outlined"
									size="small"
								/>
							) }

							{ schemaUpdateNeeded && ! schemaResult?.success && (
								<Button
									variant="contained"
									disableElevation
									size="small"
									disabled={ schemaRunning }
									startIcon={
										schemaRunning ? (
											<CircularProgress
												size={ 14 }
												color="inherit"
											/>
										) : null
									}
									onClick={ handleSchemaUpdate }
								>
									{ schemaRunning
										? __( 'Updating…', 'rest-api-firewall' )
										: __(
												'Run Update',
												'rest-api-firewall'
										  ) }
								</Button>
							) }
						</Stack>

						{ schemaResult && (
							<Alert
								severity={
									schemaResult.success ? 'success' : 'error'
								}
							>
								{ schemaResult.message }
							</Alert>
						) }

						<Typography variant="body2" color="text.secondary">
							{ __(
								'When a plugin update adds new database columns, run this to apply the changes. Existing data is never affected.',
								'rest-api-firewall'
							) }
						</Typography>
					</Stack>

					<Divider sx={ { mb: 4 } } />
				</>
			) }

			<Stack spacing={ 2 } mb={ 4 }>
				<Stack direction="row" alignItems="center" gap={ 1 }>
					<CachedIcon fontSize="small" color="action" />
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Rewrite Rules', 'rest-api-firewall' ) }
					</Typography>
				</Stack>

				<Typography variant="body2" color="text.secondary">
					{ __( 'Regenerate WordPress rewrite rules. Use this after updating the plugin to ensure URL rules are applied correctly.', 'rest-api-firewall' ) }
				</Typography>

				<Stack direction="row">
					<Button
						variant="outlined"
						size="small"
						disabled={ flushRunning }
						startIcon={ flushRunning ? <CircularProgress size={ 14 } color="inherit" /> : null }
						onClick={ handleFlushRewriteRules }
					>
						{ flushRunning
							? __( 'Flushing…', 'rest-api-firewall' )
							: __( 'Flush Rewrite Rules', 'rest-api-firewall' ) }
					</Button>
				</Stack>

				{ flushResult && (
					<Alert severity={ flushResult.success ? 'success' : 'error' }>
						{ flushResult.message }
					</Alert>
				) }
			</Stack>

			<Divider sx={ { mb: 4 } } />

			<Stack spacing={ 2 }>
				<Typography variant="subtitle1" fontWeight={ 600 }>
					{ __( 'Delete data on uninstall', 'rest-api-firewall' ) }
				</Typography>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ !! form.delete_options_on_uninstall }
								name="delete_options_on_uninstall"
								onChange={ setField }
							/>
						}
						label={ __( 'Delete Options', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __(
							'Delete plugin options in wp_options table.',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>

				{ hasValidLicense && (
					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.delete_tables_on_uninstall
									}
									name="delete_tables_on_uninstall"
									onChange={ setField }
								/>
							}
							label={ __( 'Delete Tables', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __(
								'Delete plugin tables from the database.',
								'rest-api-firewall'
							) }
						</FormHelperText>
					</FormControl>
				) }
			</Stack>
		</Stack>
	);
}

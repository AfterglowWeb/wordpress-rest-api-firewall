import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

export default function Webhook( { form, setField } ) {
	const { adminData } = useAdminData();

	const { __ } = wp.i18n || {};

	const webhookEvents = adminData?.webhook_events || {};
	const webhookEventGroups = adminData?.webhook_event_groups || {};
	const selectedEvents = form.application_webhook_auto_trigger_events || [];

	const handleEventToggle = ( eventKey ) => {
		const newEvents = selectedEvents.includes( eventKey )
			? selectedEvents.filter( ( e ) => e !== eventKey )
			: [ ...selectedEvents, eventKey ];

		setField( {
			target: {
				name: 'application_webhook_auto_trigger_events',
				value: newEvents,
				type: 'array',
			},
		} );
	};

	const getEventsByGroup = ( groupKey ) => {
		return Object.entries( webhookEvents ).filter(
			( [ , config ] ) => config.group === groupKey
		);
	};

	const [ hasSecret, setHasSecret ] = useState( null );
	const [ webhookSecret, setWebhookSecret ] = useState( null );
	const isRevealed = webhookSecret !== null;
	const isLoading = hasSecret === null;

	const [ snackbarOpen, setSnackbarOpen ] = useState( false );
	const [ snackbarSeverity, setSnackbarSeverity ] = useState( '' );
	const [ snackbarContent, setSnackbarContent ] = useState( '' );

	const [ confirmAction, setConfirmAction ] = useState( null ); // 'delete' | 'regenerate' | null
	const confirmOpen = Boolean( confirmAction );

	// Test webhook state
	const [ testEventKey, setTestEventKey ] = useState( '' );
	const [ testLoading, setTestLoading ] = useState( false );
	const [ testResult, setTestResult ] = useState( null );

	useEffect( () => {
		const checkSecret = async () => {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'has_application_webhook_secret',
					nonce: adminData.nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setHasSecret( Boolean( result.data.has_secret ) );
				setWebhookSecret( null );
			}
		};

		checkSecret();
	}, [ adminData ] );

	const regenerateWebhookSecret = async () => {
		const response = await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action: 'update_application_webhook_secret',
				nonce: adminData.nonce,
			} ),
		} );

		const result = await response.json();

		if ( result?.success ) {
			setWebhookSecret( result.data.secret ); // 👈 reveal now
			setHasSecret( true );

			setSnackbarOpen( true );
			setSnackbarSeverity( 'success' );
			setSnackbarContent(
				__(
					'Application webhook secret generated successfully.',
					'rest-api-firewall'
				)
			);
		}
	};

	const deleteWebhookSecret = async () => {
		const response = await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action: 'delete_application_webhook_secret',
				nonce: adminData.nonce,
			} ),
		} );

		const result = await response.json();

		if ( result?.success ) {
			setWebhookSecret( null );
			setHasSecret( false );

			setSnackbarOpen( true );
			setSnackbarSeverity( 'success' );
			setSnackbarContent( result.data.message || '' );
		}
	};

	const confirmConfig = {
		delete: {
			title: __( 'Revoke Webhook Secret', 'rest-api-firewall' ),
			content: __(
				'Any applications using this webhook secret will stop working. Continue?',
				'rest-api-firewall'
			),
			action: deleteWebhookSecret,
		},
		regenerate: {
			title: __( 'Regenerate Webhook Secret', 'rest-api-firewall' ),
			content: __(
				'Regenerating the webhook secret will invalidate the current one. Any applications using the old secret will stop working. Continue?',
				'rest-api-firewall'
			),
			action: regenerateWebhookSecret,
		},
	};

	const handleConfirm = async () => {
		if ( ! confirmAction ) {
			return;
		}
		await confirmConfig[ confirmAction ].action();
		setConfirmAction( null );
	};

	const handleTestWebhook = async () => {
		if ( ! testEventKey ) {
			return;
		}

		setTestLoading( true );
		setTestResult( null );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'test_webhook_event',
					nonce: adminData.nonce,
					event_key: testEventKey,
				} ),
			} );

			const result = await response.json();
			setTestResult( result );
		} catch ( error ) {
			setTestResult( {
				success: false,
				data: { message: error.message },
			} );
		} finally {
			setTestLoading( false );
		}
	};

	return (
		<Stack maxWidth="xl" spacing={ 3 }>
			
			<Grid container spacing={4}>
				
				<Grid size={{xs: 12, lg:6, xl:4 }}>
					<Stack spacing={4}>
					<Typography variant="subtitle1" fontWeight={ 600 } sx={ { mb: 2 } }>
						{ __( 'Webhook access', 'rest-api-firewall' ) }
					</Typography>
						<TextField
							label={ __( 'Application URL', 'rest-api-firewall' ) }
							name="application_host"
							helperText={ __(
								'Full application URL with protocol and port (e.g., https://example.local:5001).',
								'rest-api-firewall'
							) }
							value={ form.application_host }
							onChange={ setField }
							fullWidth
						/>
				
						<TextField
							label={ __( 'Application Webhook Endpoint', 'rest-api-firewall' ) }
							name="application_webhook_endpoint"
							helperText={ __(
								'The application endpoint used to trigger a webhook.',
								'rest-api-firewall'
							) }
							value={ form.application_webhook_endpoint }
							onChange={ setField }
							fullWidth
						/>
			
						<TextField
						label={ __( 'Application Webhook Secret', 'rest-api-firewall' ) }
							value={
								isLoading
									? __( 'Checking…', 'rest-api-firewall' )
									: ! hasSecret
									? __( 'Not generated', 'rest-api-firewall' )
									: isRevealed
									? webhookSecret
									: '••••••••••••••••••••••••••••••••'
							}
							type={ isRevealed ? 'text' : 'password' }
							disabled={ false }
							slotProps={ {
								input: {
									readOnly: true,
									endAdornment: isRevealed && (
										<InputAdornment position="end">
											<IconButton
												onClick={ () =>
													navigator.clipboard.writeText(
														webhookSecret
													)
												}
											>
												<ContentCopyIcon fontSize="small" />
											</IconButton>
										</InputAdornment>
									),
								},
							} }
							helperText={
								! hasSecret
									? __(
											'No webhook secret generated yet.',
											'rest-api-firewall'
									)
									: __(
											'Used to sign webhook requests.',
											'rest-api-firewall'
									)
							}
							fullWidth
						/>

						{ isRevealed && (
							<Alert severity="info">
								{ __(
									'This secret is shown only once. Copy it now and store it securely.',
									'rest-api-firewall'
								) }
							</Alert>
						) }

						<Stack
							direction="row"
							spacing={ 2 }
							alignItems="flex-start" 
						>
							<Button
								variant="outlined"
								size="small"
								sx={{ display: 'inline-flex' }}
								startIcon={ <DeleteOutlineIcon /> }
								onClick={ () => setConfirmAction( 'delete' ) }
								disabled={ ! hasSecret }
							>
								{ __( 'Revoke', 'rest-api-firewall' ) }
							</Button>

							<Button
								size="small"
								variant="contained"
								startIcon={ <AutorenewIcon /> }
								onClick={ () => setConfirmAction( 'regenerate' ) }
							>
								{ __( 'Regenerate', 'rest-api-firewall' ) }
							</Button>
						</Stack>

					</Stack>

				</Grid>

				<Grid size={{xs: 12, lg:6, xl:4 }}>
				
				<Typography variant="subtitle1" fontWeight={ 600 } sx={ { mb: 2 } }>
					{ __( 'Auto-trigger Events', 'rest-api-firewall' ) }
				</Typography>
				<FormHelperText sx={ { mb: 2 } }>
					{ __( 'Select WordPress events that will automatically trigger the webhook.', 'rest-api-firewall' ) }
				</FormHelperText>

				{ Object.entries( webhookEventGroups ).map( ( [ groupKey, groupLabel ] ) => {
					const groupEvents = getEventsByGroup( groupKey );
					if ( groupEvents.length === 0 ) return null;

					return (
						<Box key={ groupKey } sx={ { mb: 2 } }>
							<Typography variant="body2" color="text.secondary" sx={ { mb: 1 } }>
								{ groupLabel }
							</Typography>
							<FormGroup>
								{ groupEvents.map( ( [ eventKey, eventConfig ] ) => (
									<FormControl key={ eventKey }>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={ selectedEvents.includes( eventKey ) }
													onChange={ () => handleEventToggle( eventKey ) }
												/>
											}
											label={ eventConfig.label }
										/>
										<FormHelperText sx={ { ml: 4, mt: -0.5 } }>
											{ eventConfig.description }
										</FormHelperText>
									</FormControl>
								) ) }
							</FormGroup>
						</Box>
					);
				} ) }
		

					
				</Grid>
			
				<Grid size={{xs: 12, lg:6, xl:4 }}>
					<Stack spacing={3}>
					<Typography variant="subtitle1" fontWeight={ 600 } sx={ { mb: 2 } }>
						{ __( 'Test Webhook', 'rest-api-firewall' ) }
					</Typography>
					<FormHelperText sx={ { mb: 2 } }>
						{ __( 'Send a test webhook request to verify your configuration.', 'rest-api-firewall' ) }
					</FormHelperText>

					<Stack direction="row" spacing={ 2 } alignItems="flex-start" sx={ { mb: 2 } }>
						<FormControl sx={ { minWidth: 250 } }>
							<InputLabel id="test-event-label">
								{ __( 'Event', 'rest-api-firewall' ) }
							</InputLabel>
							<Select
								labelId="test-event-label"
								value={ testEventKey }
								onChange={ ( e ) => setTestEventKey( e.target.value ) }
								label={ __( 'Event', 'rest-api-firewall' ) }
							>
								<MenuItem value="">
									<em>{ __( 'Select an event', 'rest-api-firewall' ) }</em>
								</MenuItem>
								{ Object.entries( webhookEvents ).map( ( [ eventKey, eventConfig ] ) => (
									<MenuItem key={ eventKey } value={ eventKey }>
										{ eventConfig.label }
									</MenuItem>
								) ) }
							</Select>
						</FormControl>

						<Button
							variant="contained"
							size="small"
							startIcon={ testLoading ? <CircularProgress size={ 16 } color="inherit" /> : <PlayArrowIcon /> }
							onClick={ handleTestWebhook }
							disabled={ ! testEventKey || testLoading || ! hasSecret }
						>
							{ testLoading ? __( 'Testing...', 'rest-api-firewall' ) : __( 'Test', 'rest-api-firewall' ) }
						</Button>
					</Stack>

					{ testResult ? (
						<Card variant="outlined" sx={ { mt: 2 } }>
							<CardContent>
								<Stack direction="row" spacing={ 1 } alignItems="center" sx={ { mb: 2 } }>
									<Typography variant="subtitle2">
										{ __( 'Result', 'rest-api-firewall' ) }
									</Typography>
									<Chip
										label={ testResult.success ? __( 'Success', 'rest-api-firewall' ) : __( 'Error', 'rest-api-firewall' ) }
										color={ testResult.success ? 'success' : 'error' }
										size="small"
									/>
									{ testResult.data?.duration && (
										<Chip
											label={ `${ testResult.data.duration }ms` }
											variant="outlined"
											size="small"
										/>
									) }
									{ testResult.data?.response_code && (
										<Chip
											label={ `HTTP ${ testResult.data.response_code }` }
											variant="outlined"
											size="small"
										/>
									) }
								</Stack>

								{ testResult.data?.message && (
									<Alert severity="error" sx={ { mb: 2 } }>
										{ testResult.data.message }
									</Alert>
								) }

								{ testResult.data?.payload && (
									<Box sx={ { mb: 2 } }>
										<Typography variant="body2" color="text.secondary" sx={ { mb: 0.5 } }>
											{ __( 'Payload sent:', 'rest-api-firewall' ) }
										</Typography>
										<Box
											component="pre"
											sx={ {
												bgcolor: 'grey.100',
												p: 1.5,
												borderRadius: 1,
												fontSize: '0.75rem',
												overflow: 'auto',
												maxHeight: 150,
											} }
										>
											{ JSON.stringify( testResult.data.payload, null, 2 ) }
										</Box>
									</Box>
								) }

								{ testResult.data?.response_body && (
									<Box>
										<Typography variant="body2" color="text.secondary" sx={ { mb: 0.5 } }>
											{ __( 'Response:', 'rest-api-firewall' ) }
										</Typography>
										<Box
											component="pre"
											sx={ {
												bgcolor: 'grey.100',
												p: 1.5,
												borderRadius: 1,
												fontSize: '0.75rem',
												overflow: 'auto',
												maxHeight: 150,
											} }
										>
											{ testResult.data.response_body }
										</Box>
									</Box>
								) }
							</CardContent>
						</Card>
					) : 
						<Skeleton 
						animation={false}
						variant="rounded" 
						height={ 300 } />
					}

					<Alert severity="info">
							{ __(
								'You can edit the webhook payload through the "rest_firewall_application_webhook_body_payload" filter hook.',
								'rest-api-firewall'
							) }
					</Alert>
					</Stack>
				</Grid>

			</Grid>

			<Divider />

			
			<Dialog
				open={ confirmOpen }
				onClose={ () => setConfirmAction( null ) }
				aria-labelledby="confirm-dialog-title"
				maxWidth="xs"
			>
				<DialogTitle id="confirm-dialog-title">
					{ confirmAction && confirmConfig[ confirmAction ].title }
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{ confirmAction &&
							confirmConfig[ confirmAction ].content }
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={ () => setConfirmAction( null ) }
						variant="outlined"
					>
						{ __( 'Cancel', 'rest-api-firewall' ) }
					</Button>

					<Button onClick={ handleConfirm } variant="contained">
						{ __( 'Confirm', 'rest-api-firewall' ) }
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={ snackbarOpen }
				autoHideDuration={ 5000 }
				onClose={ () => setSnackbarOpen( false ) }
				anchorOrigin={ { vertical: 'bottom', horizontal: 'right' } }
			>
				<Alert
					onClose={ () => setSnackbarOpen( false ) }
					severity={ snackbarSeverity }
					sx={ { width: '100%' } }
				>
					{ snackbarContent }
				</Alert>
			</Snackbar>
		</Stack>
	);
}

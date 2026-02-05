import { useState } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


export default function WebhookTest( { hasSecret } ) {
	const { adminData } = useAdminData();

	const { __ } = wp.i18n || {};

	const webhookEvents = adminData?.webhook_events || {};

	const [ testEventKey, setTestEventKey ] = useState( '' );
	const [ testLoading, setTestLoading ] = useState( false );
	const [ testResult, setTestResult ] = useState( null );
	const [ errorMessage, setErrorMessage ] = useState( null );

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
			setErrorMessage( error.message );
		} finally {
			setTestLoading( false );
		}
	};

	console.log(testResult);

	return (
		<Stack spacing={ 2 } flex={1} maxWidth={500}>
			<Typography
				variant="subtitle1"
				fontWeight={ 600 }
				sx={ { mb: 2 } }
			>
				{ __( 'Test Webhook', 'rest-api-firewall' ) }
			</Typography>
			<FormHelperText sx={ { mb: 2 } }>
				{ __(
					'Send a test webhook request to verify your configuration.',
					'rest-api-firewall'
				) }
			</FormHelperText>

			<Stack
				direction="row"
				spacing={ 2 }
				alignItems="flex-start"
				sx={ { mb: 2 } }
			>
				<FormControl sx={ { minWidth: 250 } }>
					<InputLabel id="test-event-label">
						{ __( 'Event', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						labelId="test-event-label"
						value={ testEventKey }
						onChange={ ( e ) =>
							setTestEventKey( e.target.value )
						}
						label={ __( 'Event', 'rest-api-firewall' ) }
					>
						<MenuItem value="">
							<em>
								{ __(
									'Select an event',
									'rest-api-firewall'
								) }
							</em>
						</MenuItem>
						{ Object.entries( webhookEvents ).map(
							( [ eventKey, eventConfig ] ) => (
								<MenuItem
									key={ eventKey }
									value={ eventKey }
								>
									{ eventConfig.label }
								</MenuItem>
							)
						) }
					</Select>
				</FormControl>

				<Button
					variant="contained"
					size="small"
					startIcon={
						testLoading ? (
							<CircularProgress
								size={ 16 }
								color="inherit"
							/>
						) : (
							<PlayArrowIcon />
						)
					}
					onClick={ handleTestWebhook }
					disabled={
						! testEventKey || testLoading || ! hasSecret
					}
				>
					{ testLoading
						? __( 'Testing…', 'rest-api-firewall' )
						: __( 'Test', 'rest-api-firewall' ) }
				</Button>
			</Stack>

			{ testResult ? (
				<Card variant="outlined" sx={ { mt: 2 } }>
					<CardContent>
						<Stack
							direction="row"
							spacing={ 1 }
							alignItems="center"
							sx={ { mb: 2 } }
						>
							<Typography variant="subtitle2">
								{ __( 'Result', 'rest-api-firewall' ) }
							</Typography>
							<Chip
								label={
									testResult.data?.type === 'success'
										? __(
												'Success',
												'rest-api-firewall'
											)
										: __(
												'Error',
												'rest-api-firewall'
											)
								}
								color={
									testResult.data?.type === 'success'
										? 'success'
										: 'error'
								}
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

						{ errorMessage && (
							<Alert severity="error" sx={ { mb: 2 } }>
								{ errorMessage }
							</Alert>
						) }

						{ testResult.data?.endpoint && (
						<Box sx={ { mb: 2 } }>
							<Stack direction="row" alignItems="center" spacing={ 1 } sx={ { mb: 0.5 } }>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{ __(
										'Endpoint:',
										'rest-api-firewall'
									) }
								</Typography>
								<CopyButton toCopy={ testResult.data.endpoint } />
							</Stack>
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
								{ testResult.data.endpoint }
							</Box>
						</Box>
					) }

					{ testResult.data?.headers_sent && (
						<Box sx={ { mb: 2 } }>
							<Stack direction="row" alignItems="center" spacing={ 1 } sx={ { mb: 0.5 } }>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{ __(
										'Headers sent:',
										'rest-api-firewall'
									) }
								</Typography>
								<CopyButton toCopy={ JSON.stringify( testResult.data.headers_sent, null, 2 ) } />
							</Stack>
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
								{ JSON.stringify(
									testResult.data.headers_sent,
									null,
									2
								) }
							</Box>
						</Box>
					) }

					{ testResult.data?.payload && (
						<Box sx={ { mb: 2 } }>
							<Stack direction="row" alignItems="center" spacing={ 1 } sx={ { mb: 0.5 } }>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{ __(
										'Payload sent:',
										'rest-api-firewall'
									) }
								</Typography>
								<CopyButton toCopy={ JSON.stringify( testResult.data.payload, null, 2 ) } />
							</Stack>
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
									{ JSON.stringify(
										testResult.data.payload,
										null,
										2
									) }
								</Box>
							</Box>
						) }

						{ testResult.data?.response_body && (
							<Box>
								<Stack direction="row" alignItems="center" spacing={ 1 } sx={ { mb: 0.5 } }>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{ __(
											'Response:',
											'rest-api-firewall'
										) }
									</Typography>
									<CopyButton toCopy={ testResult.data.response_body } />
								</Stack>
								<Box
									component="pre"
									sx={ {
										bgcolor: 'grey.100',
										p: 1.5,
										borderRadius: 1,
										fontSize: '0.75rem',
										whiteSpace: 'wrap',
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
			) : (
				<Skeleton
					animation={ false }
					variant="rounded"
					height={ 300 }
					sx={{ maxWidth: '100%' }}
				/>
			) }

			<Alert 
			severity="info"
			sx={{ maxWidth: '100%' }}
			>
				{ __(
					'You can edit the webhook payload through the "rest_firewall_application_webhook_body_payload" filter hook.',
					'rest-api-firewall'
				) }
			</Alert>
		</Stack>
	);
}

function CopyButton( toCopy ) {

	const handleCopy = ( e ) => {
		e.stopPropagation();
		navigator.clipboard.writeText( toCopy || '' );
	};

	return (
	<Tooltip title="Copy">
		<IconButton
			size="small"
			onClick={ handleCopy }
			sx={ { p: 0.25 } }
		>
			<ContentCopyIcon sx={ { fontSize: 14 } } />
		</IconButton>
	</Tooltip>);
}

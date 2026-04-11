import { useState, useEffect } from '@wordpress/element';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';

import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const FREQUENCIES = [
	{ value: 'hourly', label: 'Hourly' },
	{ value: 'daily', label: 'Daily' },
	{ value: 'weekly', label: 'Weekly' },
	{ value: 'monthly', label: 'Monthly' },
];

export default function ScheduleConfig( {
	itemId,
	itemType, // 'automation' or 'webhook'
	nonce,
	adminData,
} ) {
	const { __ } = wp.i18n || {};

	const [ isRecurring, setIsRecurring ] = useState( false );
	const [ frequency, setFrequency ] = useState( 'daily' );
	const [ delaySeconds, setDelaySeconds ] = useState( 0 );
	const [ queueStatus, setQueueStatus ] = useState( {
		pending: 0,
		running: 0,
		completed: 0,
		failed: 0,
	} );
	const [ loading, setLoading ] = useState( false );
	const [ nextRunTime, setNextRunTime ] = useState( null );

	// Fetch queue status and config
	useEffect( () => {
		const fetchStatus = async () => {
			setLoading( true );
			try {
				const action = itemType === 'automation'
					? 'get_automation_schedule_config'
					: 'get_webhook_schedule_config';

				const response = await fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action,
						nonce,
						[ itemType === 'automation' ? 'automation_id' : 'webhook_id' ]: itemId,
					} ),
				} );
				const json = await response.json();

				if ( json.success && json.data ) {
					const config = json.data.config || {};
					setIsRecurring( config.enabled && config.frequency );
					setFrequency( config.frequency || 'daily' );

					// Get queue status
					const statusAction = itemType === 'automation'
						? 'get_automation_queue_status'
						: 'get_webhook_queue_status';

					const statusResponse = await fetch( adminData.ajaxurl, {
						method: 'POST',
						body: new URLSearchParams( {
							action: statusAction,
							nonce,
							[ itemType === 'automation' ? 'automation_id' : 'webhook_id' ]: itemId,
						} ),
					} );
					const statusJson = await statusResponse.json();

					if ( statusJson.success && statusJson.data ) {
						setQueueStatus( statusJson.data );
					}

					// Get next run time
					const nextRunAction = itemType === 'automation'
						? 'get_automation_next_run'
						: 'get_webhook_next_run';

					const nextRunResponse = await fetch( adminData.ajaxurl, {
						method: 'POST',
						body: new URLSearchParams( {
							action: nextRunAction,
							nonce,
							[ itemType === 'automation' ? 'automation_id' : 'webhook_id' ]: itemId,
						} ),
					} );
					const nextRunJson = await nextRunResponse.json();
					if ( nextRunJson.success && nextRunJson.data?.timestamp ) {
						setNextRunTime( new Date( nextRunJson.data.timestamp * 1000 ).toLocaleString() );
					}
				}
			} catch ( err ) {
				console.error( 'Failed to fetch schedule config:', err );
			} finally {
				setLoading( false );
			}
		};

		if ( itemId ) {
			fetchStatus();
		}
	}, [ itemId, itemType, nonce, adminData ] );

	const handleEnableRecurring = async () => {
		const action = itemType === 'automation'
			? 'enable_automation_recurring'
			: 'enable_webhook_recurring';

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action,
					nonce,
					[ itemType === 'automation' ? 'automation_id' : 'webhook_id' ]: itemId,
					frequency,
				} ),
			} );
			const json = await response.json();
			if ( json.success ) {
				setIsRecurring( true );
				// Refresh queue status
				setTimeout( () => window.location.reload?.(), 500 );
			}
		} catch ( err ) {
			console.error( 'Failed to enable recurring schedule:', err );
		}
	};

	const handleDisableRecurring = async () => {
		const action = itemType === 'automation'
			? 'disable_automation_recurring'
			: 'disable_webhook_recurring';

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action,
					nonce,
					[ itemType === 'automation' ? 'automation_id' : 'webhook_id' ]: itemId,
				} ),
			} );
			const json = await response.json();
			if ( json.success ) {
				setIsRecurring( false );
				setTimeout( () => window.location.reload?.(), 500 );
			}
		} catch ( err ) {
			console.error( 'Failed to disable recurring schedule:', err );
		}
	};

	const handleScheduleOneTime = async () => {
		const action = itemType === 'automation'
			? 'schedule_automation_run'
			: 'schedule_webhook_send';

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action,
					nonce,
					[ itemType === 'automation' ? 'automation_id' : 'webhook_id' ]: itemId,
					delay_seconds: String( parseInt( delaySeconds, 10 ) || 0 ),
				} ),
			} );
			const json = await response.json();
			if ( json.success ) {
				// Reset and refresh
				setDelaySeconds( '0' );
				setTimeout( () => window.location.reload?.(), 500 );
			}
		} catch ( err ) {
			console.error( 'Failed to schedule:', err );
		}
	};

	const totalQueued = queueStatus.pending + queueStatus.running;
	const totalProcessed = queueStatus.completed + queueStatus.failed;

	return (
		<Stack spacing={ 2 }>
			<Box>
				<Typography variant="subtitle1" fontWeight={ 600 }>
					{ __( 'Schedule', 'rest-api-firewall' ) }
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{ itemType === 'automation'
						? __( 'Configure when this automation runs.', 'rest-api-firewall' )
						: __( 'Configure when this webhook sends.', 'rest-api-firewall' )
					}
				</Typography>
			</Box>

			{ /* Queue Status */ }
			{ ( totalQueued > 0 || totalProcessed > 0 ) && (
				<Card variant="outlined">
					<CardContent sx={ { pb: '16px!important' } }>
						<Typography variant="caption" sx={ { textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', display: 'block', mb: 1.5 } }>
							{ __( 'Queue Status', 'rest-api-firewall' ) }
						</Typography>

						<Stack spacing={ 1.5 }>
							{ nextRunTime && (
								<Box>
									<Typography variant="caption" color="text.secondary">
										{ __( 'Next run', 'rest-api-firewall' ) }
									</Typography>
									<Typography variant="body2" sx={ { fontFamily: 'monospace' } }>
										{ nextRunTime }
									</Typography>
								</Box>
							) }

							<Stack direction="row" spacing={ 1 }>
								<Chip
									label={ `${ queueStatus.pending } ${ __( 'pending', 'rest-api-firewall' ) }` }
									size="small"
									variant={ queueStatus.pending > 0 ? 'filled' : 'outlined' }
									color={ queueStatus.pending > 0 ? 'info' : 'default' }
								/>
								<Chip
									label={ `${ queueStatus.running } ${ __( 'running', 'rest-api-firewall' ) }` }
									size="small"
									variant={ queueStatus.running > 0 ? 'filled' : 'outlined' }
									color={ queueStatus.running > 0 ? 'warning' : 'default' }
								/>
								<Chip
									label={ `${ queueStatus.completed } ${ __( 'completed', 'rest-api-firewall' ) }` }
									size="small"
									variant={ queueStatus.completed > 0 ? 'filled' : 'outlined' }
									color={ queueStatus.completed > 0 ? 'success' : 'default' }
								/>
								<Chip
									label={ `${ queueStatus.failed } ${ __( 'failed', 'rest-api-firewall' ) }` }
									size="small"
									variant={ queueStatus.failed > 0 ? 'filled' : 'outlined' }
									color={ queueStatus.failed > 0 ? 'error' : 'default' }
								/>
							</Stack>
						</Stack>
					</CardContent>
				</Card>
			) }

			{ /* One-time Schedule */ }
			<Card variant="outlined">
				<CardContent sx={ { pb: '16px!important' } }>
					<Typography variant="caption" sx={ { textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', display: 'block', mb: 1.5 } }>
						{ __( 'Run Once', 'rest-api-firewall' ) }
					</Typography>

					<Stack spacing={ 1.5 }>
						<TextField
							label={ __( 'Delay (seconds)', 'rest-api-firewall' ) }
							type="number"
							size="small"
							value={ delaySeconds }
							onChange={ ( e ) => setDelaySeconds( e.target.value ) }
							inputProps={ { min: 0, step: 1 } }
							sx={ { maxWidth: 160 } }
							helperText={ __( '0 = immediate', 'rest-api-firewall' ) }
						/>
						<Box>
							<Button
								variant="contained"
								size="small"
								onClick={ handleScheduleOneTime }
								disabled={ loading }
							>
								{ __( 'Schedule Now', 'rest-api-firewall' ) }
							</Button>
						</Box>
					</Stack>
				</CardContent>
			</Card>

			{ /* Recurring Schedule */ }
			<Card variant="outlined" sx={ { borderColor: isRecurring ? 'primary.main' : 'divider' } }>
				<CardContent sx={ { pb: '16px!important' } }>
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={ { mb: 1.5 } }>
						<Typography variant="caption" sx={ { textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', display: 'block' } }>
							{ __( 'Recurring Schedule', 'rest-api-firewall' ) }
						</Typography>
						<Chip
							label={ isRecurring ? __( 'Active', 'rest-api-firewall' ) : __( 'Inactive', 'rest-api-firewall' ) }
							size="small"
							color={ isRecurring ? 'success' : 'default' }
							variant={ isRecurring ? 'filled' : 'outlined' }
						/>
					</Stack>

					<Stack spacing={ 1.5 }>
						<FormControl size="small" sx={ { maxWidth: 200 } }>
							<InputLabel>{ __( 'Frequency', 'rest-api-firewall' ) }</InputLabel>
							<Select
								value={ frequency }
								onChange={ ( e ) => setFrequency( e.target.value ) }
								label={ __( 'Frequency', 'rest-api-firewall' ) }
								disabled={ isRecurring }
							>
								{ FREQUENCIES.map( ( f ) => (
									<MenuItem key={ f.value } value={ f.value }>
										{ f.label }
									</MenuItem>
								) ) }
							</Select>
						</FormControl>

						<Stack direction="row" spacing={ 1 }>
							{ isRecurring ? (
								<Button
									variant="outlined"
									size="small"
									startIcon={ <PauseIcon /> }
									onClick={ handleDisableRecurring }
									disabled={ loading }
								>
									{ __( 'Stop', 'rest-api-firewall' ) }
								</Button>
							) : (
								<Button
									variant="contained"
									size="small"
									startIcon={ <PlayArrowIcon /> }
									onClick={ handleEnableRecurring }
									disabled={ loading }
								>
									{ __( 'Enable', 'rest-api-firewall' ) }
								</Button>
							) }
						</Stack>
					</Stack>
				</CardContent>
			</Card>
		</Stack>
	);
}

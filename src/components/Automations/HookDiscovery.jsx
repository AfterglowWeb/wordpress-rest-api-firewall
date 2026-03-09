import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import SearchIcon from '@mui/icons-material/Search';
import StopIcon from '@mui/icons-material/Stop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DURATION_OPTIONS = [ 1, 5, 10, 15, 30 ];
const POLL_INTERVAL_MS = 4000;

function formatCountdown( totalSeconds ) {
	const m = Math.floor( totalSeconds / 60 );
	const s = totalSeconds % 60;
	return `${ m }:${ String( s ).padStart( 2, '0' ) }`;
}

function countHooks( grouped ) {
	return Object.values( grouped ).reduce( ( sum, arr ) => sum + arr.length, 0 );
}

export default function HookDiscovery() {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const [ open, setOpen ] = useState( false );
	const [ duration, setDuration ] = useState( 10 );
	// 'idle' | 'active' | 'done'
	const [ phase, setPhase ] = useState( 'idle' );
	const [ countdown, setCountdown ] = useState( 0 );
	const [ groupedHooks, setGroupedHooks ] = useState( {} );
	const [ starting, setSarting ] = useState( false );
	const [ showAllGroups, setShowAllGroups ] = useState( false );

	const pollRef = useRef( null );
	const timerRef = useRef( null );

	const stopIntervals = () => {
		clearInterval( pollRef.current );
		clearInterval( timerRef.current );
	};

	const fetchGroupedHooks = useCallback( async () => {
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'rest_api_firewall_pro_get_grouped_hooks',
					nonce,
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setGroupedHooks( json.data.grouped_hooks || {} );
				if ( json.data.discovery_enabled && phase === 'idle' ) {
					setPhase( 'active' );
				}
			}
		} catch {
			// Silently fail.
		}
	}, [ adminData, nonce, phase ] );

	useEffect( () => {
		if ( open ) {
			fetchGroupedHooks();
		}
	}, [ open ] );

	useEffect( () => {
		return () => stopIntervals();
	}, [] );

	const startDiscovery = async () => {
		setSarting( true );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'rest_api_firewall_pro_capture_hook',
					nonce,
					enable_discovery: '1',
					duration_minutes: String( duration ),
				} ),
			} );
			const json = await res.json();
			if ( ! json.success ) {
				return;
			}

			setPhase( 'active' );
			setCountdown( duration * 60 );
			setGroupedHooks( {} );
			setShowAllGroups( false );

			timerRef.current = setInterval( () => {
				setCountdown( ( prev ) => {
					if ( prev <= 1 ) {
						handleAutoStop();
						return 0;
					}
					return prev - 1;
				} );
			}, 1000 );

			pollRef.current = setInterval( fetchGroupedHooks, POLL_INTERVAL_MS );
			fetchGroupedHooks();
		} finally {
			setSarting( false );
		}
	};

	const handleAutoStop = () => {
		stopIntervals();
		fetchGroupedHooks();
		setPhase( 'done' );
	};

	const stopDiscovery = async () => {
		stopIntervals();
		await fetch( adminData.ajaxurl, {
			method: 'POST',
			body: new URLSearchParams( {
				action: 'rest_api_firewall_pro_capture_hook',
				nonce,
				enable_discovery: '0',
			} ),
		} );
		await fetchGroupedHooks();
		setPhase( 'done' );
		setCountdown( 0 );
	};

	const reset = () => {
		setPhase( 'idle' );
		setGroupedHooks( {} );
		setShowAllGroups( false );
	};

	const hookCount = countHooks( groupedHooks );
	const totalSeconds = duration * 60;
	const progress =
		phase === 'active' && totalSeconds > 0
			? ( ( totalSeconds - countdown ) / totalSeconds ) * 100
			: 0;

	const groupEntries = Object.entries( groupedHooks );
	const visibleGroups = showAllGroups
		? groupEntries
		: groupEntries.slice( 0, 6 );

	return (
		<Box
			sx={ {
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				overflow: 'hidden',
			} }
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={ 1.5 }
				sx={ {
					px: 2,
					py: 1.25,
					cursor: 'pointer',
					bgcolor: open ? 'action.hover' : 'transparent',
					'&:hover': { bgcolor: 'action.hover' },
				} }
				onClick={ () => setOpen( ( v ) => ! v ) }
			>
				<SearchIcon fontSize="small" color="action" />

				<Typography variant="subtitle2" fontWeight={ 600 } sx={ { flex: 1 } }>
					{ __( 'Hook Discovery', 'rest-api-firewall' ) }
				</Typography>

				{ phase === 'active' && (
					<Chip
						label={ __( 'Recording…', 'rest-api-firewall' ) }
						size="small"
						color="error"
					/>
				) }
				{ hookCount > 0 && phase !== 'active' && (
					<Chip
						label={ `${ hookCount } ${ __( 'hooks', 'rest-api-firewall' ) }` }
						size="small"
						color="default"
						variant="outlined"
					/>
				) }

				<ExpandMoreIcon
					fontSize="small"
					sx={ {
						color: 'text.secondary',
						transform: open ? 'rotate(180deg)' : 'none',
						transition: 'transform 0.2s',
					} }
				/>
			</Stack>

			{ phase === 'active' && (
				<LinearProgress
					variant="determinate"
					value={ progress }
					sx={ { height: 2 } }
				/>
			) }

			<Collapse in={ open }>
				<Stack spacing={ 2 } sx={ { p: 2 } }>
					<Stack direction="row" gap={ 2 } alignItems="center" flexWrap="wrap">
						{ phase !== 'active' ? (
							<>
								<FormControl size="small" sx={ { minWidth: 160 } }>
									<InputLabel>
										{ __( 'Duration', 'rest-api-firewall' ) }
									</InputLabel>
									<Select
										value={ duration }
										onChange={ ( e ) =>
											setDuration( e.target.value )
										}
										label={ __( 'Duration', 'rest-api-firewall' ) }
									>
										{ DURATION_OPTIONS.map( ( m ) => (
											<MenuItem key={ m } value={ m }>
												{ m }{ ' ' }
												{ __( 'min', 'rest-api-firewall' ) }
											</MenuItem>
										) ) }
									</Select>
								</FormControl>

								<Button
									variant="contained"
									size="small"
									disableElevation
									startIcon={ <SearchIcon /> }
									onClick={ startDiscovery }
									disabled={ starting }
								>
									{ __( 'Start Recording', 'rest-api-firewall' ) }
								</Button>

								{ phase === 'done' && (
									<Button
										variant="text"
										size="small"
										onClick={ reset }
									>
										{ __( 'Reset', 'rest-api-firewall' ) }
									</Button>
								) }
							</>
						) : (
							<>
								<Typography
									variant="body2"
									fontFamily="monospace"
									fontWeight={ 600 }
								>
									{ formatCountdown( countdown ) }
								</Typography>

								<Typography variant="body2" color="text.secondary">
									{ hookCount > 0
										? `${ hookCount } ${ __( 'hooks captured so far', 'rest-api-firewall' ) }`
										: __( 'Waiting for hooks…', 'rest-api-firewall' ) }
								</Typography>

								<Button
									variant="outlined"
									size="small"
									color="error"
									startIcon={ <StopIcon /> }
									onClick={ stopDiscovery }
								>
									{ __( 'Stop', 'rest-api-firewall' ) }
								</Button>
							</>
						) }
					</Stack>

					{ phase === 'active' && (
						<Alert severity="info" sx={ { py: 0.5 } }>
							{ __(
								'Open other browser tabs and browse your site — visit pages, submit forms, log in/out, trigger plugin features. Every WordPress hook that fires will be captured.',
								'rest-api-firewall'
							) }
						</Alert>
					) }

					{ phase === 'idle' && hookCount === 0 && (
						<Typography variant="body2" color="text.secondary">
							{ __(
								'Records every WordPress hook that fires during a browsing session. Use the captured hooks to configure automation triggers.',
								'rest-api-firewall'
							) }
						</Typography>
					) }

					{ hookCount > 0 && (
						<Stack spacing={ 1 }>
							{ phase === 'done' && (
								<Typography variant="body2" color="text.secondary">
									{ __(
										'Discovery complete.',
										'rest-api-firewall'
									) }{ ' ' }
									<strong>{ hookCount }</strong>{ ' ' }
									{ __( 'unique hooks captured.', 'rest-api-firewall' ) }
								</Typography>
							) }

							<Box
								sx={ {
									maxHeight: 260,
									overflow: 'auto',
									bgcolor: 'grey.50',
									borderRadius: 1,
									p: 1.5,
								} }
							>
								{ visibleGroups.map( ( [ prefix, hooks ] ) => (
									<Box key={ prefix } sx={ { mb: 1.5 } }>
										<Typography
											variant="caption"
											fontWeight={ 700 }
											color="text.secondary"
											sx={ {
												textTransform: 'uppercase',
												letterSpacing: '0.05em',
											} }
										>
											{ prefix }{ ' ' }
											<span style={ { fontWeight: 400 } }>
												({ hooks.length })
											</span>
										</Typography>

										<Box sx={ { mt: 0.5 } }>
											{ hooks.map( ( hook ) => (
												<Chip
													key={ hook }
													label={ hook }
													size="small"
													variant="outlined"
													sx={ {
														m: 0.25,
														fontFamily: 'monospace',
														fontSize: '0.7rem',
														height: 22,
													} }
												/>
											) ) }
										</Box>
									</Box>
								) ) }

								{ ! showAllGroups &&
									groupEntries.length > 6 && (
										<Button
											size="small"
											variant="text"
											onClick={ () =>
												setShowAllGroups( true )
											}
										>
											{ __( 'Show all groups', 'rest-api-firewall' ) }{ ' ' }
											({ groupEntries.length - 6 }{ ' ' }
											{ __( 'more', 'rest-api-firewall' ) })
										</Button>
									) }
							</Box>
						</Stack>
					) }
				</Stack>
			</Collapse>
		</Box>
	);
}

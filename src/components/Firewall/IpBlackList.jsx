import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import PublicIcon from '@mui/icons-material/Public';
import TableViewIcon from '@mui/icons-material/TableView';

import ProBadge from '../ProBadge';
import IpDataGrid from './IpDataGrid';
import CountryBlockList from './CountryBlockList';

const IP_REGEX =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const CIDR_REGEX =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
const IPV6_REGEX =
	/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:(:([0-9a-fA-F]{1,4})){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;

function isValidIp( value ) {
	if ( ! value ) {
		return false;
	}
	const trimmed = value.trim();
	return IP_REGEX.test( trimmed ) || IPV6_REGEX.test( trimmed );
}

function isValidCidr( value ) {
	if ( ! value ) {
		return false;
	}
	return CIDR_REGEX.test( value.trim() );
}

function isValidIpOrCidr( value ) {
	return isValidIp( value ) || isValidCidr( value );
}

export default function IpBlackList() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const { openDialog, updateDialog } = useDialog();

	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );

	const [ settings, setSettings ] = useState( {
		enabled: false,
		mode: 'blacklist',
		whitelist: [],
		blacklist: [],
	} );
	const [ clientIp, setClientIp ] = useState( '' );
	const [ newIp, setNewIp ] = useState( '' );
	const [ ipError, setIpError ] = useState( '' );
	const [ dialogOpen, setDialogOpen ] = useState( false );
	const [ dialogTab, setDialogTab ] = useState( 0 );

	const { hasValidLicense } = useLicense();
	const isIpFilterDisabled = ! settings.enabled;
	const isDisabled = ! hasValidLicense || isIpFilterDisabled;

	const activeList =
		settings.mode === 'whitelist' ? settings.whitelist : settings.blacklist;
	const activeListKey =
		settings.mode === 'whitelist' ? 'whitelist' : 'blacklist';

	const countryStats = activeList.reduce( ( acc, entry ) => {
		const country = entry?.geoIp?.countryName || null;
		if ( country ) {
			acc[ country ] = ( acc[ country ] || 0 ) + 1;
		}
		return acc;
	}, {} );

	const topCountries = Object.entries( countryStats )
		.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
		.slice( 0, 10 );

	const countryStats = activeList.reduce( ( acc, entry ) => {
		const country = entry?.geoIp?.countryName || null;
		if ( country ) {
			acc[ country ] = ( acc[ country ] || 0 ) + 1;
		}
		return acc;
	}, {} );

	const topCountries = Object.entries( countryStats )
		.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
		.slice( 0, 10 );

	const loadSettings = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_ip_filter',
					nonce: adminData.nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setSettings( {
					enabled: result.data.enabled ?? false,
					mode: result.data.mode ?? 'blacklist',
					whitelist: result.data.whitelist ?? [],
					blacklist: result.data.blacklist ?? [],
				} );
				setClientIp( result.data.client_ip ?? '' );
			}
		} catch ( error ) {
			console.error( 'Error loading IP filter settings:', error );
		} finally {
			setLoading( false );
		}
	}, [ adminData ] );

	useEffect( () => {
		loadSettings();
	}, [ loadSettings ] );

	const handleSave = async () => {
		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: __( 'Confirm Save', 'rest-api-firewall' ),
			content: __(
				'Are you sure you want to save the IP filter settings?',
				'rest-api-firewall'
			),
			onConfirm: async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __(
						'Saving IP filter settings…',
						'rest-api-firewall'
					),
				} );

				setSaving( true );

				try {
					const response = await fetch( adminData.ajaxurl, {
						method: 'POST',
						headers: {
							'Content-Type':
								'application/x-www-form-urlencoded; charset=UTF-8',
						},
						body: new URLSearchParams( {
							action: 'save_ip_filter',
							nonce: adminData.nonce,
							enabled: settings.enabled ? '1' : '0',
							mode: settings.mode,
							whitelist: JSON.stringify( settings.whitelist ),
							blacklist: JSON.stringify( settings.blacklist ),
						} ),
					} );

					const result = await response.json();

					if ( result?.success ) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: __( 'Success', 'rest-api-firewall' ),
							content: __(
								'IP filter settings saved successfully!',
								'rest-api-firewall'
							),
							autoClose: 2000,
						} );
					} else {
						updateDialog( {
							type: DIALOG_TYPES.ERROR,
							title: __( 'Error', 'rest-api-firewall' ),
							content:
								result?.data?.message ||
								__(
									'Failed to save settings',
									'rest-api-firewall'
								),
						} );
					}
				} catch ( error ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: error.message,
					} );
				} finally {
					setSaving( false );
				}
			},
		} );
	};

	const handleToggleEnabled = ( e ) => {
		setSettings( ( prev ) => ( { ...prev, enabled: e.target.checked } ) );
	};

	const handleModeChange = ( e ) => {
		setSettings( ( prev ) => ( { ...prev, mode: e.target.value } ) );
	};

	const handleNewIpChange = ( e ) => {
		setNewIp( e.target.value );
		setIpError( '' );
	};

	const handleAddIp = () => {
		const trimmed = newIp.trim();

		if ( ! trimmed ) {
			setIpError(
				__( 'Please enter an IP address', 'rest-api-firewall' )
			);
			return;
		}

		if ( isValidCidr( trimmed ) && ! hasValidLicense ) {
			setIpError(
				__( 'CIDR ranges require Pro license', 'rest-api-firewall' )
			);
			return;
		}

		if ( isValidCidr( trimmed ) && ! hasValidLicense ) {
			setIpError(
				__( 'CIDR ranges require Pro license', 'rest-api-firewall' )
			);
			return;
		}

		if ( ! isValidIpOrCidr( trimmed ) ) {
			setIpError( __( 'Invalid IP address', 'rest-api-firewall' ) );
			return;
		}

		const listKey =
			settings.mode === 'whitelist' ? 'whitelist' : 'blacklist';
		const currentList = settings[ listKey ];

		const isDuplicate = currentList.some( ( item ) => {
			const itemIp = typeof item === 'string' ? item : item.ip;
			return itemIp === trimmed;
		} );

		if ( isDuplicate ) {
			setIpError(
				__( 'This IP is already in the list', 'rest-api-firewall' )
			);
			return;
		}

		const ipEntry = {
			ip: trimmed,
			agent: null,
			blocked_time: Math.floor( Date.now() / 1000 ),
			type: 'manual',
			geoIp: {
				country: null,
				countryName: null,
			},
		};

		setSettings( ( prev ) => ( {
			...prev,
			[ listKey ]: [ ...prev[ listKey ], ipEntry ],
		} ) );
		setNewIp( '' );
		setIpError( '' );
	};

	const handleRemoveIp = ( listKey, ip ) => {
		setSettings( ( prev ) => ( {
			...prev,
			[ listKey ]: prev[ listKey ].filter( ( item ) => {
				const itemIp = typeof item === 'string' ? item : item.ip;
				return itemIp !== ip;
			} ),
		} ) );
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAddIp();
		}
	};

	if ( loading ) {
		return (
			<Box sx={ { py: 2 } }>
				<Typography color="text.secondary">
					{ __( 'Loading…', 'rest-api-firewall' ) }
				</Typography>
			</Box>
		);
	}

	const recentIps = [ ...activeList ]
		.sort( ( a, b ) => ( b?.blocked_time || 0 ) - ( a?.blocked_time || 0 ) )
		.slice( 0, 5 );

	return (
		<Stack spacing={ 3 }>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
			>
				<Typography variant="subtitle1" fontWeight={ 600 }>
					{ __( 'IP Filtering', 'rest-api-firewall' ) }
				</Typography>
				<Button
					variant="contained"
					size="small"
					disableElevation
					onClick={ handleSave }
					disabled={ saving }
				>
					{ __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Stack>

			<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 3 }>
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={ settings.enabled }
								onChange={ handleToggleEnabled }
								size="small"
							/>
						}
						label={ __(
							'Enable IP Filtering',
							'rest-api-firewall'
						) }
					/>
					<FormHelperText>
						{ __(
							'Block or allow requests based on IP address',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>

				<FormControl
					sx={ { minWidth: 200, position: 'relative' } }
					disabled={ isDisabled }
				>
					<ProBadge position="bottom-right" />
					<InputLabel id="ip-mode-label">
						{ __( 'Filter Mode', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						labelId="ip-mode-label"
						value={ settings.mode }
						onChange={ handleModeChange }
						label={ __( 'Filter Mode', 'rest-api-firewall' ) }
						size="small"
					>
						<MenuItem value="blacklist">
							{ __( 'Blacklist', 'rest-api-firewall' ) }
						</MenuItem>
						{ hasValidLicense && (
							<MenuItem value="whitelist">
								{ __( 'Whitelist', 'rest-api-firewall' ) }
							</MenuItem>
						) }
					</Select>
					<FormHelperText>
						{ settings.mode === 'blacklist'
							? __( 'Block listed IPs', 'rest-api-firewall' )
							: __(
									'Allow only listed IPs',
									'rest-api-firewall'
							  ) }
					</FormHelperText>
				</FormControl>
			</Stack>

			{ clientIp &&
				clientIp !== '0.0.0.0' &&
				settings.mode === 'whitelist' && (
					<Alert severity="info" sx={ { alignItems: 'center' } }>
						<Stack
							direction="row"
							spacing={ 1 }
							alignItems="center"
						>
							<Typography variant="body2">
								{ __(
									'Your current IP:',
									'rest-api-firewall'
								) }
							</Typography>
							<Chip
								label={ clientIp }
								size="small"
								variant="outlined"
							/>
							<Button
								size="small"
								onClick={ () => setNewIp( clientIp ) }
							>
								{ __(
									'Add to whitelist',
									'rest-api-firewall'
								) }
							</Button>
						</Stack>
					</Alert>
				) }

			<Divider />

			<Stack spacing={ 3 }>
				<Box sx={ { flex: 1 } }>
					<Typography variant="subtitle2" sx={ { mb: 1 } }>
						{ __( 'Add IP Address Manually', 'rest-api-firewall' ) }
					</Typography>
					<Stack direction="row" spacing={ 1 }>
						<TextField
							value={ newIp }
							onChange={ handleNewIpChange }
							onKeyDown={ handleKeyDown }
							placeholder={
								hasValidLicense
									? '192.168.1.1 or 10.0.0.0/24'
									: '192.168.1.1'
							}
							size="small"
							error={ !! ipError }
							helperText={
								ipError ||
								( hasValidLicense
									? __(
											'IP address or CIDR range',
											'rest-api-firewall'
									  )
									: __(
											'IP address (CIDR requires Pro)',
											'rest-api-firewall'
									  ) )
							}
							disabled={ ! settings.enabled }
							sx={ { flexGrow: 1 } }
						/>
						<Button
							variant="outlined"
							sx={ { alignSelf: 'flex-start' } }
							onClick={ handleAddIp }
							disabled={ ! settings.enabled || ! newIp.trim() }
							startIcon={ <AddIcon /> }
						>
							{ __( 'Add', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				</Box>

				<Box sx={ { minWidth: 280 } }>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
						sx={ { mb: 1 } }
					>
						<Typography variant="subtitle2">
							{ __( 'Blocked IPs', 'rest-api-firewall' ) }
							<Chip
								label={ activeList.length }
								size="small"
								sx={ { ml: 1 } }
							/>
						</Typography>
						<Button
							variant="outlined"
							size="small"
							onClick={ () => setDialogOpen( true ) }
							disabled={ ! settings.enabled }
							startIcon={ <TableViewIcon /> }
						>
							{ __( 'Manage', 'rest-api-firewall' ) }
						</Button>
					</Stack>

					{ topCountries.length > 0 ? (
						<Stack direction="row" flexWrap="wrap" gap={ 0.5 }>
							{ topCountries.map( ( [ country, count ] ) => (
								<Chip
									key={ country }
									icon={ <PublicIcon /> }
									label={ `${ country }: ${ count }` }
									size="small"
									variant="outlined"
								/>
							) ) }
						</Stack>
					) : (
						<Typography variant="body2" color="text.secondary">
							{ activeList.length > 0
								? __(
										'No country data available',
										'rest-api-firewall'
								  )
								: __(
										'No IPs blocked yet',
										'rest-api-firewall'
								  ) }
						</Typography>
					) }
				</Box>
			</Stack>

			{ recentIps.length > 0 && (
				<Box>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={ { mb: 0.5, display: 'block' } }
					>
						{ __( 'Recent:', 'rest-api-firewall' ) }
					</Typography>
					<Stack direction="row" flexWrap="wrap" gap={ 0.5 }>
						{ recentIps.map( ( entry ) => {
							const ipValue =
								typeof entry === 'string' ? entry : entry.ip;
							return (
								<Chip
									key={ ipValue }
									label={ ipValue }
									size="small"
									onDelete={
										settings.enabled
											? () =>
													handleRemoveIp(
														activeListKey,
														ipValue
													)
											: undefined
									}
									sx={ {
										fontFamily: 'monospace',
										fontSize: '0.75rem',
									} }
								/>
							);
						} ) }
						{ activeList.length > 5 && (
							<Chip
								label={ `+${ activeList.length - 5 } more` }
								size="small"
								variant="outlined"
								onClick={ () => setDialogOpen( true ) }
							/>
						) }
					</Stack>
				</Box>
			) }

			<Dialog
				open={ dialogOpen }
				onClose={ () => setDialogOpen( false ) }
				maxWidth={ false }
				fullWidth
				fullScreen={ true }
				keepMounted={ true }
				sx={ { ml: { xs: 0, sm: '45px', lg: '160px' }, mt: '32px' } }
			>
				<DialogTitle
					sx={ {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 1,
						pb: 0,
					} }
				>
					<IconButton
						onClick={ () => setDialogOpen( false ) }
						size="large"
					>
						<ArrowBackIosIcon
							color="primary"
							sx={ { transform: 'translateX(4px)' } }
						/>
					</IconButton>
					<Typography variant="h6">
						{ settings.mode === 'whitelist'
							? __(
									'Manage Whitelisted IPs',
									'rest-api-firewall'
							  )
							: __(
									'Manage Blacklisted IPs',
									'rest-api-firewall'
							  ) }
					</Typography>
					<IconButton onClick={ () => setDialogOpen( false ) }>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent sx={ { pt: 0 } }>
					<Tabs
						value={ dialogTab }
						onChange={ ( e, newValue ) => setDialogTab( newValue ) }
						sx={ {
							mb: 2,
							borderBottom: 1,
							borderColor: 'divider',
						} }
					>
						<Tab
							icon={ <PublicIcon /> }
							iconPosition="start"
							label={ __( 'By Country', 'rest-api-firewall' ) }
						/>
						<Tab
							icon={ <TableViewIcon /> }
							iconPosition="start"
							label={ __( 'All IPs', 'rest-api-firewall' ) }
						/>
					</Tabs>

					{ dialogTab === 0 && (
						<CountryBlockList
							listType={ activeListKey }
							freeEntries={ activeList }
						/>
					) }

					{ dialogTab === 1 && (
						<IpDataGrid
							listType={ activeListKey }
							onClose={ () => setDialogOpen( false ) }
							freeEntries={ activeList }
						/>
					) }
				</DialogContent>
			</Dialog>
		</Stack>
	);
}

import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const CIDR_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
const IPV6_REGEX = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:(:([0-9a-fA-F]{1,4})){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;

function isValidIpOrCidr( value ) {
	if ( ! value ) return false;
	const trimmed = value.trim();
	return IP_REGEX.test( trimmed ) || CIDR_REGEX.test( trimmed ) || IPV6_REGEX.test( trimmed );
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

	const loadSettings = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
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
			content: __( 'Are you sure you want to save the IP filter settings?', 'rest-api-firewall' ),
			onConfirm: async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Saving IP filter settings...', 'rest-api-firewall' ),
				} );

				setSaving( true );

				try {
					const response = await fetch( adminData.ajaxurl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
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
							content: __( 'IP filter settings saved successfully!', 'rest-api-firewall' ),
							autoClose: 2000,
						} );
					} else {
						updateDialog( {
							type: DIALOG_TYPES.ERROR,
							title: __( 'Error', 'rest-api-firewall' ),
							content: result?.data?.message || __( 'Failed to save settings', 'rest-api-firewall' ),
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
			setIpError( __( 'Please enter an IP address', 'rest-api-firewall' ) );
			return;
		}

		if ( ! isValidIpOrCidr( trimmed ) ) {
			setIpError( __( 'Invalid IP address or CIDR range', 'rest-api-firewall' ) );
			return;
		}

		const listKey = settings.mode === 'whitelist' ? 'whitelist' : 'blacklist';
		const currentList = settings[ listKey ];

		if ( currentList.includes( trimmed ) ) {
			setIpError( __( 'This IP is already in the list', 'rest-api-firewall' ) );
			return;
		}

		setSettings( ( prev ) => ( {
			...prev,
			[ listKey ]: [ ...prev[ listKey ], trimmed ],
		} ) );
		setNewIp( '' );
		setIpError( '' );
	};

	const handleRemoveIp = ( listKey, ip ) => {
		setSettings( ( prev ) => ( {
			...prev,
			[ listKey ]: prev[ listKey ].filter( ( item ) => item !== ip ),
		} ) );
	};

	const handleAddCurrentIp = () => {
		if ( clientIp && clientIp !== '0.0.0.0' ) {
			setNewIp( clientIp );
		}
	};

	const handleKeyPress = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAddIp();
		}
	};

	const activeList = settings.mode === 'whitelist' ? settings.whitelist : settings.blacklist;
	const activeListKey = settings.mode === 'whitelist' ? 'whitelist' : 'blacklist';

	if ( loading ) {
		return (
			<Box sx={ { py: 2 } }>
				<Typography color="text.secondary">{ __( 'Loading...', 'rest-api-firewall' ) }</Typography>
			</Box>
		);
	}

	return (
		<Stack spacing={ 3 }>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Typography variant="subtitle1" fontWeight={ 600 }>
					{ __( 'IP Filtering', 'rest-api-firewall' ) }
				</Typography>
				<Button
					variant="contained"
					size="small"
					onClick={ handleSave }
					disabled={ saving }
				>
					{ __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Stack>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={ 3 }>
				<FormControl>
					<FormControlLabel
						control={
							<Switch
								checked={ settings.enabled }
								onChange={ handleToggleEnabled }
								size="small"
							/>
						}
						label={ __( 'Enable IP Filtering', 'rest-api-firewall' ) }
					/>
					<FormHelperText>
						{ __( 'Block or allow requests based on IP address', 'rest-api-firewall' ) }
					</FormHelperText>
				</FormControl>

				<FormControl sx={ { minWidth: 200 } }>
					<InputLabel id="ip-mode-label">{ __( 'Filter Mode', 'rest-api-firewall' ) }</InputLabel>
					<Select
						labelId="ip-mode-label"
						value={ settings.mode }
						onChange={ handleModeChange }
						label={ __( 'Filter Mode', 'rest-api-firewall' ) }
						size="small"
						disabled={ ! settings.enabled }
					>
						<MenuItem value="blacklist">{ __( 'Blacklist', 'rest-api-firewall' ) }</MenuItem>
						<MenuItem value="whitelist">{ __( 'Whitelist', 'rest-api-firewall' ) }</MenuItem>
					</Select>
					<FormHelperText>
						{ settings.mode === 'blacklist'
							? __( 'Block listed IPs, allow all others', 'rest-api-firewall' )
							: __( 'Allow only listed IPs, block all others', 'rest-api-firewall' ) }
					</FormHelperText>
				</FormControl>
			</Stack>

			{ clientIp && clientIp !== '0.0.0.0' && (
				<Alert severity="info" sx={ { alignItems: 'center' } }>
					<Stack direction="row" spacing={ 1 } alignItems="center">
						<Typography variant="body2">
							{ __( 'Your current IP:', 'rest-api-firewall' ) }
						</Typography>
						<Chip label={ clientIp } size="small" variant="outlined" />
						<Button size="small" onClick={ handleAddCurrentIp }>
							{ __( 'Add to list', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				</Alert>
			) }

			{ settings.mode === 'whitelist' && settings.enabled && settings.whitelist.length === 0 && (
				<Alert severity="warning">
					{ __( 'Warning: Whitelist mode is enabled but the list is empty. No IPs will be blocked until you add entries.', 'rest-api-firewall' ) }
				</Alert>
			) }

			<Divider />

			<Box>
				<Typography variant="subtitle2" sx={ { mb: 1 } }>
					{ settings.mode === 'whitelist'
						? __( 'Whitelisted IPs', 'rest-api-firewall' )
						: __( 'Blacklisted IPs', 'rest-api-firewall' ) }
					<Chip
						label={ activeList.length }
						size="small"
						sx={ { ml: 1 } }
					/>
				</Typography>

				<Stack direction="row" spacing={ 1 } sx={ { mb: 2 } }>
					<TextField
						value={ newIp }
						onChange={ handleNewIpChange }
						onKeyPress={ handleKeyPress }
						placeholder="192.168.1.1 or 10.0.0.0/24"
						size="small"
						error={ !! ipError }
						helperText={ ipError || __( 'Enter IP address or CIDR range (e.g., 192.168.1.0/24)', 'rest-api-firewall' ) }
						disabled={ ! settings.enabled }
						sx={ { flexGrow: 1, maxWidth: 400 } }
					/>
					<Button
						variant="outlined"
						sx={{ alignSelf: 'flex-start' }}
						onClick={ handleAddIp }
						disabled={ ! settings.enabled || ! newIp.trim() }
						startIcon={ <AddIcon /> }
					>
						{ __( 'Add', 'rest-api-firewall' ) }
					</Button>
				</Stack>

				{ activeList.length > 0 ? (
					<List dense sx={ { bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' } }>
						{ activeList.map( ( ip, index ) => (
							<ListItem
								key={ ip }
								divider={ index < activeList.length - 1 }
								secondaryAction={
									<IconButton
										edge="end"
										onClick={ () => handleRemoveIp( activeListKey, ip ) }
										disabled={ ! settings.enabled }
										size="small"
									>
										<DeleteIcon fontSize="small" />
									</IconButton>
								}
							>
								<ListItemText
									primary={
										<Stack direction="row" spacing={ 1 } alignItems="center">
											<Typography variant="body2" sx={ { fontFamily: 'monospace' } }>
												{ ip }
											</Typography>
											{ ip.includes( '/' ) && (
												<Chip label="CIDR" size="small" variant="outlined" color="info" />
											) }
											{ ip === clientIp && (
												<Chip label={ __( 'Your IP', 'rest-api-firewall' ) } size="small" color="warning" />
											) }
										</Stack>
									}
								/>
							</ListItem>
						) ) }
					</List>
				) : (
					<Typography variant="body2" color="text.secondary" sx={ { py: 2, textAlign: 'center' } }>
						{ __( 'No IPs in the list', 'rest-api-firewall' ) }
					</Typography>
				) }
			</Box>

			{ /* Show the other list if it has entries */ }
			{ settings.mode === 'blacklist' && settings.whitelist.length > 0 && (
				<Box sx={ { opacity: 0.6 } }>
					<Typography variant="caption" color="text.secondary">
						{ __( 'Whitelist (inactive):', 'rest-api-firewall' ) } { settings.whitelist.join( ', ' ) }
					</Typography>
				</Box>
			) }
			{ settings.mode === 'whitelist' && settings.blacklist.length > 0 && (
				<Box sx={ { opacity: 0.6 } }>
					<Typography variant="caption" color="text.secondary">
						{ __( 'Blacklist (inactive):', 'rest-api-firewall' ) } { settings.blacklist.join( ', ' ) }
					</Typography>
				</Box>
			) }
		</Stack>
	);
}

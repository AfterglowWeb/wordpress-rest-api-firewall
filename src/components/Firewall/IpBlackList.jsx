import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import PublicIcon from '@mui/icons-material/Public';
import TableViewIcon from '@mui/icons-material/TableView';

import IpDataGrid from './IpDataGrid';
import CountryBlockList from './CountryBlockList';

export default function IpBlackList() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};

	const [ loading, setLoading ] = useState( true );

	const [ settings, setSettings ] = useState( {
		enabled: false,
		mode: 'blacklist',
		whitelist: [],
		blacklist: [],
	} );
	const [ currentTab, setCurrentTab ] = useState( 0 );

	const { hasValidLicense } = useLicense();
	const { openDialog, updateDialog } = useDialog();
	const isIpFilterDisabled = ! settings.enabled;
	const isDisabled = ! hasValidLicense || isIpFilterDisabled;

	const activeList =
		settings.mode === 'whitelist' ? settings.whitelist : settings.blacklist;
	const activeListKey =
		settings.mode === 'whitelist' ? 'whitelist' : 'blacklist';

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

	const saveIpFilter = useCallback(
		async ( updates ) => {
			try {
				await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded; charset=UTF-8',
					},
					body: new URLSearchParams( {
						action: 'save_ip_filter',
						nonce: adminData.nonce,
						...updates,
					} ),
				} );
			} catch ( error ) {
				console.error( 'Error saving IP filter:', error );
			}
		},
		[ adminData ]
	);

	const handleToggleEnabled = async ( e ) => {
		const newEnabled = e.target.checked;
		setSettings( ( prev ) => ( { ...prev, enabled: newEnabled } ) );
		await saveIpFilter( { enabled: newEnabled ? '1' : '0' } );
	};

	const handleModeChange = ( e ) => {
		const newMode = e.target.value;

		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: __( 'Change Filter Mode', 'rest-api-firewall' ),
			content:
				newMode === 'whitelist'
					? __(
							'Switching to whitelist mode will only allow listed IPs to access the REST API. All other IPs will be blocked.',
							'rest-api-firewall'
					  )
					: __(
							'Switching to blacklist mode will block listed IPs from accessing the REST API. All other IPs will be allowed.',
							'rest-api-firewall'
					  ),
			onConfirm: async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Updating filter mode…', 'rest-api-firewall' ),
				} );

				setSettings( ( prev ) => ( { ...prev, mode: newMode } ) );
				await saveIpFilter( { mode: newMode } );

				updateDialog( {
					type: DIALOG_TYPES.SUCCESS,
					title: __( 'Mode Updated', 'rest-api-firewall' ),
					content:
						newMode === 'whitelist'
							? __(
									'Whitelist mode is now active.',
									'rest-api-firewall'
							  )
							: __(
									'Blacklist mode is now active.',
									'rest-api-firewall'
							  ),
					autoClose: 2000,
				} );
			},
		} );
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

	return (
		<Stack spacing={ 3 }>
			<Stack direction={ { xs: 'column', sm: 'row' } } justifyContent="space-between" spacing={ 3 }>
				<FormControl sx={ { flex: 1 } }>
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
					sx={ { flex: 1, maxWidth: 240, position: 'relative' } }
					disabled={ isDisabled }
				>
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

			<Tabs
				value={ currentTab }
				onChange={ ( e, newValue ) => setCurrentTab( newValue ) }
				sx={ {
					mb: 2,
					borderBottom: 1,
					borderColor: 'divider',
				} }
			>
				<Tab
					icon={ <TableViewIcon /> }
					iconPosition="start"
					label={ __( 'All IPs', 'rest-api-firewall' ) }
				/>
				<Tab
					icon={ <PublicIcon /> }
					iconPosition="start"
					label={ __( 'By Country', 'rest-api-firewall' ) }
				/>
			</Tabs>
			{ currentTab === 0 && (
				<IpDataGrid
					listType={ activeListKey }
				/>
			) }

			{ currentTab === 1 && (
				<CountryBlockList
					listType={ activeListKey }
					freeEntries={ activeList }
				/>
			) }

		</Stack>
	);
}

import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../../contexts/DialogContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';

import Alert from '@mui/material/Alert';
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
import PublicIcon from '@mui/icons-material/Public';
import TableViewIcon from '@mui/icons-material/TableView';
import LockOutlineIcon from '@mui/icons-material/LockOutline';

import IpDataGrid from './IpDataGrid';
import CountryBlockList from './CountryBlockList';
import LoadingMessage from '../../LoadingMessage';
import AllowedOrigins from '../Users/AllowedOrigins';

export default function IpFilter() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};
	const [ loading, setLoading ] = useState( true );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ settings, setSettings ] = useState( {
		enabled: false,
		mode: 'blacklist',
	} );
	const [ currentTab, setCurrentTab ] = useState( 0 );
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { openDialog, updateDialog } = useDialog();
	const { selectedApplicationId } = useApplication();
	const isIpFilterDisabled = ! settings.enabled;
	const isDisabled = ! hasValidLicense || isIpFilterDisabled;

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
					nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setSettings( {
					enabled: result.data.enabled ?? false,
					mode: result.data.mode ?? 'blacklist',
				} );
			}
		} catch ( error ) {
			setErrorMessage(
				'Error loading IP filter settings:' + JSON.stringify( error )
			);
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
						nonce,
						...updates,
					} ),
				} );
			} catch ( error ) {
				setErrorMessage(
					'Error saving IP filter:' + JSON.stringify( error )
				);
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
		return <LoadingMessage />;
	}

	return (
		<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>
			{ ! hasValidLicense && (
				<Alert
					severity="info"
					icon={ <LockOutlineIcon /> }
					sx={ { mb: 2 } }
				>
					{ __(
						'Buy a licence for advanced IP management: White List, Block by CIDR, Block by Country, Bulk Delete, Set Retention Time, Export and More…',
						'rest-api-firewall'
					) }
				</Alert>
			) }
			<Stack
				direction={ { xs: 'column', sm: 'row' } }
				justifyContent="space-between"
				spacing={ 3 }
			>
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
							'Block or allow REST API requests based on IP address',
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

				{ selectedApplicationId && (
				<AllowedOrigins disabled={ settings.mode === 'blacklist' } />
		) }
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
			{ currentTab === 0 && <IpDataGrid listType={ activeListKey } /> }

			{ currentTab === 1 && (
				<CountryBlockList listType={ activeListKey } />
			) }
		</Stack>
	);
}

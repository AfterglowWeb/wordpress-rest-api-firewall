import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';
import { useLicense } from '../contexts/LicenseContext';

import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormHelperText from '@mui/material/FormHelperText';


export default function ConfigurationDialog() {
	const [ error, setError ] = useState( '' );
	const [ successMessage, setSuccessMessage ] = useState( '' );
	const [ drawerOpen, setDrawerOpen ] = useState( false );
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();

	const toggleDrawer = ( open ) => ( event ) => {
		setDrawerOpen( open );
		if ( ! open ) {
			setSuccessMessage( '' );
			setError( '' );
		}
	};

	const drawerContent = (
		<Box sx={ { width: 320, p: 2 } } role="presentation">
			<IconButton sx={{position:'absolute', top: 5, right: 5}} onClick={() => setDrawerOpen(false) }>
				<ArrowForwardIosIcon />
			</IconButton>
			<Stack spacing={ 3 }>
				<Stack direction="row" alignItems="center" gap={ 1 }>

					<Typography variant="h6" sx={ { fontWeight: 600 } }>
						{ __( 'Configuration', 'rest-api-firewall' ) }
					</Typography>

				</Stack>

				{ successMessage && (
					<Alert severity="success">
						{ successMessage }
					</Alert>
				) }

				{ error && (
					<Alert severity="error">
						{ error }
					</Alert>
				) }

				<Typography
					variant="subtitle1"
					fontWeight={ 600 }
					sx={ { mb: 2 } }
				>
					{ __( 'Delete data on uninstall', 'rest-api-firewall' ) }
				</Typography>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={
									!! form.delete_options_on_uninstall
								}
								name="delete_options_on_uninstall"
								onChange={ setField }
							/>
						}
						label={ __(
							'Delete Options',
							'rest-api-firewall'
						) }
					/>
					<FormHelperText>
						{ __(
							'Delete plugin options in wp_options table.',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>

				{ hasValidLicense && <FormControl>
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
						label={ __(
							'Delete Tables',
							'rest-api-firewall'
						) }
					/>
					<FormHelperText>
						{ __(
							'Delete plugin tables from the database.',
							'rest-api-firewall'
						) }
					</FormHelperText>
				</FormControl>}

				
			</Stack>
		</Box>
	);

	return (
		<>
			<Button onClick={ toggleDrawer( true ) }>
				{ __( 'Configuration', 'rest-api-firewall' ) }
			</Button>
			<Drawer
				anchor="right"
				open={ drawerOpen }
				onClose={ toggleDrawer( false ) }
				sx={ {
					'& .MuiPaper-root': {
						mt: { sm: '46px', md: '32px' },
					},
				} }
			>
				{ drawerContent }
			</Drawer>
		</>
	);
}

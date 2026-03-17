import { useState } from '@wordpress/element';
import { useApplication } from '../contexts/ApplicationContext';

import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';

export default function ApplicationSelector() {
	const { __ } = wp.i18n || {};
	const {
		applications,
		selectedApplicationId,
		selectedApplication,
		applicationsLoading,
		setSelectedApplicationId,
	} = useApplication();
	const [ snackOpen, setSnackOpen ] = useState( false );

	const handleChange = ( e ) => {
		setSelectedApplicationId( e.target.value );
		setSnackOpen( true );
	};

	return (
		<>
			<FormControl size="small" variant="standard" fullWidth>
				<Select
					size="small"
					label={ __( 'Application', 'rest-api-firewall' ) }
					value={ selectedApplicationId }
					onChange={ handleChange }
					displayEmpty
					disabled={ applicationsLoading || applications.length === 0 }
					sx={ { fontSize: '0.9rem' } }
					renderValue={ () =>
						applicationsLoading
							? __( 'Loading…', 'rest-api-firewall' )
							: selectedApplication?.title ||
							  __( 'No application', 'rest-api-firewall' )
					}
				>
					{ applications.map( ( app ) => (
						<MenuItem key={ app.id } value={ app.id }>
							{ app.title }
						</MenuItem>
					) ) }
				</Select>
			</FormControl>

			<Snackbar
				open={ snackOpen }
				autoHideDuration={ 2000 }
				onClose={ () => setSnackOpen( false ) }
				anchorOrigin={ { vertical: 'bottom', horizontal: 'center' } }
			>
				<Alert
					severity="success"
					variant="filled"
					onClose={ () => setSnackOpen( false ) }
				>
					{ __( 'Application changed', 'rest-api-firewall' ) }
				</Alert>
			</Snackbar>
		</>
	);
}

import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * NoApplicationsPrompt - Component to display when user visits a panel that requires applications
 * but none have been created yet.
 * 
 * Shows a helpful message and a button to create the first application.
 */
const NoApplicationsPrompt = () => {
	const { handleNavigation } = useNavigation();

	const handleCreateApplication = () => {
		handleNavigation( 'applications' );
	};

	return (
		<Box sx={ { mt: 2, mb: 2 } }>
			<Alert severity="info">
				<AlertTitle>No Applications Yet</AlertTitle>
				You can configure these settings now, and they'll be activated once you create your first application.
				<Box sx={ { mt: 2 } }>
					<Button
						variant="contained"
						color="primary"
						startIcon={ <AddIcon /> }
						onClick={ handleCreateApplication }
					>
						Create Application
					</Button>
				</Box>
			</Alert>
		</Box>
	);
};

export default NoApplicationsPrompt;

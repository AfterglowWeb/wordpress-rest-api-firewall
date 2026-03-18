import { useState } from '@wordpress/element';
import { useApplication } from '../contexts/ApplicationContext';
import { useNavigation } from '../contexts/NavigationContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Tooltip from '@mui/material/Tooltip';

export default function ApplicationSelector() {
	const { __ } = wp.i18n || {};
	const {
		applications,
		selectedApplicationId,
		selectedApplication,
		applicationsLoading,
		setSelectedApplicationId,
	} = useApplication();
	const { navigateGuarded } = useNavigation();
	const [ menuAnchor, setMenuAnchor ] = useState( null );
	const [ snackOpen, setSnackOpen ] = useState( false );

	const handleSelectApp = ( id ) => {
		setMenuAnchor( null );
		if ( id !== selectedApplicationId ) {
			setSelectedApplicationId( id );
			setSnackOpen( true );
		}
	};

	const navigateToApp = () =>
		selectedApplication &&
		navigateGuarded( 'applications', selectedApplication.id );

	return (
		<>
			<Stack
				direction="row"
				alignItems="center"
				sx={ { px: 3, pt: 1, gap: 0.5 } }
			>
				<Tooltip title={ selectedApplication ? __( 'Manage applications', 'rest-api-firewall' ) : __( 'Select an application to manage', 'rest-api-firewall' ) }>
					<Button
						size="small"
						onClick={ ( e ) => setMenuAnchor( e.currentTarget ) }
						sx={ { 
							color: 'text.secondary', 
							flexShrink: 0, 
							gap: 0.5, 
							px: 0.5, 
							minWidth: 40, 
							justifyContent: 'space-between' 
						} }
					>
						<AppsOutlinedIcon fontSize="small" />
						<ExpandMoreIcon sx={ { fontSize: '14px' } } />
					</Button>
				</Tooltip>
		
				<Stack
					flex={ 1 }
					spacing={ 0 }
					onClick={ selectedApplication && navigateToApp }
					sx={ { 
						cursor: 'pointer', 
						minWidth: 100, 
					} }
				>
					<Typography
						variant="body2"
						noWrap
					>
						{ selectedApplication && selectedApplication.title }
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						noWrap
					>
						{ selectedApplication ? __( 'Current application', 'rest-api-firewall' ) : __( 'Select Application', 'rest-api-firewall' ) }
					</Typography>
				</Stack>
	
			</Stack>

			<Menu
				anchorEl={ menuAnchor }
				open={ Boolean( menuAnchor ) }
				onClose={ () => setMenuAnchor( null ) }
				anchorOrigin={ { vertical: 'bottom', horizontal: 'left' } }
			>
				<MenuItem
					dense
					onClick={ () => {
						setMenuAnchor( null );
						navigateGuarded( 'applications' );
					} }
				>
					{ __( 'Manage applications', 'rest-api-firewall' ) }
				</MenuItem>
				<MenuItem
					dense
					onClick={ () => {
						setMenuAnchor( null );
						navigateGuarded( 'applications', 'new' );
					} }
				>
					<AddIcon
						fontSize="small"
						sx={ { mr: 1.5, color: 'text.secondary' } }
					/>
					{ __( 'New application', 'rest-api-firewall' ) }
				</MenuItem>
				{ applications.length > 0 && <Divider /> }
				{ applicationsLoading ? (
					<MenuItem disabled dense>
						{ __( 'Loading…', 'rest-api-firewall' ) }
					</MenuItem>
				) : (
					applications.map( ( app ) => (
						<MenuItem
							key={ app.id }
							dense
							selected={ app.id === selectedApplicationId }
							onClick={ () => handleSelectApp( app.id ) }
						>
							{ app.title }
						</MenuItem>
					) )
				) }
			</Menu>

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

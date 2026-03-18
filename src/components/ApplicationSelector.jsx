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
				sx={ { px: 3, pt: 1, gap: 1 } }
			>
				<Button
					size="small"
					onClick={ ( e ) => setMenuAnchor( e.currentTarget ) }
					sx={ { 
						color: 'text.secondary', 
						flexShrink: 0, 
						gap: 1, 
						px:1, 
						minWidth: 40, 
						justifyContent: 'space-between' 
					} }
				>
					<AppsOutlinedIcon sx={ { fontSize: '18px' } } />
					<ExpandMoreIcon sx={ { fontSize: '14px' } } />
				</Button>

				{ selectedApplication ? (
					<Box
						flex={ 1 }
						onClick={ navigateToApp }
						sx={ { 
							cursor: 'pointer', 
							minWidth: 0, 
							display: 'inline-flex', 
							alignItems: 'center', 
							justifyContent: 'space-between'
						} }
					>
						<Typography
							variant="body2"
							noWrap
							sx={ {
								color: 'primary.main',
								textDecoration: 'underline',
							} }
						>
							{ selectedApplication.title }
						</Typography>
					</Box>
				) : (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={ { flex: 1, fontStyle: 'italic' } }
					>
						{ __( 'Loading…', 'rest-api-firewall' ) }
					</Typography>
				) }

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

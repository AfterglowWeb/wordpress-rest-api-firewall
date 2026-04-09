import { useState } from '@wordpress/element';
import { useApplication } from '../contexts/ApplicationContext';
import { useNavigation } from '../contexts/NavigationContext';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';

import AddIcon from '@mui/icons-material/Add';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AppSettingsAltOutlinedIcon from '@mui/icons-material/AppSettingsAltOutlined';
import Link from '@mui/material/Link';

export const listItemIconSx = { px: 1, minWidth: 32, color: 'text.secondary' };
export const listItemTextSx = { '& .MuiListItemText-primary': { fontSize: '0.9rem', lineHeight: 'normal' } };

export default function ApplicationSelector() {
	const { __ } = wp.i18n || {};
	const {
		applications,
		selectedApplicationId,
		applicationsLoading,
		setSelectedApplicationId,
	} = useApplication();
	const { navigateGuarded, panel, subKey } = useNavigation();
	const [ open, setOpen ] = useState( false );
	const [ snackOpen, setSnackOpen ] = useState( false );

	const handleSelectApp = ( id ) => {
		if ( id === selectedApplicationId ) return;
		if ( subKey ) {
			navigateGuarded( 'applications', id, () => setSelectedApplicationId( id ) );
		} else {
			setSelectedApplicationId( id );
			setSnackOpen( true );
		}
	};

	return (
		<>
			<ListItemButton onClick={ () => setOpen( ( o ) => ! o ) } sx={ { px: 3, mt: 1 } }>
				<ListItemIcon sx={ listItemIconSx }>
					<AppsOutlinedIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText
					sx={ listItemTextSx }
					primary={ __( 'Applications', 'rest-api-firewall' ) }
				/>
				{ open
					? <ExpandLessIcon fontSize="small" sx={ { color: 'text.secondary' } } />
					: <ExpandMoreIcon fontSize="small" sx={ { color: 'text.secondary' } } />
				}
			</ListItemButton>

			<Collapse in={ open } timeout="auto" unmountOnExit>
				<List component="div" disablePadding>
					<ListItemButton
						selected={ panel === 'applications' && ! subKey }
						disabled={ panel === 'applications' && ! subKey }
						onClick={ () => navigateGuarded( 'applications' ) }
						sx={ { pl: 6, pr: 3 } }
					>
						<ListItemText
							sx={ listItemTextSx }
							primary={ __( 'All Applications', 'rest-api-firewall' ) }
						/>
					</ListItemButton>

					<ListItemButton
						onClick={ () => navigateGuarded( 'applications', 'new' ) }
						sx={ { pl: 6, pr: 3 } }
					>
						
						<ListItemText
							sx={ listItemTextSx }
							primary={ __( 'New Application', 'rest-api-firewall' ) }
						/>
						<AddIcon fontSize="small" />
					</ListItemButton>
					
				</List>
			</Collapse>

			{applications.length > 0 && (<ListItemButton
				selected={ !!selectedApplicationId }
				onClick={ selectedApplicationId ? () => navigateGuarded( 'applications', selectedApplicationId ) : null }
				sx={ { px: 3 } }
			>
				<ListItemIcon
					sx={ {
						px: 1,
						minWidth: 32,
					} }
				>
					<AppSettingsAltOutlinedIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText
					sx={{ ...listItemTextSx }}
					primary={ applicationsLoading ? __( 'Loading...', 'rest-api-firewall' ) 
						: ( applications.find( ( app ) => app.id === selectedApplicationId )?.title || __( 'No application', 'rest-api-firewall' ) ) }
				/>
			</ListItemButton>) }

			<Snackbar
				open={ snackOpen }
				autoHideDuration={ 2000 }
				onClose={ () => setSnackOpen( false ) }
			>
				<Alert
					severity="success"
					onClose={ () => setSnackOpen( false ) }
				>
					{ __( 'Application changed', 'rest-api-firewall' ) }
				</Alert>
			</Snackbar>
		</>
	);
}

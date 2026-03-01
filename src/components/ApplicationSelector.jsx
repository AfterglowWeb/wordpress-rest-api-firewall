import { useApplication } from '../contexts/ApplicationContext';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';

export default function ApplicationSelector() {
	const { __ } = wp.i18n || {};
	const {
		applications,
		selectedApplicationId,
		selectedApplication,
		applicationsLoading,
		setSelectedApplicationId,
	} = useApplication();

	return (
		<Stack direction="row" alignItems="center" gap={ 2 }>
			<Stack sx={ { color: 'text.secondary' } }>
				<AppsOutlinedIcon color="inherit" />
			</Stack>

			<FormControl
				size="small"
				variant="standard"
				sx={ { minWidth: 180, maxWidth: 270 } }
			>
				<InputLabel id={ `select-application-label` }>
					{ __( 'Application', 'rest-api-firewall' ) }
				</InputLabel>
				<Select
					size="small"
					labelId={ `select-application-label` }
					value={ selectedApplicationId }
					onChange={ ( e ) =>
						setSelectedApplicationId( e.target.value )
					}
					displayEmpty
					disabled={
						applicationsLoading || applications.length === 0
					}
					sx={ { minWidth: 180, maxWidth: 260 } }
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

			<Divider
				orientation="vertical"
				sx={ { ml: 2 } }
				flexItem
				variant="middle"
			/>
		</Stack>
	);
}

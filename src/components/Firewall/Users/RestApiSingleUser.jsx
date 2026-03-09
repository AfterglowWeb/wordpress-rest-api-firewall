import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';

import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function RestApiSingleUser( { form, setField } ) {
	const { __, sprintf } = wp.i18n || {};
	const { adminData } = useAdminData();
	const [ restApiUser, setRestApiUser ] = useState( [] );

	const adminUrl = adminData?.ajaxurl?.split( 'admin-ajax.php' )[ 0 ] || '';
	const usersPageUrl = `${ adminUrl }users.php`;

	useEffect( () => {
		if ( Array.isArray( adminData?.users ) && form.firewall_user_id ) {
			const currentUser = adminData.users.filter(
				( user ) => form.firewall_user_id === user.value
			);
			if ( currentUser && currentUser.length > 0 ) {
				setRestApiUser( currentUser[ 0 ] );
			}
		}
	}, [ adminData?.users, form.firewall_user_id ] );

	return (
		<Stack
			direction={ { xs: 'column', lg: 'row' } }
			gap={ 2 }
			justifyContent={ 'space-between' }
		>
			<FormControl sx={ { flex: 1, maxWidth: 270 } }>
				<InputLabel id="user-id-label">
					{ __( 'REST API User', 'rest-api-firewall' ) }
				</InputLabel>
				<Select
					labelId="user-id-label"
					id="firewall_user_id"
					name="firewall_user_id"
					value={ form.firewall_user_id || 0 }
					label={ __( 'REST API User', 'rest-api-firewall' ) }
					onChange={ setField }
				>
					<MenuItem value={ 0 }>
						<em>{ __( 'Select User', 'rest-api-firewall' ) }</em>
					</MenuItem>
					{ adminData?.users &&
						adminData.users.length > 0 &&
						adminData.users.map( ( user ) =>
							user.value && user.label ? (
								<MenuItem
									key={ user.value }
									value={ user.value }
								>
									{ user.label }
								</MenuItem>
							) : null
						) }
				</Select>
				<FormHelperText>
					{ form.firewall_user_id &&
					restApiUser &&
					restApiUser?.label &&
					restApiUser?.admin_url ? (
						<>
							<span>
								{ sprintf(
									__(
										'Restrict authentication to %s,',
										'rest-api-firewall'
									),
									restApiUser.label
								) }
							</span>
							<Typography
								component="a"
								href={ restApiUser.admin_url }
								variant="body.2"
								target="_blank"
								sx={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									px: '4px',
									fontSize: '12px',
								} }
							>
								{ __( 'user profile', 'rest-api-firewall' ) }
								<OpenInNewIcon fontSize="inherit" />
							</Typography>
						</>
					) : (
						<>
							<span>
								{ __(
									'Restrict authentication to one user. Create an application password first in',
									'rest-api-firewall'
								) }
							</span>
							<Typography
								component="a"
								href={ usersPageUrl }
								variant="body.2"
								target="_blank"
								sx={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									pl: '4px',
									fontSize: '12px',
								} }
							>
								{ __( 'users list', 'rest-api-firewall' ) }
								<OpenInNewIcon fontSize="inherit" />
							</Typography>
						</>
					) }
				</FormHelperText>
			</FormControl>
		</Stack>
	);
}

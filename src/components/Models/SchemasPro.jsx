import { useState } from '@wordpress/element';
import { useLicense } from '../../contexts/LicenseContext';

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import PostProperties from './PostProperties';

export default function ModelsPro( { form, setField, postTypes } ) {
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};
	const [selectedPostType, setSelectedPostType] = useState( null );
	const selectedPostTypeOption = selectedPostType ? postTypes.filter( (postType) => postType.value === selectedPostType ) : {};

	return (
		<Stack spacing={ 3 }>

			<Typography variant="subtitle1" fontWeight={600} sx={ { mb: 2 } }>
				{ __( 'Fine Grained Schemas Settings', 'rest-api-firewall' ) }
			</Typography>
			
			<FormControl fullWidth>
				<InputLabel>
					{ __( 'Post type', 'rest-api-firewall' ) }
				</InputLabel>
				<Select
					value={ selectedPostType }
					defaultValue={ postTypes[0].value || '' }
					label={ __( 'Post type', 'rest-api-firewall' ) }
					onChange={ ( e ) => setSelectedPostType( e.target.value ) }
				>
					{ postTypes && postTypes.map( ( postType ) => (
						<MenuItem key={ postType.value } value={ postType.value }>
							{ postType.label }
						</MenuItem>
					) ) }
				</Select>
			</FormControl>

			<PostProperties 
			selectedPostType={ selectedPostType } 
			selectedPostTypeLabel={ selectedPostTypeOption?.label || '' }
			setField={ setField } />

		</Stack>
	);
}
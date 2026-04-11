import { useState, useEffect } from '@wordpress/element';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAdminData } from '../../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import GlobalProperties from './GlobalProperties';
import { ModelProperties } from './Properties';
import ObjectTypeNav from '../shared/ObjectTypeNav';

export default function PropertiesPanel( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { subKey, navigate } = useNavigation();
	const { adminData } = useAdminData();

	const allTypes = ( adminData?.post_types || [] ).filter( ( t ) => t.public );

	const [ selectedType, setSelectedType ] = useState( subKey || 'post' );

	useEffect( () => {
		if ( subKey ) setSelectedType( subKey );
	}, [ subKey ] );

	const handleSelect = ( value ) => {
		setSelectedType( value );
		navigate( 'models-properties', value );
	};

	const extraItems = [
		{
			value:     'settings_route',
			label:     __( 'Settings Route', 'rest-api-firewall' ),
			secondary: 'wp/v2/settings',
		},
	];

	return (
		<Box display="flex" flexGrow={ 1 } overflow="hidden">
			<ObjectTypeNav
				objectTypes={ allTypes }
				selectedType={ selectedType }
				onSelect={ handleSelect }
				extraItems={ extraItems }
			/>
			<Stack p={ 4 } flexGrow={ 1 } overflow="auto" spacing={ 3 }>
				<GlobalProperties form={ form } setField={ setField } />
				<Divider />
				<ModelProperties
					selectedObjectType={ selectedType }
					setField={ setField }
					globalForm={ form }
				/>
			</Stack>
		</Box>
	);
}

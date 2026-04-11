import { useState, useEffect } from '@wordpress/element';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAdminData } from '../../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import BusinessIcon from '@mui/icons-material/Business';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';

import BusinessIcon from '@mui/icons-material/Business';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';

import GlobalProperties from './GlobalProperties';
import { ModelProperties } from './Properties';
import ObjectTypeNav from '../shared/ObjectTypeNav';

export default function PropertiesPanel( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { subKey, navigate } = useNavigation();
	const { adminData } = useAdminData();

	const allTypes = ( adminData?.post_types || [] ).filter( ( t ) => t.public );

	const [ selectedType, setSelectedType ] = useState( subKey || 'post' );
	const [ tab, setTab ] = useState( 0 );

	const TAB_PER_MODEL = 1;

	useEffect( () => {
		if ( subKey ) {
			setSelectedType( subKey );
			setTab( TAB_PER_MODEL );
		}
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
			icon:      BusinessIcon,
		},
	];

	return (
		<Stack py={ 4 } flexGrow={ 1 } overflow="hidden">
				<Tabs 
				value={ tab } 
				onChange={ ( _, v ) => setTab( v ) }
				sx={ {
					borderBottom: 1,
					borderColor: 'divider',
					px: 4,
				} }
				>
					<Tab 
					icon={ <TuneOutlinedIcon /> }
					iconPosition="start"
					label={ __( 'Global Settings', 'rest-api-firewall' ) } />
					<Tab 
					icon={ <RuleOutlinedIcon /> }
					iconPosition="start"
					label={ __( 'Per Model Settings', 'rest-api-firewall' ) } />
				</Tabs>

			{ tab === 0 && (
				<Box p={ 4 } overflow="auto">
					<GlobalProperties form={ form } setField={ setField } />
				</Box>
			) }

			{ tab === TAB_PER_MODEL && (
				<Box display="flex" flexGrow={ 1 } overflow="hidden" alignItems="stretch">
					<ObjectTypeNav
						objectTypes={ allTypes }
						selectedType={ selectedType }
						onSelect={ handleSelect }
						extraItems={ extraItems }
					/>
					<Stack p={ 4 } flexGrow={ 1 } overflow="auto" spacing={ 3 }>
						<ModelProperties
							selectedObjectType={ selectedType }
							setField={ setField }
							globalForm={ form }
						/>
					</Stack>
				</Box>
			) }
		</Stack>
	);
}

import { useState, useEffect } from '@wordpress/element';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';

import GlobalProperties from './GlobalProperties';
import { ModelProperties } from './Properties';
import ObjectTypeNav from '../shared/ObjectTypeNav';

export default function PropertiesPanel( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { subKey, navigate } = useNavigation();
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const hideUserRoutes    = !! adminData?.admin_options?.hide_user_routes;
	const authorLockedReason = ! hasValidLicense
		? __( 'Managing custom order for authors requires Pro', 'rest-api-firewall' )
		: hideUserRoutes
		? __( 'Hidden: /wp/v2/users/* routes are disabled in Global Routes Policy', 'rest-api-firewall' )
		: null;

	const allTypes = adminData?.post_types || [];

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
						disabledTypes={ adminData?.admin_options?.disabled_post_types || [] }
						lockedItems={ authorLockedReason ? { author: authorLockedReason } : {} }
					/>
					<Stack p={ 4 } flexGrow={ 1 } overflow="auto" spacing={ 3 }>
						{ selectedType && selectedType !== 'settings_route' && (
							<Stack direction="row" spacing={ 0.5 }>
								<Tooltip disableInteractive title={ __( 'View routes', 'rest-api-firewall' ) }>
									<IconButton size="small" onClick={ () => {
										const pt = ( adminData?.post_types || [] ).find( ( p ) => p.value === selectedType );
										const restPath = pt ? `/wp/v2/${ pt.rest_base || pt.value }` : null;
										navigate( 'per-route-settings', restPath ? `routes|${ restPath }` : 'routes' );
									} } sx={ { opacity: 0.5 } }>
										<AccountTreeOutlinedIcon fontSize="small" />
									</IconButton>
								</Tooltip>
								<Tooltip disableInteractive title={ __( 'View collection', 'rest-api-firewall' ) }>
									<IconButton size="small" onClick={ () => navigate( 'collections', selectedType ) } sx={ { opacity: 0.5 } }>
										<ListAltOutlinedIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							</Stack>
						) }
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

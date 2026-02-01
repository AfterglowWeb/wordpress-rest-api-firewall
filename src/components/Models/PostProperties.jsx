import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';

export default function PostProperties( { selectedPostType, selectedPostTypeLabel, setField } ) {
    
    const { __, sprintf } = wp.i18n || {};
    const { hasValidLicense } = useLicense();
    const { adminData } = useAdminData();
    const postProperties = adminData?.post_types_schemas || {};

	return (<Stack spacing={ 2 }>
		<Typography variant="subtitle2" fontWeight={ 600 }>
			{selectedPostTypeLabel ?
             sprintf( __( '%s properties', 'rest-api-firewall' ), selectedPostTypeLabel ) :
             __( 'Properties', 'rest-api-firewall' )
            }
		</Typography>

		{ selectedPostType && postProperties?.[ selectedPostType ]?.props && (
            <Stack spacing={ 2 }>
                { Object.entries(
                    postProperties[ selectedPostType ].props
                ).map( ( [ propName, propConfig ] ) => {
                    
                    const settings = propConfig.settings || {};
                    const hasFilters = Array.isArray( settings.filters ) && settings.filters.length > 0;

                    return (
                        <Box
                        key={ propName }
                        sx={ {
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 2,
                        } }
                        >
                            <Tooltip title={propConfig.description || ''} placement="bottom-start">
                            <Box sx={{ width: 200, textOverflow:'ellipsis', overflow:'hidden', whiteSpace: 'nowrap' }}>
                                <Typography fontWeight={ 500 }>
                                    { propName }
                                </Typography>
                                { propConfig.description && (
                                    <Typography variant="caption" color="text.secondary">
                                        { propConfig.description }
                                    </Typography>
                                ) }
                            </Box>
                            </Tooltip>

                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        disabled={ ! hasValidLicense }
                                        checked={ ! settings.disable }
                                        onChange={ ( e ) => {
                                            setField( {
                                                target: {
                                                    name: `postProperties.${ selectedPostType }.props.${ propName }.settings.disable`,
                                                    value: ! e.target.checked,
                                                },
                                            } );
                                        } }
                                    />
                                }
                                label={ __( 'Enabled', 'rest-api-firewall' ) }
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={ hasFilters }
                                        disabled={ ! hasValidLicense || ! hasFilters }
                                    />
                                }
                                label={ __( 'Filters', 'rest-api-firewall' ) }
                            />
                            {settings.filters && settings.filters.map((filter) => {
                                <Checkbox checked={ filter } />
                            })}
                        </Box>
                    );
                } ) }
            </Stack>
        ) }

	</Stack>)
    
}

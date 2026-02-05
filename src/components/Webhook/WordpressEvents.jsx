
import { useAdminData } from '../../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';

export default function WordpressEvents( { form, setField } ) {
    const { adminData } = useAdminData();
    const { __ } = wp.i18n || {};

    const webhookEvents = adminData?.webhook_events || {};
    const webhookEventGroups = adminData?.webhook_event_groups || {};
    const selectedEvents = form.application_webhook_auto_trigger_events || [];

    const handleEventToggle = ( eventKey ) => {
        const newEvents = selectedEvents.includes( eventKey )
            ? selectedEvents.filter( ( e ) => e !== eventKey )
            : [ ...selectedEvents, eventKey ];

        setField( {
            target: {
                name: 'application_webhook_auto_trigger_events',
                value: newEvents,
                type: 'array',
            },
        } );
    };

    const getEventsByGroup = ( groupKey ) => {
        return Object.entries( webhookEvents ).filter(
            ( [ , config ] ) => config.group === groupKey
        );
    };

 return (
    <Stack spacing={ 2 } flex={ 1 } width={'100%'} maxWidth={500}>
        <Typography
            variant="subtitle1"
            fontWeight={ 600 }
            sx={ { mb: 2 } }
        >
            { __( 'Auto-trigger Events', 'rest-api-firewall' ) }
        </Typography>

        <FormHelperText sx={ { mb: 2 } }>
            { __(
                'Select WordPress events that will automatically trigger the webhook.',
                'rest-api-firewall'
            ) }
        </FormHelperText>

        { Object.entries( webhookEventGroups ).map(
            ( [ groupKey, groupLabel ] ) => {
                const groupEvents = getEventsByGroup( groupKey );
                if ( groupEvents.length === 0 ) {
                    return null;
                }

                return (
                    <Box key={ groupKey } sx={ { mb: 2 } }>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={ { mb: 1 } }
                        >
                            { groupLabel }
                        </Typography>
                        <FormGroup>
                            { groupEvents.map(
                                ( [ eventKey, eventConfig ] ) => (
                                    <FormControl key={ eventKey }>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={ selectedEvents.includes(
                                                        eventKey
                                                    ) }
                                                    onChange={ () =>
                                                        handleEventToggle(
                                                            eventKey
                                                        )
                                                    }
                                                />
                                            }
                                            label={
                                                eventConfig.label
                                            }
                                        />
                                        <FormHelperText
                                            sx={ {
                                                ml: 4,
                                                mt: -0.5,
                                            } }
                                        >
                                            {
                                                eventConfig.description
                                            }
                                        </FormHelperText>
                                    </FormControl>
                                )
                            ) }
                        </FormGroup>
                    </Box>
                );
            }
        ) }
    </Stack>);
}
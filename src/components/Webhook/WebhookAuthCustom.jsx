import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

export default function WebhookAuthCustom( {
    hasSecret,
    customSecret,
    setCustomSecret,
} ) {
    const { __ } = wp.i18n || {};

    return (
        <Stack spacing={ 2 }>
            <TextField
                label={ __( 'Custom Webhook Secret', 'rest-api-firewall' ) }
                name="application_webhook_custom_secret"
                type="password"
                value={
                    hasSecret ? '••••••••••••••••••••••••••••••••' : customSecret
                }
                slotProps={ {
                    input: {
                        readOnly: !!hasSecret,
                    }
                } }
                onChange={ ( e ) => setCustomSecret( e.target.value ) }
                helperText={ __(
                    hasSecret ? 'Webhook secret set. To change it, hit the revoke button first.' : 'Provide your own secret for webhook requests.',
                    'rest-api-firewall'
                ) }
                fullWidth
            />
        </Stack>
    );
}

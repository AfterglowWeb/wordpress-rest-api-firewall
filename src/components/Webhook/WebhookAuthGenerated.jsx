import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function WebhookAuthGenerated( {
    hasSecret,
    webhookSecret,
} ) {
    const { __ } = wp.i18n || {};
    const isRevealed = webhookSecret !== null;
    const isLoading = hasSecret === null;

    return (
        <Stack spacing={ 2 }>
            <TextField
                label={ __( 'Application Webhook Secret', 'rest-api-firewall' ) }
                value={
                    isLoading
                        ? __( 'Checking…', 'rest-api-firewall' )
                        : ! hasSecret
                        ? __( 'Not generated', 'rest-api-firewall' )
                        : isRevealed
                        ? webhookSecret
                        : '••••••••••••••••••••••••••••••••'
                }
                type={ isRevealed ? 'text' : 'password' }
                disabled={ false }
                slotProps={ {
                    input: {
                        readOnly: true,
                        endAdornment: isRevealed && (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={ () =>
                                        navigator.clipboard.writeText(
                                            webhookSecret
                                        )
                                    }
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                } }
                helperText={
                    ! hasSecret
                        ? __( 'No webhook secret generated yet.', 'rest-api-firewall' )
                        : __( 'Used to sign webhook requests.', 'rest-api-firewall' )
                }
                fullWidth
            />

            { isRevealed && (
                <Alert severity="info">
                    { __(
                        'This secret is shown only once. Copy it now and store it securely.',
                        'rest-api-firewall'
                    ) }
                </Alert>
            ) }
        </Stack>
    );
}

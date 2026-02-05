import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';

export default function WebhookAuth( { hasSecret, setHasSecret, form, setField } ) {
    const { adminData } = useAdminData();

    const { __ } = wp.i18n || {};

    const [ webhookSecret, setWebhookSecret ] = useState( null );
    const isRevealed = webhookSecret !== null;
    const isLoading = hasSecret === null;

    const [ useCustomSecret, setUseCustomSecret ] = useState( false );
    const [ customSecret, setCustomSecret ] = useState( '' );

    const [ snackbarOpen, setSnackbarOpen ] = useState( false );
    const [ snackbarSeverity, setSnackbarSeverity ] = useState( '' );
    const [ snackbarContent, setSnackbarContent ] = useState( '' );

    const [ confirmAction, setConfirmAction ] = useState( null ); // 'delete' | 'regenerate' | null
    const confirmOpen = Boolean( confirmAction );


    useEffect( () => {
        const checkSecret = async () => {
            const response = await fetch( adminData.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: new URLSearchParams( {
                    action: 'has_application_webhook_secret',
                    nonce: adminData.nonce,
                } ),
            } );

            const result = await response.json();

            if ( result?.success ) {
                setHasSecret( Boolean( result.data.has_secret ) );
                setWebhookSecret( null );
            }
        };

        checkSecret();
    }, [ adminData ] );

    const regenerateWebhookSecret = async () => {
        const response = await fetch( adminData.ajaxurl, {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: new URLSearchParams( {
                action: 'update_application_webhook_secret',
                nonce: adminData.nonce,
            } ),
        } );

        const result = await response.json();

        if ( result?.success ) {
            setWebhookSecret( result.data.secret );
            setHasSecret( true );

            setSnackbarOpen( true );
            setSnackbarSeverity( 'success' );
            setSnackbarContent(
                __(
                    'Application webhook secret generated successfully.',
                    'rest-api-firewall'
                )
            );
        }
    };

    const deleteWebhookSecret = async () => {
        const response = await fetch( adminData.ajaxurl, {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: new URLSearchParams( {
                action: 'delete_application_webhook_secret',
                nonce: adminData.nonce,
            } ),
        } );

        const result = await response.json();

        if ( result?.success ) {
            setWebhookSecret( null );
            setHasSecret( false );

            setSnackbarOpen( true );
            setSnackbarSeverity( 'success' );
            setSnackbarContent( result.data.message || '' );
        }
    };

    const confirmConfig = {
        delete: {
            title: __( 'Revoke Webhook Secret', 'rest-api-firewall' ),
            content: __(
                'Any applications using this webhook secret will stop working. Continue?',
                'rest-api-firewall'
            ),
            action: deleteWebhookSecret,
        },
        regenerate: {
            title: __( 'Regenerate Webhook Secret', 'rest-api-firewall' ),
            content: __(
                'Regenerating the webhook secret will invalidate the current one. Any applications using the old secret will stop working. Continue?',
                'rest-api-firewall'
            ),
            action: regenerateWebhookSecret,
        },
    };

    const handleConfirm = async () => {
        if ( ! confirmAction ) {
            return;
        }
        await confirmConfig[ confirmAction ].action();
        setConfirmAction( null );
    };

    const saveCustomSecret = async () => {
        if ( ! customSecret || customSecret.length === 0 ) {
            setSnackbarOpen( true );
            setSnackbarSeverity( 'error' );
            setSnackbarContent(
                __( 'Please provide a custom secret.', 'rest-api-firewall' )
            );
            return;
        }

        try {
            const response = await fetch( adminData.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: new URLSearchParams( {
                    action: 'save_application_webhook_custom_secret',
                    nonce: adminData.nonce,
                    custom_secret: customSecret,
                } ),
            } );

            const result = await response.json();

            if ( result?.success ) {
                setWebhookSecret( customSecret );
                setHasSecret( true );
                setUseCustomSecret( false );
                setCustomSecret( '' );

                setSnackbarOpen( true );
                setSnackbarSeverity( 'success' );
                setSnackbarContent(
                    __(
                        'Custom webhook secret saved successfully.',
                        'rest-api-firewall'
                    )
                );
            } else {
                setSnackbarOpen( true );
                setSnackbarSeverity( 'error' );
                setSnackbarContent(
                    result?.data?.message ||
                        __(
                            'Failed to save custom secret.',
                            'rest-api-firewall'
                        )
                );
            }
        } catch ( error ) {
            setSnackbarOpen( true );
            setSnackbarSeverity( 'error' );
            setSnackbarContent( error.message );
        }
    };


return(<>
    <Stack spacing={ 3 } flex={1} width={'100%'} maxWidth={500}>
        <Typography
            variant="subtitle1"
            fontWeight={ 600 }
            sx={ { mb: 2 } }
        >
            { __( 'Webhook access', 'rest-api-firewall' ) }
        </Typography>
        <Stack spacing={ 4 }>
            <TextField
                label={ __(
                    'Application URL',
                    'rest-api-firewall'
                ) }
                name="application_host"
                helperText={ __(
                    'Full application URL with protocol and port (e.g., https://example.local:5001).',
                    'rest-api-firewall'
                ) }
                value={ form.application_host }
                onChange={ setField }
                fullWidth
            />

            <TextField
                label={ __(
                    'Application Webhook Endpoint',
                    'rest-api-firewall'
                ) }
                name="application_webhook_endpoint"
                helperText={ __(
                    'The application endpoint used to trigger a webhook.',
                    'rest-api-firewall'
                ) }
                value={ form.application_webhook_endpoint }
                onChange={ setField }
                fullWidth
            />

            <TextField
                label={ __(
                    'Application Webhook Secret',
                    'rest-api-firewall'
                ) }
                value={
                    isLoading
                        ? __( 'Checking…', 'rest-api-firewall' )
                        : ! hasSecret
                        ? __(
                                'Not generated',
                                'rest-api-firewall'
                            )
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
                        ? __(
                                'No webhook secret generated yet.',
                                'rest-api-firewall'
                            )
                        : __(
                                'Used to sign webhook requests.',
                                'rest-api-firewall'
                            )
                }
                fullWidth
                sx={ { display: useCustomSecret ? 'none' : 'block' } }
            />

            <Collapse in={ useCustomSecret } timeout="auto" unmountOnExit>
                <Stack spacing={ 2 }>
                    <TextField
                        label={ __(
                            'Custom Webhook Secret',
                            'rest-api-firewall'
                        ) }
                        name="application_webhook_custom_secret"
                        type="password"
                        value={ customSecret }
                        onChange={ ( e ) =>
                            setCustomSecret( e.target.value )
                        }
                        helperText={ __(
                            'Provide your own secret for webhook requests.',
                            'rest-api-firewall'
                        ) }
                        fullWidth
                    />
                    <Stack
                        direction="row"
                        spacing={ 2 }
                        alignItems="center"
                    >
                        <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            onClick={ saveCustomSecret }
                        >
                            { __(
                                'Save Custom Secret',
                                'rest-api-firewall'
                            ) }
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={ () => {
                                setUseCustomSecret( false );
                                setCustomSecret( '' );
                            } }
                        >
                            { __( 'Cancel', 'rest-api-firewall' ) }
                        </Button>
                    </Stack>
                </Stack>
            </Collapse>

            { isRevealed && (
                <Alert severity="info">
                    { __(
                        'This secret is shown only once. Copy it now and store it securely.',
                        'rest-api-firewall'
                    ) }
                </Alert>
            ) }

            <Stack
                direction="row"
                spacing={ 2 }
                alignItems="center"
                flexWrap="wrap"
            >
                <Button
                    variant="outlined"
                    size="small"
                    sx={ { display: 'inline-flex' } }
                    startIcon={ <DeleteOutlineIcon /> }
                    onClick={ () =>
                        setConfirmAction( 'delete' )
                    }
                    disabled={ ! hasSecret }
                >
                    { __( 'Revoke', 'rest-api-firewall' ) }
                </Button>

                <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    startIcon={ <AutorenewIcon /> }
                    onClick={ () =>
                        setConfirmAction( 'regenerate' )
                    }
                    disabled={ useCustomSecret }
                >
                    { __( 'Regenerate', 'rest-api-firewall' ) }
                </Button>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={ useCustomSecret }
                            onChange={ ( e ) =>
                                setUseCustomSecret( e.target.checked )
                            }
                            size="small"
                        />
                    }
                    label={ __(
                        'I will paste my own secret',
                        'rest-api-firewall'
                    ) }
                />
            </Stack>
        </Stack>
    </Stack>

    <Dialog
        open={ confirmOpen }
        onClose={ () => setConfirmAction( null ) }
        aria-labelledby="confirm-dialog-title"
        maxWidth="xs"
    >
        <DialogTitle id="confirm-dialog-title">
            { confirmAction && confirmConfig[ confirmAction ].title }
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
                { confirmAction &&
                    confirmConfig[ confirmAction ].content }
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button
                onClick={ () => setConfirmAction( null ) }
                variant="outlined"
            >
                { __( 'Cancel', 'rest-api-firewall' ) }
            </Button>

            <Button onClick={ handleConfirm } variant="contained">
                { __( 'Confirm', 'rest-api-firewall' ) }
            </Button>
        </DialogActions>
    </Dialog>

    <Snackbar
        open={ snackbarOpen }
        autoHideDuration={ 5000 }
        onClose={ () => setSnackbarOpen( false ) }
        anchorOrigin={ { vertical: 'bottom', horizontal: 'right' } }
    >
        <Alert
            onClose={ () => setSnackbarOpen( false ) }
            severity={ snackbarSeverity }
            sx={ { width: '100%' } }
        >
            { snackbarContent }
        </Alert>
    </Snackbar>
</>);
}
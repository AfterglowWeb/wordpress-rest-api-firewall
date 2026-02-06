import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
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
import Alert from '@mui/material/Alert';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import WebhookAuthGenerated from './WebhookAuthGenerated';
import WebhookAuthCustom from './WebhookAuthCustom';

export default function WebhookAuth( { hasSecret, setHasSecret, form, setField } ) {
    const { adminData } = useAdminData();

    const { __ } = wp.i18n || {};

    const [ webhookSecret, setWebhookSecret ] = useState( null );
    const [ customSecret, setCustomSecret ] = useState( '' );
    const [ showSecretGuide, setShowSecretGuide ] = useState( false );

    const [ snackbarConfig, setSnackbarConfig ] = useState( {
        open: false,
        severity: 'info',
        content: '',
    } );

    const [ confirmAction, setConfirmAction ] = useState( null );
    const [ confirmConfig, setConfirmConfig ] = useState( {} );
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

    const handleConfirm = async () => {
        if ( ! confirmAction || ! confirmConfig[ confirmAction ] ) {
            return;
        }
        await confirmConfig[ confirmAction ].action();
        setConfirmAction( null );
    };

    const handleGeneratedConfirmActions = ( action ) => {
        setConfirmAction( action );
        setConfirmConfig( {
            delete: {
                title: __( 'Revoke Webhook Secret', 'rest-api-firewall' ),
                content: __(
                    'Any applications using this webhook secret will stop working. Continue?',
                    'rest-api-firewall'
                ),
                action: async () => {
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
                        setField( { target: { name: 'application_webhook_custom_secret_enabled', value: false } } );

                        setSnackbarConfig( {
                            open: true,
                            severity: 'success',
                            content: result.data.message || '',
                        } );
                    }
                },
            },
            regenerate: {
                title: __( 'Regenerate Webhook Secret', 'rest-api-firewall' ),
                content: __(
                    'Regenerating the webhook secret will invalidate the current one. Any applications using the old secret will stop working. Continue?',
                    'rest-api-firewall'
                ),
                action: async () => {
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
                        setField( { target: { name: 'application_webhook_custom_secret_enabled', value: false } } );

                        setSnackbarConfig( {
                            open: true,
                            severity: 'success',
                            content: __(
                                'Application webhook secret generated successfully.',
                                'rest-api-firewall'
                            ),
                        } );
                    }
                },
            },
        } );
    };

    const saveCustomSecret = async () => {
        if ( ! customSecret || customSecret.length === 0 ) {
            setSnackbarConfig( {
                open: true,
                severity: 'error',
                content: __(
                    'Please provide a custom secret.',
                    'rest-api-firewall'
                ),
            } );
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
                    action: 'update_application_webhook_custom_secret',
                    nonce: adminData.nonce,
                    custom_secret: customSecret,
                } ),
            } );

            const result = await response.json();

            if ( result?.success ) {
                setWebhookSecret( customSecret );
                setHasSecret( true );
                setCustomSecret( '' );

                setSnackbarConfig( {
                    open: true,
                    severity: 'success',
                    content: __(
                        'Custom webhook secret saved successfully.',
                        'rest-api-firewall'
                    ),
                } );
            } else {
                setSnackbarConfig( {
                    open: true,
                    severity: 'error',
                    content:
                        result?.data?.message ||
                        __(
                            'Failed to save custom secret.',
                            'rest-api-firewall'
                        ),
                } );
            }
        } catch ( error ) {
            setSnackbarConfig( {
                open: true,
                severity: 'error',
                content: error.message,
            } );
        }
    };

    return (
        <>
            <Stack spacing={ 3 } flex={ 1 } width={ '100%' } maxWidth={ 500 }>
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

                    <Stack>
                    <Collapse in={ ! form.application_webhook_custom_secret_enabled } timeout="auto">
                        <WebhookAuthGenerated
                            hasSecret={ hasSecret }
                            webhookSecret={ webhookSecret }
                        />
                    </Collapse>
                    <Collapse in={ form.application_webhook_custom_secret_enabled } timeout="auto">
                        <WebhookAuthCustom
                            hasSecret={ hasSecret }
                            customSecret={ customSecret }
                            setCustomSecret={ setCustomSecret }
                        />
                    </Collapse>
                    </Stack>

                    <Stack
                        direction="row"
                        gap={ 2 }
                        sx={{mt: '16px!important'}}
                        alignItems="center"
                        flexWrap="wrap"
                    >
                        <FormControlLabel
                        sx={{flex:1, flexBasis:'100%', px:1}}
                        control={
                            <Checkbox
                                name="application_webhook_custom_secret_enabled"
                                checked={
                                    form.application_webhook_custom_secret_enabled
                                }
                                onChange={ setField }
                                size="small"
                            />
                        }
                        label={ __(
                            'I will use my own secret',
                            'rest-api-firewall'
                        ) }
                        />

                        <Button
                            variant="outlined"
                            size="small"
                            sx={ { display: 'inline-flex' } }
                            startIcon={ <DeleteOutlineIcon /> }
                            onClick={ () => handleGeneratedConfirmActions( 'delete' ) }
                            disabled={ ! hasSecret }
                        >
                            { __( 'Revoke', 'rest-api-firewall' ) }
                        </Button>

                        <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            startIcon={ <AutorenewIcon /> }
                            onClick={ () => handleGeneratedConfirmActions( 'regenerate' ) }
                            disabled={ form.application_webhook_custom_secret_enabled }
                        >
                            { hasSecret && ! form.application_webhook_custom_secret_enabled
                                ? __( 'Regenerate', 'rest-api-firewall' )
                                : __( 'Generate', 'rest-api-firewall' ) }
                        </Button>

                        <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            onClick={ saveCustomSecret }
                            disabled={ ! form.application_webhook_custom_secret_enabled || hasSecret }
                        >
                            { __( 'Save Custom Secret', 'rest-api-firewall' ) }
                        </Button>
                        
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={ 1 }
                        alignItems="center"
                        justifyContent="flex-start"
                        onClick={ () =>
                            setShowSecretGuide( ! showSecretGuide )
                        }
                        sx={ { px: 1, cursor: 'pointer', userSelect: 'none' } }
                    >
                        <Typography
                            variant="body1"
                            color="primary"
                            sx={ { flex: 1 } }
                        >
                            { __(
                                'How to validate the secret in my application?',
                                'rest-api-firewall'
                            ) }
                        </Typography>
                        <ExpandMoreIcon />
                    </Stack>
                    <Collapse in={ showSecretGuide } timeout="auto">
                        <Stack
                            spacing={ 1.5 }
                            sx={ {
                                p: 2,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                            } }
                        >
                            <Typography variant="body2">
                                { __(
                                    'The secret is used to sign webhook requests using HMAC-SHA256. Your application must validate the',
                                    'rest-api-firewall'
                                ) }
                                { ' ' }
                                <code>X-Webhook-Signature</code>
                                { ' ' }
                                { __( 'header by computing:', 'rest-api-firewall' ) }
                            </Typography>
                            <Box
                                component="pre"
                                sx={ {
                                    p: 1.5,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0',
                                    fontSize: '0.85rem',
                                    overflow: 'auto',
                                    fontFamily: 'monospace',
                                } }
                            >
                                {
                                    'hash_hmac("sha256", payload + timestamp, secret)'
                                }
                            </Box>
                            <Typography variant="body2">
                                { __(
                                    'The timestamp is sent in the',
                                    'rest-api-firewall'
                                ) }
                                { ' ' }
                                <code>X-Webhook-Timestamp</code>
                                { ' ' }
                                { __( 'header.', 'rest-api-firewall' ) }
                            </Typography>
                        </Stack>
                    </Collapse>
                </Stack>
            </Stack>

            <Dialog
                open={ confirmOpen }
                onClose={ () => setConfirmAction( null ) }
                aria-labelledby="confirm-dialog-title"
                maxWidth="xs"
            >
                <DialogTitle id="confirm-dialog-title">
                    { confirmAction && confirmConfig[ confirmAction ]?.title }
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        { confirmAction &&
                            confirmConfig[ confirmAction ]?.content }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={ () => setConfirmAction( null ) }
                        variant="outlined"
                    >
                        { __( 'Cancel', 'rest-api-firewall' ) }
                    </Button>

                    <Button
                        onClick={ handleConfirm }
                        variant="contained"
                    >
                        { __( 'Confirm', 'rest-api-firewall' ) }
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={ snackbarConfig.open }
                autoHideDuration={ 5000 }
                onClose={ () =>
                    setSnackbarConfig( { ...snackbarConfig, open: false } )
                }
                anchorOrigin={ { vertical: 'center', horizontal: 'center' } }
            >
                <Alert
                    onClose={ () =>
                        setSnackbarConfig( { ...snackbarConfig, open: false } )
                    }
                    severity={ snackbarConfig.severity }
                    sx={ { width: '100%' } }
                >
                    { snackbarConfig.content }
                </Alert>
            </Snackbar>
        </>
    );
}
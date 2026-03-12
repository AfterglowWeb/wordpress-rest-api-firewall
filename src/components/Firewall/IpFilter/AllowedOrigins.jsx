import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';
import { useDialog, DIALOG_TYPES } from '../../../contexts/DialogContext';
import { isValidOrigin } from '../../../utils/sanitizeHost';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import AddIcon from '@mui/icons-material/Add';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

export default function AllowedOrigins( { disabled = false } ) {
	const { __ } = wp.i18n || {};
    const { adminData } = useAdminData();
    const { proNonce } = useLicense();
    const nonce = proNonce || adminData.nonce;
    const { selectedApplicationId } = useApplication();

    const { openDialog } = useDialog();

    const [ allowedOrigins, setAllowedOrigins ] = useState( [] );
    const [ originInput, setOriginInput ] = useState( '' );
    const [ originError, setOriginError ] = useState( '' );
    const [ originsSaving, setOriginsSaving ] = useState( false );
    const [ dirty, setDirty ] = useState( false );
    const [ anchorEl, setAnchorEl ] = useState( null );
    const open = Boolean( anchorEl );

    const loadAllowedOrigins = useCallback( async () => {
        if ( ! selectedApplicationId ) {
            setAllowedOrigins( [] );
            return;
        }
        try {
            const res = await fetch( adminData.ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: new URLSearchParams( { action: 'get_application_entry', nonce, id: selectedApplicationId } ),
            } );
            const result = await res.json();
            if ( result?.success && result?.data?.entry ) {
                setAllowedOrigins( result.data.entry.settings?.allowed_origins || [] );
            }
        } catch {}
    }, [ adminData, nonce, selectedApplicationId ] );

    const saveAllowedOrigins = useCallback( async ( origins ) => {
        if ( ! selectedApplicationId ) return;
        setOriginsSaving( true );
        try {
            const res = await fetch( adminData.ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: new URLSearchParams( { action: 'get_application_entry', nonce, id: selectedApplicationId } ),
            } );
            const result = await res.json();
            const entry = result?.success ? result.data.entry : {};
            const existingSettings = entry.settings || {};
            await fetch( adminData.ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: new URLSearchParams( {
                    action: 'update_application_entry',
                    nonce,
                    id: selectedApplicationId,
                    title: entry.title || '',
                    settings: JSON.stringify( { ...existingSettings, allowed_origins: origins } ),
                } ),
            } );
        } catch {} finally {
            setOriginsSaving( false );
        }
    }, [ adminData, nonce, selectedApplicationId ] );

    const handleAddOrigin = useCallback( () => {
        const val = originInput.trim();
        if ( ! val ) return;
        if ( ! isValidOrigin( val ) ) {
            setOriginError( __( 'Invalid origin. Use https://domain.com[:port] format.', 'rest-api-firewall' ) );
            return;
        }
        if ( allowedOrigins.includes( val ) ) {
            setOriginError( __( 'Already added.', 'rest-api-firewall' ) );
            return;
        }
        setAllowedOrigins( [ ...allowedOrigins, val ] );
        setOriginInput( '' );
        setOriginError( '' );
        setDirty( true );
    }, [ originInput, allowedOrigins, __ ] );

    const handleSave = useCallback( () => {
        openDialog( {
            type: DIALOG_TYPES.CONFIRM,
            title: __( 'Save Allowed Origins', 'rest-api-firewall' ),
            content: __( 'Update the allowed origins policy for this application? Requests with an Origin header not in this list will be rejected.', 'rest-api-firewall' ),
            confirmLabel: __( 'Save', 'rest-api-firewall' ),
            onConfirm: async () => {
                await saveAllowedOrigins( allowedOrigins );
                setDirty( false );
            },
        } );
    }, [ openDialog, allowedOrigins, saveAllowedOrigins, __ ] );

    useEffect( () => {
        loadAllowedOrigins();
    }, [ loadAllowedOrigins ] );

    const originsLabel = allowedOrigins.length > 0
        ? `${ allowedOrigins.length } ${ __( 'origin(s)', 'rest-api-firewall' ) }`
        : '';

    return (
        <>
            <Tooltip title={ disabled ? __( 'Allowed origins are only enforced in whitelist mode.', 'rest-api-firewall' ) : '' }>
                <Stack direction="row" alignItems="center" gap={ 1 }>
                    { originsLabel && (
                        <Chip size="small" variant="outlined" label={ originsLabel } />
                    ) }
                    <Button
                        size="small"
                        variant="text"
                        disabled={ disabled }
                        onClick={ ( e ) => setAnchorEl( e.currentTarget ) }
                    >
                        { __( 'Set Allowed Origins', 'rest-api-firewall' ) }
                    </Button>
                </Stack>
            </Tooltip>

            <Popover
                open={ open }
                anchorEl={ anchorEl }
                onClose={ () => setAnchorEl( null ) }
                anchorOrigin={ { vertical: 'bottom', horizontal: 'right' } }
                transformOrigin={ { vertical: 'top', horizontal: 'right' } }
            >
                <Paper sx={ { p: 2, maxWidth: 400 } }>
                    
                    <Stack spacing={ 1.5 }>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            { __( 'Set Allowed Origins', 'rest-api-firewall' ) }
                        </Typography>
                        <Stack direction="row" spacing={ 1 } alignItems="flex-start">
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="https://app.example.com"
                                value={ originInput }
                                onChange={ ( e ) => { setOriginInput( e.target.value ); setOriginError( '' ); } }
                                onKeyDown={ ( e ) => { if ( e.key === 'Enter' ) handleAddOrigin(); } }
                                error={ !! originError }
                                helperText={ originError || __( 'https://domain.com or https://domain.com:port', 'rest-api-firewall' ) }
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={ handleAddOrigin }
                                disabled={ ! originInput.trim() || originsSaving }
                                sx={ { flexShrink: 0, mt: '2px' } }
                                startIcon={ <AddIcon /> }
                            >
                                { __( 'Add', 'rest-api-firewall' ) }
                            </Button>
                        </Stack>
                        { allowedOrigins.length > 0 && (
                            <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
                                { allowedOrigins.map( ( origin ) => (
                                    <Chip
                                        key={ origin }
                                        label={ origin }
                                        size="small"
                                        variant="outlined"
                                        sx={ { fontFamily: 'monospace' } }
                                        onDelete={ () => {
                                            setAllowedOrigins( allowedOrigins.filter( ( o ) => o !== origin ) );
                                            setDirty( true );
                                        } }
                                    />
                                ) ) }
                            </Box>
                        ) }
                        <Stack direction="row" justifyContent="flex-end" spacing={ 1 }>
                            <Button size="small" onClick={ () => setAnchorEl( null ) }>
                                { __( 'Close', 'rest-api-firewall' ) }
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                disableElevation
                                onClick={ handleSave }
                                disabled={ ! dirty || originsSaving }
                            >
                                { originsSaving ? __( 'Saving…', 'rest-api-firewall' ) : __( 'Save', 'rest-api-firewall' ) }
                            </Button>
                        </Stack>

                        <Divider />

                        <Typography variant="body2" color="text.secondary">
                            { __( 'Use in conjunction with IP whitelisting — on shared hosting or behind a CDN, this ensures only requests from known origins are accepted alongside whitelisted IPs.', 'rest-api-firewall' ) }
                        </Typography>
                        <Alert severity="warning" icon={ <WarningAmberOutlinedIcon fontSize="small" /> }>
                            { __( 'The Origin header is client-controlled and can be spoofed. Always combine with IP whitelisting and user authentication.', 'rest-api-firewall' ) }
                        </Alert>
                    </Stack>
                    
                </Paper>
            </Popover>
        </>
    );
}
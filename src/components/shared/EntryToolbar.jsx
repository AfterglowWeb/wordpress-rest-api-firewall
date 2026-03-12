import { useEffect, useRef } from '@wordpress/element';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { WP_ADMIN_BAR_HEIGHT_DESKTOP, WP_ADMIN_BAR_HEIGHT_MOBILE } from '../Navigation';

export default function EntryToolbar( { isNew, title, author, dateCreated, dateModified, handleBack, handleSave, handleDelete, saving, enabled = null, setEnabled = null, dirtyFlag = null, breadcrumb = null, children } ) {
    const { __ } = wp.i18n || {};
    const { openDialog } = useDialog();

    const handleBackClick = () => {
        if ( dirtyFlag?.has ) {
            openDialog( {
                type: DIALOG_TYPES.CONFIRM,
                title: __( 'Unsaved Changes', 'rest-api-firewall' ),
                content: dirtyFlag.message || __( 'You have unsaved changes. Are you sure you want to go back?', 'rest-api-firewall' ),
                confirmLabel: __( 'Go Back', 'rest-api-firewall' ),
                onConfirm: handleBack,
            } );
        } else {
            handleBack();
        }
    };

    // Keep a ref to handleBackClick so the popstate listener always calls the latest version
    const handleBackClickRef = useRef( handleBackClick );
    handleBackClickRef.current = handleBackClick;

    useEffect( () => {
        // Push a new history entry when the editor opens so browser back can trigger our handler
        window.history.pushState( { entryEditor: true }, '' );

        const onPopState = () => {
            // Re-push immediately so if the user cancels the dialog, history is preserved
            window.history.pushState( { entryEditor: true }, '' );
            handleBackClickRef.current();
        };

        window.addEventListener( 'popstate', onPopState );
        return () => window.removeEventListener( 'popstate', onPopState );
    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    return (
            <Toolbar
                sx={ {
                    gap: 2,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    flexWrap: 'wrap',
                    py: { xs: 2, sm: 1 },
                    position: 'sticky',
                    top: { xs: WP_ADMIN_BAR_HEIGHT_MOBILE, md: WP_ADMIN_BAR_HEIGHT_DESKTOP },
                    bgcolor: 'background.paper',
                    zIndex: 'appBar',
                } }
            >
                <Stack direction="row" gap={ 2 } alignItems="center">
                    <IconButton
                        size="small"
                        onClick={ handleBackClick }
                        aria-label={ __( 'Back', 'rest-api-firewall' ) }
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    { typeof enabled === 'boolean' && setEnabled && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={ enabled }
                                    onChange={ ( e ) =>
                                        setEnabled( e.target.checked )
                                    }
                                    size="small"
                                />
                            }
                            label={ __(
                                'Active',
                                'rest-api-firewall'
                            ) }
                        />
                    ) }

                    
                    <Stack
                        spacing={ 0 }
                        direction={ { xs: 'column', sm: 'row' } }
                        alignItems={ { xs: 'flex-start', sm: 'center' } }
                        gap={ { xs: 0, sm: 2 } }
                    >
                        <Stack>
                            { breadcrumb && breadcrumb.length > 0 && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={ {
                                        display: 'block',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    } }
                                >
                                    { breadcrumb.join( ' › ' ) }
                                </Typography>
                            ) }
                        <Typography
                            variant="h6"
                            fontWeight={ 600 }
                            color="text.primary"
                            sx={ { lineHeight: 1.2 } }
                        >
                            { title || ( isNew ? `${ __( 'New', 'rest-api-firewall' ) } ${ breadcrumb?.at( -1 ) ?? __( 'Entry', 'rest-api-firewall' ) }` : __( 'Entry', 'rest-api-firewall' ) ) }
                        </Typography>
                        </Stack>

                        <Divider orientation="vertical" flexItem />

                        { ( author || dateCreated || dateModified ) && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                { ( author || dateCreated ) && (
                                    <span>
                                        { author && author }
                                        { dateCreated && ` @ ${ dateCreated }` }
                                    </span>
                                ) }
                                { dateModified && (
                                    <>
                                        <br />
                                        <span>
                                            { __(
                                                'Mod.',
                                                'rest-api-firewall'
                                            ) }{ ' ' }
                                            { dateModified }
                                        </span>
                                    </>
                                ) }
                            </Typography>
                        ) }
                    </Stack>
                </Stack>
                <Stack direction="row" gap={ 2 }>
                    { children }
                    <Button
                        variant="contained"
                        size="small"
                        disableElevation
                        disabled={ saving || ! title.trim() }
                        onClick={ handleSave }
                    >
                        { isNew ? __( 'Create', 'rest-api-firewall' ) : __( 'Save', 'rest-api-firewall' ) }
                    </Button>

                    { ! isNew && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={ <DeleteOutlineIcon /> }
                            onClick={ handleDelete }
                        >
                            { __( 'Delete', 'rest-api-firewall' ) }
                        </Button>
                    ) }
                </Stack>
            </Toolbar>
    );
}

import { useEffect, useRef } from '@wordpress/element';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import CloseIcon from '@mui/icons-material/Close';

import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { WP_ADMIN_BAR_HEIGHT_DESKTOP, WP_ADMIN_BAR_HEIGHT_MOBILE, APP_BAR_HEIGHT } from '../Navigation';
import Documentation from '../Documentation/Documentation';
import PanelBreadcrumb from './PanelBreadcrumb';

export default function EntryToolbar( { 
    isNew, 
    title, 
    author, 
    dateCreated, 
    dateModified, 
    handleBack, 
    handleSave, 
    handleDelete, 
    saving, 
    canSave = undefined, 
    enabled = null, 
    setEnabled = null, 
    dirtyFlag = null, 
    breadcrumb = null, 
    newEntryLabel = null, 
    docPage = null, 
    entryExtraMetas = null, 
    showAppLink = true, 
    children = null } ) {
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

    const handleBackClickRef = useRef( handleBackClick );
    handleBackClickRef.current = handleBackClick;

    useEffect( () => {
        window.history.pushState( { entryEditor: true }, '' );

        const onPopState = () => {
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
                    py: {xs: 2, xl: 0},
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    flexWrap: 'wrap',
                    position: 'sticky',
                    minHeight: { xs: 'auto', xl: APP_BAR_HEIGHT },
                    top: { xs: WP_ADMIN_BAR_HEIGHT_MOBILE, md: WP_ADMIN_BAR_HEIGHT_DESKTOP },
                    bgcolor: 'background.paper',
                    zIndex: 'appBar',
                } }
            >
            

                
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" gap={ 2 } sx={ { minWidth: 0 } }>
                    { typeof enabled === 'boolean' && setEnabled && (

                    <FormControlLabel
                        sx={{marginRight: 0}}
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
                    { typeof enabled === 'boolean' && setEnabled && (
                    <Divider sx={{display:{ xs: 'none', sm: 'block' }}} orientation="vertical" flexItem />
                    ) }
                    <Stack>
                        <PanelBreadcrumb
                            label={ breadcrumb || null }
                            navigable={ !! breadcrumb }
                            disabled={ saving }
                            showAppLink={ showAppLink }
                        />

                        <Stack sx={ { minWidth: 0 } }>
                            <Typography
                                variant="h6"
                                fontWeight={ 600 }
                                color={ isNew ? 'text.secondary' : 'text.primary' }
                                sx={ { lineHeight: 'normal' } }
                            >
                                { title || ( isNew ? newEntryLabel : '...' ) }
                            </Typography>
                        </Stack>

                    </Stack>

                    { entryExtraMetas && (
                        <Stack direction="row" gap={ 1 } alignItems="center" sx={ { flexWrap: 'wrap' } }>
                            { entryExtraMetas }
                        </Stack>
                    ) }

                    { ( author || dateCreated || dateModified ) && (     
                         <Stack direction="row" gap={ 1 } alignItems="center" sx={ { flexWrap: 'wrap' } }>
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
                        </Stack>
                    ) }

                </Stack>

                <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={ 2 }>
                    
                    { children && children }

                    { docPage && <Documentation page={ docPage } /> }
                    
                    <Button
                        variant="contained"
                        size="small"
                        disableElevation
                        disabled={ saving || ! title.trim() || ( canSave !== undefined && ! canSave ) }
                        onClick={ handleSave }
                    >
                        { isNew ? __( 'Create', 'rest-api-firewall' ) : __( 'Save', 'rest-api-firewall' ) }
                    </Button>


                    { ! isNew && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={ handleDelete }
                        >
                            { __( 'Delete', 'rest-api-firewall' ) }
                        </Button>
                    ) }

                    <Tooltip title={ __( 'Close', 'rest-api-firewall' ) }>
                        <IconButton sx={{border:'1px solid', borderColor: 'divider'}} size="small" onClick={ handleBackClick }>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                </Stack>
            </Toolbar>
    );
}

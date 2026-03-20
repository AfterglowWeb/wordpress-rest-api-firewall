import { useEffect, useRef } from '@wordpress/element';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { WP_ADMIN_BAR_HEIGHT_DESKTOP, WP_ADMIN_BAR_HEIGHT_MOBILE, APP_BAR_HEIGHT } from '../Navigation';
import Documentation from '../Documentation/Documentation';
import PanelBreadcrumb from './PanelBreadcrumb';

export default function EntryToolbar( { isNew, title, author, dateCreated, dateModified, handleBack, handleSave, handleDelete, saving, enabled = null, setEnabled = null, dirtyFlag = null, breadcrumb = null, docPage = null, titleSuffix = null, showAppLink = true, canSave = undefined, children } ) {
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
            

                
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={ 2 } sx={ { minWidth: 0 } }>
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
                                color="text.primary"
                                sx={ { lineHeight: 'normal' } }
                            >
                                { title || ( isNew ? `${ __( 'New', 'rest-api-firewall' ) } ${ breadcrumb ?? __( 'Entry', 'rest-api-firewall' ) }` : __( 'Entry', 'rest-api-firewall' ) ) }
                            </Typography>
                            { titleSuffix && titleSuffix }
                        </Stack>

                    </Stack>

                    <Divider sx={{display:{ xs: 'none', sm: 'block' }}} orientation="vertical" flexItem />

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

                <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={ 2 }>
                    
                    { children }

                    
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

                     <Button
                        variant="outlined"
                        size="small"
                        sx={{color: 'text.secondary', borderColor: 'text.disabled'}}
                        disableElevation
                        onClick={ handleBackClick }
                    >
                        { __( 'Cancel', 'rest-api-firewall' ) }
                    </Button>


                   { docPage && <Documentation page={ docPage } /> }
                </Stack>
            </Toolbar>
    );
}

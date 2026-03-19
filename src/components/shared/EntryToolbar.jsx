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
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { WP_ADMIN_BAR_HEIGHT_DESKTOP, WP_ADMIN_BAR_HEIGHT_MOBILE, APP_BAR_HEIGHT } from '../Navigation';
import Documentation from '../Documentation/Documentation';

export default function EntryToolbar( { isNew, title, author, dateCreated, dateModified, handleBack, handleSave, handleDelete, saving, enabled = null, setEnabled = null, dirtyFlag = null, breadcrumb = null, docPage = null, titleSuffix = null, showAppLink = true, canSave = undefined, children } ) {
    const { __ } = wp.i18n || {};
    const { openDialog } = useDialog();
    const { selectedApplication, selectedApplicationId } = useApplication();
    const { navigateGuarded } = useNavigation();

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

    const appLink = showAppLink && selectedApplication && selectedApplicationId;

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
                <Stack direction="row" gap={ 2 } alignItems="flex-end" sx={ { minWidth: 0 } }>
                    <IconButton
                        size="small"
                        onClick={ handleBackClick }
                        aria-label={ __( 'Back', 'rest-api-firewall' ) }
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    <Stack direction="row" alignItems="center" gap={ 2 } maxWidth={200} sx={{transition:'all 1s', opacity: appLink ? 1 : 0.5}}>
                        <Button
                            disabled={ saving }
                            variant="text"
                            onClick={ selectedApplicationId ? () => navigateGuarded( 'applications', selectedApplicationId ) : () => navigateGuarded( 'applications' ) }
                            sx={ {
                                color: saving ? 'text.disabled' : 'text.primary',
                                fontSize: '20px',
                                maxWidth: '200px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textTransform: 'none',
                                lineHeight: 'normal',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
                                cursor: saving ? 'default' : 'pointer',
                            } }
                        >
                            { selectedApplication && selectedApplication.title ? selectedApplication.title : __( 'Applications', 'rest-api-firewall' ) }
                        </Button>
                    </Stack>

                    <Divider orientation="vertical" flexItem />

                    <Stack spacing={-0.4} sx={ { minWidth: 0 } }>
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
                                { breadcrumb.join( ' / ' ) }
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
                        { titleSuffix && titleSuffix }
                    </Stack>

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

                    <Button
                        variant="contained"
                        size="small"
                        disableElevation
                        disabled={ saving || ! title.trim() || ( canSave !== undefined && ! canSave ) }
                        onClick={ handleSave }
                    >
                        { isNew ? __( 'Create', 'rest-api-firewall' ) : __( 'Save', 'rest-api-firewall' ) }
                    </Button>

                     <Button
                        variant="outlined"
                        size="small"
                        sx={{color: 'text.secondary', borderColor: 'text.disabled'}}
                        disableElevation
                        onClick={ handleBackClick }
                    >
                        { __( 'Cancel', 'rest-api-firewall' ) }
                    </Button>


                    { ! isNew && (
                        <Button
                            color="error"
                            size="small"
                            startIcon={ <DeleteOutlineIcon /> }
                            onClick={ handleDelete }
                        >
                            { __( 'Delete', 'rest-api-firewall' ) }
                        </Button>
                    ) }


                   { docPage && <Documentation page={ docPage } /> }
                </Stack>
            </Toolbar>
    );
}

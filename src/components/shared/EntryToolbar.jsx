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

export default function EntryToolbar( { isNew, title, author, dateCreated, dateModified, handleBack, handleSave, handleDelete, saving, enabled = null, setEnabled = null, dirtyFlag = null, children } ) {
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
                        <Typography
                            variant="h6"
                            fontWeight={ 600 }
                            sx={ { flex: 1, minWidth: 0 } }
                            noWrap
                        >
                            { title || __( 'New Entry', 'rest-api-firewall' ) }
                        </Typography>
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

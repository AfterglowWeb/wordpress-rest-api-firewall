import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export default function EntryToolbar( { isNew, title, author, dateCreated, dateModified, handleBack, handleSave, handleDelete, saving, enabled = null, setEnabled = null, saveLabel = null, children } ) {
    const { __ } = wp.i18n || {};

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
                <Stack direction="row" gap={ 2 }>
                    <Stack alignItems="center" justifyContent="center">
                        <IconButton
                            size="small"
                            onClick={ handleBack }
                            aria-label={ __( 'Back', 'rest-api-firewall' ) }
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    </Stack>
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
                            <Stack
                                direction={ { xs: 'column', sm: 'row' } }
                                gap={ { xs: 0, xl: 2 } }
                                flexWrap="wrap"
                            >

                                {typeof enabled === 'boolean' && setEnabled && <FormControlLabel
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
                                />}

                                { ( author || dateCreated || dateModified ) && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    { ( author || dateCreated )  && (
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
                                </Typography>) }
                            </Stack>
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
                        { saveLabel || __( 'Save', 'rest-api-firewall' ) }
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

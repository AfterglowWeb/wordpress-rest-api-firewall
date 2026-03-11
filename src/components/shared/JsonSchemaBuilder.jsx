import { useCallback } from '@wordpress/element';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';

import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from '@wordpress/element';
import ListItemText from '@mui/material/ListItemText';

const TYPE_COLORS = {
    string: 'default',
    number: 'primary',
    boolean: 'info',
    object: 'secondary',
    array: 'warning',
    null: 'default',
};

function PropertyRow( {
    propKey,
    propDef,
    onUpdate,
    onRemove,
    availableBindings,
    readOnly,
    depth,
} ) {
    const { __ } = wp.i18n || {};
    const [ expanded, setExpanded ] = useState( false );
    const [ localKey, setLocalKey ] = useState( propDef._autoKey ? '' : propKey );

    const type = propDef.type || 'string';
    const bind = propDef.bind || '';
    const staticVal = propDef.staticValue || '';
    const properties = propDef.properties || {};

    const isManualObject = type === 'object' && ! bind && ! propDef.isStatic;

    const bindingFilters = bind
        ? ( availableBindings.find( ( b ) => b.key === bind )?.filters || [] )
        : [];

    const update = ( patch ) => onUpdate( propKey, { ...propDef, ...patch } );

    const handleKeyBlur = () => {
        if ( localKey !== propKey || propDef._autoKey ) {
            const cleanDef = { ...propDef };
            delete cleanDef._autoKey;
            onUpdate( propKey, cleanDef, localKey || propKey );
        }
    };

    const handleAddSubProp = () => {
        let subIdx = Object.keys( properties ).length + 1;
        let subKey = `property_${ subIdx }`;
        while ( properties[ subKey ] !== undefined ) {
            subIdx++;
            subKey = `property_${ subIdx }`;
        }
        update( {
            properties: {
                ...properties,
                [ subKey ]: { type: 'string', bind: '', _autoKey: true },
            },
        } );
        setExpanded( true );
    };

    const handleSubUpdate = ( subKey, subDef, newSubKey ) => {
        if ( newSubKey && newSubKey !== subKey ) {
            const rebuilt = {};
            for ( const [ k, v ] of Object.entries( properties ) ) {
                rebuilt[ k === subKey ? newSubKey : k ] =
                    k === subKey ? subDef : v;
            }
            update( { properties: rebuilt } );
        } else {
            update( { properties: { ...properties, [ subKey ]: subDef } } );
        }
    };

    const handleSubRemove = ( subKey ) => {
        const updated = { ...properties };
        delete updated[ subKey ];
        update( { properties: updated } );
    };

    return (
        <Stack
            sx={ {
                pl: depth > 0 ? 2 : 0,
                borderLeft: depth > 0 ? '2px solid' : 'none',
                borderColor: 'divider',
            } }
        >
            <Stack
                direction="row"
                gap={ 1 }
                py={ 1 }
                alignItems="center"
            >
                { isManualObject ? (
                    <IconButton
                        size="small"
                        onClick={ () => setExpanded( ( v ) => ! v ) }
                        sx={ {
                            p: 0.25,
                            transform: expanded
                                ? 'rotate(0deg)'
                                : 'rotate(-90deg)',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                        } }
                    >
                        <ExpandMoreIcon
                            fontSize="small"
                            sx={ { fontSize: 18 } }
                        />
                    </IconButton>
                ) : (
                    <Box sx={ { width: 26, flexShrink: 0 } } />
                ) }

                { ! propDef.isStatic && ! isManualObject &&
                    availableBindings && availableBindings.length > 0 && (
                    <FormControl
                        size="small"
                        required
                        sx={ { flex: 1, maxWidth: 300 } }
                        disabled={ readOnly }
                    >
                        <InputLabel sx={ { fontSize: '0.8rem' } }>
                            { __( 'Select a source', 'rest-api-firewall' ) }
                        </InputLabel>
                        <Select
                            value={ bind }
                            label={ __( 'Select a source', 'rest-api-firewall' ) }
                            onChange={ ( e ) => {
                                const newBind = e.target.value;
                                if ( newBind ) {
                                    const inferredType =
                                        availableBindings.find(
                                            ( b ) => b.key === newBind
                                        )?.type || 'string';
                                    onUpdate(
                                        propKey,
                                        {
                                            ...propDef,
                                            bind: newBind,
                                            type: inferredType,
                                            staticValue: '',
                                        }
                                    );
                                }
                            } }
                            renderValue={ ( val ) => {
                                const found = availableBindings.find(
                                    ( o ) => o.key === val
                                );
                                return found?.key ?? val;
                            } }
                        >
                            { availableBindings.map( ( b ) => (
                                <MenuItem key={ b.key } value={ b.key }>
                                    <ListItemText
                                        primary={ b.key }
                                        secondary={
                                            b.label && b.label !== b.key
                                                ? b.label
                                                : null
                                        }
                                    />
                                </MenuItem>
                            ) ) }
                        </Select>
                    </FormControl>
                ) }

                { ! propDef.isStatic && ! isManualObject && ! readOnly && (
                    <IconButton
                        size="small"
                        disabled={ ! bind }
                        title={ __( 'Copy property name from source', 'rest-api-firewall' ) }
                        onClick={ () => {
                            const inferredKey = bind.split( '.' ).pop();
                            if ( inferredKey ) {
                                setLocalKey( inferredKey );
                                const cleanDef = { ...propDef };
                                delete cleanDef._autoKey;
                                onUpdate( propKey, cleanDef, inferredKey );
                            }
                        } }
                        sx={ { flexShrink: 0 } }
                    >
                        <ContentCopyIcon sx={ { fontSize: 16 } } />
                    </IconButton>
                ) }

                <TextField
                    size="small"
                    value={ localKey }
                    onChange={ ( e ) => setLocalKey( e.target.value ) }
                    onBlur={ handleKeyBlur }
                    disabled={ readOnly }
                    placeholder={ __( 'my_property_name', 'rest-api-firewall' ) }
                    sx={ {
                        flex: 1,
                        maxWidth: 300,
                        '.MuiInputBase-input': {
                            padding: '10.5px 14px!important',
                            minHeight: 'unset!important',
                            height: '25px!important',
                            fontFamily: 'monospace',
                            fontSize: '0.82rem',
                        },
                    } }
                />

                { ( bind || propDef.isStatic || isManualObject ) && (
                    <Chip
                        label={ type || 'string' }
                        size="small"
                        color={ TYPE_COLORS[ type ] || 'default' }
                        sx={ { height: 20, fontSize: '0.7rem', flexShrink: 0 } }
                    />
                ) }

                { bindingFilters.map( ( filter ) => (
                    <Tooltip key={ filter.key } title={ filter.tooltip || filter.label }>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={ propDef.filters?.[ filter.key ] ?? false }
                                    onChange={ ( e ) =>
                                        update( {
                                            filters: {
                                                ...propDef.filters,
                                                [ filter.key ]: e.target.checked,
                                            },
                                        } )
                                    }
                                    disabled={ readOnly }
                                    sx={ { p: 0.5 } }
                                />
                            }
                            label={
                                <Typography variant="caption">
                                    { filter.label }
                                </Typography>
                            }
                            sx={ { m: 0, gap: 0.25, flexShrink: 0 } }
                        />
                    </Tooltip>
                ) ) }

                { propDef.isStatic && (
                    <TextField
                        size="small"
                        value={ staticVal }
                        onChange={ ( e ) =>
                            update( { staticValue: e.target.value } )
                        }
                        disabled={ readOnly }
                        placeholder={ __(
                            'static value',
                            'rest-api-firewall'
                        ) }
                        sx={ {
                            flex: 1,
                            maxWidth: 300,
                            '.MuiInputBase-input': {
                                padding: '10.5px 14px!important',
                                minHeight: 'unset!important',
                                height: '25px!important',
                                fontFamily: 'monospace',
                                fontSize: '0.82rem',
                            },
                        } }
                    />
                ) }

                { ! readOnly && (
                    <IconButton
                        size="small"
                        color="error"
                        onClick={ () => onRemove( propKey ) }
                        sx={ { flexShrink: 0 } }
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                ) }
            </Stack>

            { isManualObject && (
                <Collapse in={ expanded }>
                    <Stack spacing={ 0 } sx={ { mt: 0.25 } }>
                        { Object.entries( properties ).map(
                            ( [ subKey, subDef ] ) => (
                                <PropertyRow
                                    key={ subKey }
                                    propKey={ subKey }
                                    propDef={
                                        typeof subDef === 'object' &&
                                        subDef !== null
                                            ? subDef
                                            : { type: 'string' }
                                    }
                                    onUpdate={ handleSubUpdate }
                                    onRemove={ handleSubRemove }
                                    availableBindings={ availableBindings }
                                    readOnly={ readOnly }
                                    depth={ depth + 1 }
                                />
                            )
                        ) }
                        { ! readOnly && (
                            <Button
                                size="small"
                                startIcon={ <AddIcon /> }
                                onClick={ handleAddSubProp }
                                sx={ {
                                    alignSelf: 'flex-start',
                                    ml: 4,
                                    mt: 0.5,
                                } }
                            >
                                { __(
                                    'Add sub-property',
                                    'rest-api-firewall'
                                ) }
                            </Button>
                        ) }
                    </Stack>
                </Collapse>
            ) }
        </Stack>
    );
}

export default function JsonSchemaBuilder( {
    value = {},
    onChange,
    availableBindings = [],
    readOnly = false,
} ) {
    const { __ } = wp.i18n || {};

    const handleUpdate = useCallback(
        ( key, def, newKey ) => {
            if ( newKey && newKey !== key ) {
                const next = {};
                for ( const [ k, v ] of Object.entries( value ) ) {
                    next[ k === key ? newKey : k ] =
                        k === key ? def : v;
                }
                onChange( next );
            } else {
                onChange( { ...value, [ key ]: def } );
            }
        },
        [ value, onChange ]
    );

    const handleRemove = useCallback(
        ( key ) => {
            const next = { ...value };
            delete next[ key ];
            onChange( next );
        },
        [ value, onChange ]
    );

    const handleAdd = useCallback(
        ( addType = 'string' ) => {
            let idx = Object.keys( value ).length + 1;
            let key = `property_${ idx }`;
            while ( value[ key ] !== undefined ) {
                idx++;
                key = `property_${ idx }`;
            }
            const def =
                addType === 'object'
                    ? { type: 'object', _autoKey: true }
                    : addType === 'static'
                    ? { type: 'string', isStatic: true, _autoKey: true }
                    : { type: 'string', bind: '', _autoKey: true };
            onChange( { ...value, [ key ]: def } );
        },
        [ value, onChange ]
    );

    return (
        <Stack spacing={ 0 }>

            { Object.entries( value ).map( ( [ key, def ] ) => (
                <PropertyRow
                    key={ key }
                    propKey={ key }
                    propDef={
                        typeof def === 'object' && def !== null
                            ? def
                            : { type: 'string' }
                    }
                    onUpdate={ handleUpdate }
                    onRemove={ handleRemove }
                    availableBindings={ availableBindings }
                    readOnly={ readOnly }
                    depth={ 0 }
                />
            ) ) }

            { ! readOnly && (
                <Stack direction="row" gap={ 1 } mt={ 1 }>
                    <Button
                        size="small"
                        startIcon={ <AddIcon /> }
                        onClick={ () => handleAdd( 'string' ) }
                    >
                        { __( 'Add property', 'rest-api-firewall' ) }
                    </Button>
                    <Button
                        size="small"
                        startIcon={ <AddIcon /> }
                        onClick={ () => handleAdd( 'object' ) }
                    >
                        { __( 'New object', 'rest-api-firewall' ) }
                    </Button>
                    <Button
                        size="small"
                        startIcon={ <AddIcon /> }
                        onClick={ () => handleAdd( 'static' ) }
                    >
                        { __( 'Static value', 'rest-api-firewall' ) }
                    </Button>
                </Stack>
            ) }
        </Stack>
    );
}
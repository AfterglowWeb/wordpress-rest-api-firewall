import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function MultipleSelect( {
    disabled,
    label,
    helperText,
    name,
    value,
    options,
    onChange,
} ) {
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: 48 * 4.5 + 8,
                width: 250,
            },
        },
    };

    const safeValue = Array.isArray( value ) ? value : [];

    return (
        <FormControl fullWidth>
            <InputLabel disabled={ disabled } id={ `${ name }-label` }>{ label }</InputLabel>
            <Select
                disabled={ disabled }
                labelId={ `${ name }-label` }
                id={ name }
                name={ name }
                multiple
                value={ safeValue }
                onChange={ ( e ) => {
                    onChange( e );
                } }
                input={ <OutlinedInput label={ label } /> }
                renderValue={ ( selected ) => (
                    <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 0.5 } }>
                        { Array.isArray( selected )
                            ? selected.map( ( val ) => {
                                    const option = options.find(
                                        ( o ) => o.value === val
                                    );
                                    return option ? (
                                        <Chip
                                            key={ val }
                                            label={ option.label }
                                        />
                                    ) : null;
                              } )
                            : null }
                    </Box>
                ) }
                MenuProps={ MenuProps }
            >
                { options.map( ( option ) =>
                    option?.value != null && option?.label ? (
                        <MenuItem key={ option.value } value={ option.value }>
                            { option.label }
                        </MenuItem>
                    ) : null
                ) }
            </Select>
            { helperText && <FormHelperText disabled={ disabled }>{ helperText }</FormHelperText> }
        </FormControl>
    );
}
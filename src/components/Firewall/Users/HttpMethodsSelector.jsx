import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';

export const HTTP_METHODS = [ 'get', 'post', 'put', 'patch', 'delete' ];

export default function HttpMethodsSelector( { value = [], onChange, onSave, saving = false, allowedMethods = [] } ) {
	const { __ } = wp.i18n || {};
	const toggle = ( method ) => {
		if ( allowedMethods.length > 0 && ! allowedMethods.includes( method ) ) {
			return;
		}
		const next = value.includes( method )
			? value.filter( ( m ) => m !== method )
			: [ ...value, method ];
		onChange( next );
	};

	return (
		<Stack direction="row" flexWrap="wrap" gap={ 1 }>
			{ HTTP_METHODS.map( ( method ) => (
				<FormControlLabel
					key={ method }
					disabled={ allowedMethods.length > 0 && ! allowedMethods.includes( method ) }
					label={
						
							method.toUpperCase()
					}
					control={
						<Checkbox
							checked={ value.includes( method ) }
							onChange={ () => toggle( method ) }
							size="small"
							disabled={ allowedMethods.length > 0 && ! allowedMethods.includes( method ) }
						/>
					}
					sx={ {
						m: 0,
						px: 1.5,
						py: 0.5,
						userSelect: 'none',
					} }
				/>
			) ) }
            { onSave && (
                <Stack flex={1} pl={2} pt={1} direction="column" justifyContent="flex-end" alignItems="flex-end">
                    <Button
                        size="small"
                        onClick={ onSave }
                        disabled={ saving }
                        variant="contained"
                        disableElevation
                    >
                        { __( 'Save', 'rest-api-firewall' ) }
                    </Button>
                </Stack>
		    ) }
		</Stack>
	);
}

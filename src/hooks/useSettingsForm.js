import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';

function castValue( type, value ) {
	switch ( type ) {
		case 'boolean':
			return Boolean( value );
		case 'integer':
			return Number( value ) || 0;
		case 'array':
			return Array.isArray( value ) ? value : [];
		default:
			return value ?? '';
	}
}

export default function useSettingsForm( { adminData } ) {
	const optionsConfig = adminData?.options_config || {};

	const defaults = useMemo( () => {
		const d = {};
		for ( const [ key, config ] of Object.entries( optionsConfig ) ) {
			d[ key ] = castValue( config.type, config.default_value );
		}
		return d;
	}, [ optionsConfig ] );

	const [ form, setForm ] = useState( defaults );
	const [ savedForm, setSavedForm ] = useState( defaults );

	useEffect( () => {
		if ( ! adminData?.admin_options ) {
			return;
		}
		const hydrated = {};
		for ( const [ key, config ] of Object.entries( optionsConfig ) ) {
			const serverVal = adminData.admin_options[ key ];
			hydrated[ key ] = castValue(
				config.type,
				serverVal ?? config.default_value
			);
		}
		setForm( hydrated );
		setSavedForm( hydrated );
	}, [ adminData?.admin_options, optionsConfig ] );

	const setField = useCallback( ( eventOrName, maybeValue ) => {
		if ( eventOrName?.target ) {
			const { name, value, type, checked } = eventOrName.target;
			if ( ! name ) {
				return;
			}
			setForm( ( prev ) => ( {
				...prev,
				[ name ]: type === 'checkbox' ? Boolean( checked ) : value,
			} ) );
			return;
		}

		if ( typeof eventOrName === 'string' ) {
			setForm( ( prev ) => ( {
				...prev,
				[ eventOrName ]: maybeValue,
			} ) );
		}
	}, [] );

	const setSlider = useCallback( ( name, value ) => {
		const numericValue = Array.isArray( value )
			? Number( value[ 0 ] )
			: Number( value );

		setForm( ( prev ) => ( {
			...prev,
			[ name ]: Number.isFinite( numericValue ) ? numericValue : 0,
		} ) );
	}, [] );

	const optionsByGroup = useMemo( () => {
		const groups = {};
		for ( const [ key, config ] of Object.entries( optionsConfig ) ) {
			const group = config.group || 'firewall';
			if ( ! groups[ group ] ) {
				groups[ group ] = [];
			}
			groups[ group ].push( key );
		}
		return groups;
	}, [ optionsConfig ] );

	const pickGroup = useCallback(
		( groupName ) => {
			const keys = optionsByGroup[ groupName ] || [];
			const result = {};
			for ( const key of keys ) {
				if ( key in form ) {
					result[ key ] = form[ key ];
				}
			}
			return result;
		},
		[ form, optionsByGroup ]
	);

	const isGroupDirty = useCallback(
		( groupName ) => {
			const keys = optionsByGroup[ groupName ] || [];
			return keys.some( ( k ) => {
				const curr = form[ k ];
				const saved = savedForm[ k ];
				if ( Array.isArray( curr ) ) {
					return JSON.stringify( curr ) !== JSON.stringify( saved );
				}
				return curr !== saved;
			} );
		},
		[ form, savedForm, optionsByGroup ]
	);

	// Updates both form and savedForm simultaneously (for server-loaded data that should
	// not trigger a dirty state).
	const syncSavedField = useCallback( ( name, value ) => {
		setForm( ( prev ) => ( { ...prev, [ name ]: value } ) );
		setSavedForm( ( prev ) => ( { ...prev, [ name ]: value } ) );
	}, [] );

	return { form, setField, setSlider, syncSavedField, optionsByGroup, pickGroup, isGroupDirty };
}

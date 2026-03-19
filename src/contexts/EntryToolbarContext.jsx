import { createContext, useState, useCallback, useContext } from '@wordpress/element';

const EntryToolbarContext = createContext( null );

export function EntryToolbarProvider( { children } ) {
	const [ toolbarConfig, setToolbarConfig ] = useState( null );

	const registerToolbar = useCallback( ( config ) => setToolbarConfig( config ), [] );

	const updateToolbar = useCallback(
		( updates ) => setToolbarConfig( ( prev ) => ( prev ? { ...prev, ...updates } : null ) ),
		[]
	);

	const clearToolbar = useCallback( () => setToolbarConfig( null ), [] );

	return (
		<EntryToolbarContext.Provider value={ { toolbarConfig, registerToolbar, updateToolbar, clearToolbar } }>
			{ children }
		</EntryToolbarContext.Provider>
	);
}

export function useEntryToolbarContext() {
	return useContext( EntryToolbarContext );
}

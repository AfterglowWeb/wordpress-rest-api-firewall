import { useEffect, useCallback } from '@wordpress/element';
import { useEntryToolbarContext } from '../contexts/EntryToolbarContext';
import { useApplication } from '../contexts/ApplicationContext';

/**
 * Registers an editor's toolbar config with EntryToolbarContext on mount
 * and clears it (along with the dirty flag) on unmount.
 *
 * Returns an `updateToolbar` function for updating dynamic values
 * (title, enabled, saving, canSave, dirtyFlag, entryExtraMetas, children, etc.)
 * whenever they change.
 *
 * @param {object} staticConfig - Initial config, including stable function refs for
 *                                handleBack, handleSave, handleDelete, setEnabled.
 * @returns {Function} updateToolbar(updates) - Call in a useEffect to keep dynamic values in sync.
 */
export default function useRegisterToolbar( staticConfig ) {
	const { registerToolbar, updateToolbar, clearToolbar } = useEntryToolbarContext();
	const { setDirtyFlag } = useApplication();

	useEffect( () => {
		registerToolbar( staticConfig );
		return () => {
			clearToolbar();
			setDirtyFlag( { has: false, message: '' } );
		};
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return useCallback( ( updates ) => updateToolbar( updates ), [ updateToolbar ] );
}

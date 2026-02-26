import { propagateToDescendants } from './routesPolicyUtils';

export function treeReducer( state, action ) {
	switch ( action.type ) {
		case 'TOGGLE_NODE':
			return toggleNode( state, action.id, action.key );
		case 'OVERRIDE_NODE':
			return overrideNode( state, action.id, action.key, action.value );
		case 'CLEAR_OVERRIDE':
			return clearOverride( state, action.id );
		case 'RESET_ALL_OVERRIDES':
			return resetAllOverrides( state );
		case 'APPLY_TO_ALL_DESCENDANTS':
			return applyToAllDescendants( state, action.id, action.shouldApply );
		case 'TOGGLE_LOCK':
			return toggleLock( state, action.id, action.effectiveValues );
		case 'RESET':
			return action.payload;
		default:
			return state;
	}
}

function toggleNode( items, id, key ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const newValue = ! item.settings[ key ].value;
			const updated = {
				...item,
				settings: {
					...item.settings,
					[ key ]: { value: newValue, inherited: false, overridden: true },
				},
			};
			if ( updated.settings.applyToChildren && updated.children?.length ) {
				updated.children = propagateToDescendants(
					updated.children,
					key,
					newValue
				);
			}
			return updated;
		}
		if ( item.children ) {
			return { ...item, children: toggleNode( item.children, id, key ) };
		}
		return item;
	} );
}

function overrideNode( items, id, key, value ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const updated = {
				...item,
				settings: {
					...item.settings,
					[ key ]: { value, inherited: false, overridden: true },
				},
			};
			if ( updated.settings.applyToChildren && updated.children?.length ) {
				updated.children = propagateToDescendants(
					updated.children,
					key,
					value
				);
			}
			return updated;
		}
		if ( item.children ) {
			return { ...item, children: overrideNode( item.children, id, key, value ) };
		}
		return item;
	} );
}

function clearOverride( items, id ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const newSettings = { ...item.settings };
			for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
				if ( newSettings[ key ] ) {
					newSettings[ key ] = {
						...newSettings[ key ],
						value: false,
						overridden: false,
					};
				}
			}
			return { ...item, settings: newSettings };
		}
		if ( item.children ) {
			return { ...item, children: clearOverride( item.children, id ) };
		}
		return item;
	} );
}

function resetAllOverrides( items ) {
	return items.map( ( item ) => {
		const newSettings = { ...item.settings };
		for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
			if ( newSettings[ key ] ) {
				newSettings[ key ] = {
					...newSettings[ key ],
					value: false,
					overridden: false,
				};
			}
		}
		newSettings.applyToChildren = false;
		newSettings.locked = false;
		return {
			...item,
			settings: newSettings,
			children: item.children ? resetAllOverrides( item.children ) : [],
		};
	} );
}

function toggleLock( items, id, effectiveValues ) {
	return items.map( ( item ) => {
		if ( item.id === id ) {
			const nowLocked = ! item.settings?.locked;
			let newSettings = { ...item.settings, locked: nowLocked };

			// When locking, freeze the currently-visible (effective) values as
			// overridden so they persist in the diff and survive a reload.
			// effectiveValues carries the real on-screen state (global enforcements
			// already folded in) as { protect, rate_limit, disabled }.
			if ( nowLocked && effectiveValues ) {
				for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
					if ( key in effectiveValues ) {
						newSettings[ key ] = {
							...newSettings[ key ],
							value: effectiveValues[ key ],
							inherited: false,
							overridden: true,
						};
					}
				}
			}

			return { ...item, settings: newSettings };
		}
		if ( item.children ) {
			return { ...item, children: toggleLock( item.children, id, effectiveValues ) };
		}
		return item;
	} );
}

function applyToAllDescendants( items, parentId, shouldApply ) {
	return items.map( ( item ) => {
		if ( item.id === parentId ) {
			const updated = {
				...item,
				settings: { ...item.settings, applyToChildren: shouldApply },
			};
			if ( shouldApply && updated.children?.length ) {
				for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
					updated.children = propagateToDescendants(
						updated.children,
						key,
						updated.settings[ key ].value
					);
				}
			}
			return updated;
		}
		if ( item.children ) {
			return {
				...item,
				children: applyToAllDescendants( item.children, parentId, shouldApply ),
			};
		}
		return item;
	} );
}

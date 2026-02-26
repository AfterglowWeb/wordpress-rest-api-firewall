/**
 * Returns true when a node is explicitly customized (has its own settings).
 * We rely on the explicit `custom` flag set by the reducer whenever any
 * setting is changed on a node.
 */
export function isNodeCustom( settings ) {
	return !! settings?.custom;
}

/**
 * Count direct and indirect descendants that have custom settings.
 */
export function countCustomDescendants( node ) {
	let count = 0;
	for ( const child of node.children || [] ) {
		if ( isNodeCustom( child.settings ) ) {
			count++;
		}
		count += countCustomDescendants( child );
	}
	return count;
}

// Keep for external compatibility.
export function isTrulyCustomized( settings ) {
	return isNodeCustom( settings );
}

export function countModifiedDescendants( node ) {
	return countCustomDescendants( node );
}

export function findNodeById( items, id ) {
	for ( const item of items ) {
		if ( item.id === id ) {
			return item;
		}
		if ( item.children ) {
			const found = findNodeById( item.children, id );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}

export function getAllDescendantMethodIds( node ) {
	const ids = [];
	const collect = ( children ) => {
		for ( const child of children || [] ) {
			if ( child.isMethod ) {
				ids.push( child.id );
			}
			if ( child.children?.length ) {
				collect( child.children );
			}
		}
	};
	collect( node?.children );
	return ids;
}

/**
 * Propagate a setting value down to all non-custom descendants.
 * Custom nodes own their settings — the cascade stops AT them (their own
 * children will cascade from THEM separately via rehydrateCascade).
 */
export function propagateToDescendants( children, key, value ) {
	return ( children || [] ).map( ( child ) => {
		if ( child.settings?.custom ) {
			return child;
		}
		const updated = {
			...child,
			settings: {
				...child.settings,
				[ key ]: {
					value,
					inherited: true,
					overridden: false,
				},
			},
		};
		if ( updated.children?.length ) {
			updated.children = propagateToDescendants(
updated.children,
key,
value
);
		}
		return updated;
	} );
}

/**
 * After loading from DB, cascade each custom node's values down to its
 * non-custom children. This is the replacement for rehydrateApplyToChildren —
 * cascade is now always-on (no "apply to children" checkbox needed).
 */
export function rehydrateCascade( nodes ) {
return nodes.map( ( node ) => {
const updated = { ...node };

if ( updated.settings?.custom && updated.children?.length ) {
for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
updated.children = propagateToDescendants(
updated.children,
key,
updated.settings[ key ].value
);
}
}

if ( updated.children?.length ) {
updated.children = rehydrateCascade( updated.children );
}

return updated;
} );
}

// Keep the old export name for any module that imports it.
export { rehydrateCascade as rehydrateApplyToChildren };

export function normalizeTree( nodes, parentPath = '', parentSettings = null ) {
if ( ! nodes || ! Array.isArray( nodes ) ) {
return [];
}

const normalized = nodes.map( ( node ) => {
const nodePath = node.path || `${ parentPath }/${ node.label }`;
const nodeSettings = {
protect: {
value: false,
inherited: false,
overridden: false,
},
disabled: {
value: false,
inherited: false,
overridden: false,
},
rate_limit: {
value: false,
inherited: false,
overridden: false,
},
rate_limit_time: {
value: false,
inherited: false,
overridden: false,
},
custom: false,
};

if ( node.settings ) {
if ( node.settings.protect !== undefined ) {
nodeSettings.protect = {
value: !! node.settings.protect,
inherited: false,
overridden: !! ( node.settings.protect_overridden ?? false ),
};
}
if ( node.settings.disabled !== undefined ) {
nodeSettings.disabled = {
value: !! node.settings.disabled,
inherited: false,
overridden: !! ( node.settings.disabled_overridden ?? false ),
};
}
if ( node.settings.rate_limit !== undefined ) {
nodeSettings.rate_limit = {
value: !! node.settings.rate_limit,
inherited: false,
overridden: !! ( node.settings.rate_limit_overridden ?? false ),
};
}
if ( node.settings.rate_limit_time !== undefined ) {
nodeSettings.rate_limit_time = {
value: !! node.settings.rate_limit_time,
inherited: false,
overridden: false,
};
}
// Support both "custom" (new) and "locked" (legacy migration).
if ( node.settings.custom !== undefined ) {
nodeSettings.custom = !! node.settings.custom;
} else if ( node.settings.locked !== undefined ) {
nodeSettings.custom = !! node.settings.locked;
}
}

const normalizedNode = {
id: node.id ?? node.uuid ?? crypto.randomUUID(),
label: node.label,
path: nodePath,
settings: nodeSettings,
permission: node.permission,
isMethod: node.isMethod ?? false,
method: node.method,
route: node.route,
params: node.params,
children: [],
};

if ( node.children && node.children.length > 0 ) {
normalizedNode.children = normalizeTree(
node.children,
nodePath,
nodeSettings
);
}

return normalizedNode;
} );

if ( parentSettings === null ) {
return rehydrateCascade( normalized );
}
return normalized;
}
